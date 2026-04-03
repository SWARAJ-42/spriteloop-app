import { auth } from "@/app/lib/firebase";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function getToken() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User not authenticated");
  }

  return await user.getIdToken();
}

// ── Phase 1 ──────────────────────────────────────────────────
export interface PreGenerateRequest {
  file: File;
  pose_correction: boolean;
  animation_type: string;
  preprocess_prompt?: string;
}

export interface PreGenerateResponse {
  processed_image: string; // base64
  prompt: string;
}

function base64ToBlob(base64: string) {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length)
    .fill(0)
    .map((_, i) => byteChars.charCodeAt(i));

  return new Blob([new Uint8Array(byteNumbers)], { type: "image/png" });
}

export async function preGenerate(
  req: PreGenerateRequest
) {

  const token = await getToken();

  const formData = new FormData();
  formData.append("file", req.file);
  formData.append("pose_correction", String(req.pose_correction));
  formData.append("animation_type", String(req.animation_type));

  if (req.preprocess_prompt?.trim()) {
    formData.append("preprocess_prompt", req.preprocess_prompt);
  }

  const res = await fetch(`${API_URL}/main/pre-generate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `pre-generate: HTTP ${res.status}`);
  }
  const response = await await res.json()

  const blob = base64ToBlob(response.processed_image);
  const prompt = response.prompt

  const result = {
    blob,
    prompt
  }

  return result;
}

// ── Phase 2 ──────────────────────────────────────────────────

// export type AnimationType = "idle" | "walking" | "running" | "jumping";

export interface GenerateAnimationRequest {
  image_base64: string;
  animation_type: string;
  additional_prompt: string
  post_process: boolean;
}

export interface GenerateAnimationResponse {
  success: boolean;
  frames?: string[];
  error?: string;
}

export async function generateAnimation(
  req: GenerateAnimationRequest
): Promise<GenerateAnimationResponse> {

  const token = await getToken();

  const res = await fetch(`${API_URL}/main/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(req),
  });

  const data = await res.json();

  // ✅ Handle backend-declared failures
  if (!res.ok || !data.success) {
    throw new Error(
      data?.error || "Something went wrong while generating animation"
    );
  }

  return data;
}

// ── Phase 3 – Save selected frames ───────────────────────────
export interface SaveGifRequest {
  job_id: string;
  project_id: number;
  gif: Blob;
}

export async function saveGif(
  req: SaveGifRequest
) {

  const token = await getToken();

  const formData = new FormData();

  formData.append("job_id", req.job_id);
  formData.append("project_id", String(req.project_id));
  formData.append("gif", req.gif, "animation.gif");

  const res = await fetch(`${API_URL}/main/save`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) throw new Error(`save-gif: HTTP ${res.status}`);

  return res.json();
}

export async function fetchProjectGenerations(projectId: number) {
  const token = await getToken();

  const res = await fetch(
    `${API_URL}/generations/${projectId}/generations`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.json();
}

export interface DeleteGenerationsRequest {
  generation_ids: number[];
}

export async function deleteGenerations(req: DeleteGenerationsRequest) {
  const token = await getToken();

  const res = await fetch(`${API_URL}/generations/delete`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(req),
  });

  if (!res.ok) throw new Error(`delete-generations: HTTP ${res.status}`);

  return res.json();
}

// ── Phase 3 – Frame Tools ───────────────────────────

export interface ProcessFramesRequest {
  frames: string[]; // base64 (without data:image prefix OR with — both ok)
}

export interface ProcessFramesResponse {
  success: boolean;
  frames: string[];
  error?: string;
}

// 🔹 Remove Background
export async function removeBackgroundFrames(
  req: ProcessFramesRequest
): Promise<ProcessFramesResponse> {
  const token = await getToken();

  const res = await fetch(`${API_URL}/main/remove-bg`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(req),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data?.error || "BG remove failed");
  }

  return data;
}

// 🔹 Pixelate
export async function pixelateFramesApi(
  req: ProcessFramesRequest
): Promise<ProcessFramesResponse> {
  const token = await getToken();

  const res = await fetch(`${API_URL}/main/pixelate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(req),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data?.error || "Pixelate failed");
  }

  return data;
}


// ── Credits ──────────────────────────────────────────────────

export interface CreditsResponse {
  credits_remaining: number;
}

export async function fetchCredits(): Promise<CreditsResponse> {

  const token = await getToken();

  const res = await fetch(`${API_URL}/main/credits`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error(`credits: HTTP ${res.status}`);

  return res.json();
}