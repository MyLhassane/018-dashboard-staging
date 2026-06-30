const corsHeaders = (origins) => ({
  "Access-Control-Allow-Origin": origins,
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Upload-Secret",
  "Access-Control-Max-Age": "86400",
});

const CACHE_CONTROL = "public, max-age=31536000, immutable";

const REPOS = ["fifa2026-images"];
const GITHUB_OWNER = "MyLhassane";

function generateFileName(originalName) {
  const ext = originalName.split(".").pop()?.toLowerCase() || "png";
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `fifa2026/images/${timestamp}-${random}.${ext}`;
}

const MIME_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

function getContentType(fileName) {
  const ext = "." + fileName.split(".").pop()?.toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

function pickRepo(fileName) {
  let hash = 0;
  for (let i = 0; i < fileName.length; i++) {
    hash = ((hash << 5) - hash + fileName.charCodeAt(i)) | 0;
  }
  return REPOS[Math.abs(hash) % REPOS.length];
}

async function githubUpload(owner, repo, path, content, token, sha) {
  const body = {
    message: `Upload ${path}`,
    content: content,
  };
  if (sha) body.sha = sha;

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "fifa2026-worker",
      },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub upload failed: ${res.status} ${err}`);
  }
  return res.json();
}

async function handleUpload(request, env, origins) {
  const uploadSecret = request.headers.get("X-Upload-Secret");
  if (!uploadSecret || uploadSecret !== env.UPLOAD_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders(origins) },
    });
  }

  const formData = await request.formData();
  const file = formData.get("file");
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

  const fileName = generateFileName(file.name);
  const repo = pickRepo(fileName);

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  const result = await githubUpload(
    GITHUB_OWNER,
    repo,
    fileName,
    base64,
    env.GITHUB_TOKEN
  );

  const rawUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${repo}/main/${fileName}`;

  return new Response(
    JSON.stringify({
      success: true,
      url: rawUrl,
      fileName: fileName,
      size: file.size,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders(origins) },
    }
  );
}

async function handleRead(request, env, origins) {
  const url = new URL(request.url);
  const fileName = decodeURIComponent(url.pathname.slice(1));

  if (!fileName || !fileName.includes("/")) {
    return new Response(JSON.stringify({ error: "Invalid file path" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders(origins) },
    });
  }

  const cache = caches.default;
  const cacheKey = new Request(url.toString(), request);
  const cached = await cache.match(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const repo = pickRepo(fileName);
    const rawUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${repo}/main/${fileName}`;
    const res = await fetch(rawUrl);

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

    const response = new Response(res.body, { status: 200, headers });
    await cache.put(cacheKey, response.clone());
    return response;
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Read failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders(origins) },
    });
  }
}

export default {
  async fetch(request, env) {
    const allowedOrigins = env.ALLOWED_ORIGINS || "*";

    try {
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders(allowedOrigins) });
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
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders(allowedOrigins) },
      });
    }
  },
};
