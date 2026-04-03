import { auth } from "@/app/lib/firebase";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function getToken() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User not authenticated");
  }

  return await user.getIdToken();
}

export async function exportAnimation({
  frames,
  type,
}: {
  frames: string[];
  type: "spritesheet" | "spine";
}) {
  const token = await getToken();
  const res = await fetch(`${API_URL}/export`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      frames,
      type,
    }),
  });

  if (!res.ok) throw new Error("Export failed");

  return res.blob(); // ZIP file
}
