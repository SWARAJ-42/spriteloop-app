import { auth } from "@/app/lib/firebase";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

async function getToken() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User not authenticated");
  }

  return await user.getIdToken();
}

export async function fetchProjects() {
  const token = await getToken();

  const res = await fetch(`${API_URL}/projects`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
}

export async function createProject(name: string) {
  const token = await getToken();

  const res = await fetch(`${API_URL}/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });

  return res.json();
}

export async function deleteProject(id: number) {
  const token = await getToken();

  await fetch(`${API_URL}/projects/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}