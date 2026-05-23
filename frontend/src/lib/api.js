const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export async function uploadImages(files, onProgress) {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));

  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Upload failed");
  }

  return res.json();
}

export async function startGeneration(sessionId, style) {
  const res = await fetch(`${BASE_URL}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, style }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Generation failed to start");
  }

  return res.json();
}

export async function pollStatus(sessionId) {
  const res = await fetch(`${BASE_URL}/results/${sessionId}/status`);
  if (!res.ok) throw new Error("Failed to fetch status");
  return res.json();
}

export async function getResults(sessionId) {
  const res = await fetch(`${BASE_URL}/results/${sessionId}`);
  if (!res.ok) throw new Error("Failed to fetch results");
  return res.json();
}
