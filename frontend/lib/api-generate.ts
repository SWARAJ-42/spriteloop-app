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

export async function preGenerate(req: PreGenerateRequest): Promise<Blob> {

  console.log(API_URL)

  const token = await getToken();

  const formData = new FormData();
  formData.append("file", req.file);
  formData.append("pose_correction", String(req.pose_correction));
  formData.append("animation_type", String(req.animation_type))

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

  if (!res.ok) throw new Error(`pre-generate: HTTP ${res.status}`);

  return res.blob();
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