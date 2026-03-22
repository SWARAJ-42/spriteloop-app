import { auth } from "@/app/lib/firebase";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

/**
 * Get Firebase token
 */
async function getToken() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User not authenticated");
  }

  return await user.getIdToken();
}

/**
 * Sync user with backend
 * Calls GET /auth/me
 * Backend will create user if not exists
 */
export async function syncUser() {
  const token = await getToken();
  if (!token) return null;

  const res = await fetch(`${API_URL}/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    console.error("Failed to sync user");
    return null;
  }

  return await res.json();
}

/**
 * Track logout
 */
export async function trackLogout() {
  const token = await getToken();
  if (!token) return;

  await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Delete user account
 */
export async function deleteAccount() {
  const token = await getToken();
  if (!token) return;

  const res = await fetch(`${API_URL}/auth/delete-account`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return await res.json();
}
