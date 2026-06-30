export interface Env {
  B2_KEY_ID: string;
  B2_APP_KEY: string;
  B2_BUCKET_ID: string;
  B2_BUCKET_NAME: string;
  B2_ENDPOINT: string;
  UPLOAD_SECRET: string;
  ALLOWED_ORIGINS: string;
}

interface B2AuthResponse {
  apiUrl: string;
  authorizationToken: string;
  downloadUrl: string;
}

interface B2UploadUrlResponse {
  uploadUrl: string;
  authorizationToken: string;
}

interface B2UploadResponse {
  fileId: string;
  fileName: string;
  contentType: string;
  contentLength: number;
  action: string;
}

const corsHeaders = (origins: string) => ({
  "Access-Control-Allow-Origin": origins,
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Upload-Secret",
  "Access-Control-Max-Age": "86400",
});

const CACHE_CONTROL = "public, max-age=86400";

// In-memory auth cache (survives across requests on same Worker instance)
let cachedAuth: { auth: B2AuthResponse; expiresAt: number } | null = null;
const AUTH_TTL_MS = 23 * 60 * 60 * 1000; // 23 hours (B2 tokens last 24h)

async function b2AuthorizeCached(keyId: string, appKey: string): Promise<B2AuthResponse> {
  const now = Date.now();
  if (cachedAuth && now < cachedAuth.expiresAt) {
    return cachedAuth.auth;
  }
  const encoded = btoa(`${keyId}:${appKey}`);
  const res = await fetch(`https://api.backblazeb2.com/b2api/v2/b2_authorize_account`, {
    headers: { Authorization: `Basic ${encoded}` },
  });
  if (!res.ok) throw new Error(`B2 auth failed: ${res.status}`);
  const auth = await res.json();
  cachedAuth = { auth, expiresAt: now + AUTH_TTL_MS };
  return auth;
}

async function b2GetUploadUrl(apiUrl: string, authToken: string, bucketId: string): Promise<B2UploadUrlResponse> {
  const res = await fetch(`${apiUrl}/b2api/v2/b2_get_upload_url`, {
    method: "POST",
    headers: {
      Authorization: authToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ bucketId }),
  });
  if (!res.ok) throw new Error(`B2 get upload URL failed: ${res.status}`);
  return res.json();
}

async function b2UploadFile(
  uploadUrl: string,
  uploadAuthToken: string,
  fileName: string,
  data: ArrayBuffer,
  contentType: string
): Promise<B2UploadResponse> {
  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: uploadAuthToken,
      "X-Bz-File-Name": encodeURIComponent(fileName),
      "Content-Type": contentType,
      "X-Bz-Content-Sha1": "do_not_verify",
    },
    body: data,
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`B2 upload failed: ${res.status} ${errText}`);
  }
  return res.json();
}

function generateFileName(originalName: string): string {
  const ext = originalName.split(".").pop()?.toLowerCase() || "png";
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `fifa2026/images/${timestamp}-${random}.${ext}`;
}

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

function getContentType(fileName: string): string {
  const ext = "." + fileName.split(".").pop()?.toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

async function handleUpload(request: Request, env: Env, origins: string): Promise<Response> {
  const uploadSecret = request.headers.get("X-Upload-Secret");
  if (!uploadSecret || uploadSecret !== env.UPLOAD_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders(origins) },
    });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return new Response(JSON.stringify({ error: "No file provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders(origins) },
    });
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
  if (!allowedTypes.includes(file.type)) {
    return new Response(JSON.stringify({ error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP, SVG" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders(origins) },
    });
  }

  if (file.size > 500 * 1024) {
    return new Response(JSON.stringify({ error: "File too large. Max 500KB" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders(origins) },
    });
  }

  const auth = await b2AuthorizeCached(env.B2_KEY_ID, env.B2_APP_KEY);
  const uploadUrlData = await b2GetUploadUrl(auth.apiUrl, auth.authorizationToken, env.B2_BUCKET_ID);
  const fileName = generateFileName(file.name);
  const fileBuffer = await file.arrayBuffer();
  const uploadResult = await b2UploadFile(
    uploadUrlData.uploadUrl,
    uploadUrlData.authorizationToken,
    fileName,
    fileBuffer,
    file.type
  );

  const workerUrl = new URL(request.url);
  const cdnUrl = `${workerUrl.origin}/${uploadResult.fileName}`;

  return new Response(
    JSON.stringify({
      success: true,
      url: cdnUrl,
      fileId: uploadResult.fileId,
      fileName: uploadResult.fileName,
      size: uploadResult.contentLength,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders(origins) },
    }
  );
}

async function handleRead(request: Request, env: Env, origins: string): Promise<Response> {
  const url = new URL(request.url);
  const fileName = decodeURIComponent(url.pathname.slice(1));

  if (!fileName || !fileName.includes("/")) {
    return new Response(JSON.stringify({ error: "Invalid file path" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders(origins) },
    });
  }

  // Use Cloudflare Cache API to avoid repeated B2 downloads
  const cache = caches.default;
  const cacheKey = new Request(url.toString(), request);
  const cached = await cache.match(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const auth = await b2AuthorizeCached(env.B2_KEY_ID, env.B2_APP_KEY);

    const downloadUrl = `${auth.downloadUrl}/file/${env.B2_BUCKET_NAME}/${fileName}`;
    const res = await fetch(downloadUrl, {
      headers: { Authorization: auth.authorizationToken },
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: "File not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders(origins) },
      });
    }

    const contentType = getContentType(fileName);
    const headers = new Headers({
      "Content-Type": contentType,
      "Cache-Control": CACHE_CONTROL,
      "Access-Control-Allow-Origin": origins,
    });

    const contentLength = res.headers.get("Content-Length");
    if (contentLength) headers.set("Content-Length", contentLength);

    const response = new Response(res.body, {
      status: 200,
      headers,
    });

    // Store in Cloudflare Cache (max 1 year, revalidate not needed for static images)
    const responseToCache = new Response(response.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": origins,
      },
    });
    if (contentLength) responseToCache.headers.set("Content-Length", contentLength);
    await cache.put(cacheKey, responseToCache.clone());

    return response;
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Read failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders(origins) },
    });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const allowedOrigins = env.ALLOWED_ORIGINS || "*";

    try {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: corsHeaders(allowedOrigins),
        });
      }

      if (request.method === "POST") {
        return await handleUpload(request, env, allowedOrigins);
      }

      if (request.method === "GET") {
        return await handleRead(request, env, allowedOrigins);
      }

      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders(allowedOrigins) },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message || "Internal error", stack: err.stack }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders(allowedOrigins) },
      });
    }
  },
};
