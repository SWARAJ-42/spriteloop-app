import { auth } from "@/app/lib/firebase";

/**
 * Helper to ensure we always have the latest Environment Variable.
 * If this is undefined, the browser defaults to a relative path,
 * hitting the Next.js dev server instead of your backend.
 */
const getBaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!url) {
    console.warn("NEXT_PUBLIC_BACKEND_URL is not defined!");
  }
  return url;
};

async function getToken() {
  // Wait for Firebase to initialize if needed, though usually handled by the auth observer
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User not authenticated");
  }

  return await user.getIdToken();
}

export async function fetchProjects() {
  const token = await getToken();
  const baseUrl = getBaseUrl();

  console.log("Fetching projects from:", `${baseUrl}/projects`);

  const res = await fetch(`${baseUrl}/projects`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Critical: Check if the response is actually a 200-299 OK
  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`fetchProjects failed (${res.status}): ${errorBody.substring(0, 100)}`);
  }

  return res.json();
}

export async function createProject(name: string) {
  const token = await getToken();
  const baseUrl = getBaseUrl();

  const res = await fetch(`${baseUrl}/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`createProject failed (${res.status}): ${errorBody.substring(0, 100)}`);
  }

  return res.json();
}

export async function deleteProject(id: number) {
  const token = await getToken();
  const baseUrl = getBaseUrl();

  const res = await fetch(`${baseUrl}/projects/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`deleteProject failed (${res.status}): ${errorBody.substring(0, 100)}`);
  }
  
  // Some APIs return 204 No Content for DELETE, which has no JSON body
  if (res.status !== 204) {
    return res.json();
  }
}