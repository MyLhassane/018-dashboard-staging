const WORKER_URL = import.meta.env.VITE_UPLOAD_WORKER_URL || "";

export interface UploadResult {
  url: string;
  fileId: string;
  fileName: string;
  size: number;
}

export interface UploadError {
  error: string;
}

export async function uploadImage(file: File, secret: string): Promise<UploadResult> {
  if (!WORKER_URL) {
    throw new Error("Upload worker URL not configured. Set VITE_UPLOAD_WORKER_URL in .env");
  }

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(WORKER_URL, {
    method: "POST",
    headers: {
      "X-Upload-Secret": secret,
    },
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Upload failed (${res.status})`);
  }

  return data as UploadResult;
}

export async function uploadImageFromDataUrl(dataUrl: string, secret: string): Promise<UploadResult> {
  // Convert data URL to File object
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const ext = dataUrl.includes("image/png") ? "png" : dataUrl.includes("image/gif") ? "gif" : dataUrl.includes("image/webp") ? "webp" : "jpg";
  const file = new File([blob], `upload.${ext}`, { type: blob.type });

  return uploadImage(file, secret);
}
