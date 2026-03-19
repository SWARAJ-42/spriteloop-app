"use client";

import { useState } from "react";
import { signInWithGoogle, logout } from "../lib/auth";
import { auth } from "../lib/firebase";

export default function Home() {
  const [output, setOutput] = useState<any>(null);

  async function handleLogin() {
    const user = await signInWithGoogle();
    setOutput({ loggedIn: user.email });
  }

  async function handleMe() {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await res.json();
    setOutput(data);
  }

  async function handleDelete() {
    const token = await auth.currentUser?.getIdToken();
    await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/delete-account`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    await logout();
    setOutput("Account deleted");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-100">
      <button className="btn" onClick={handleLogin}>
        Sign in with Google
      </button>

      <button className="btn" onClick={handleMe}>
        Call /auth/me
      </button>

      <button className="btn" onClick={logout}>
        Sign out
      </button>

      <button className="btn bg-red-500" onClick={handleDelete}>
        Delete account
      </button>

      <pre className="mt-4 bg-white p-4 rounded">
        {JSON.stringify(output, null, 2)}
      </pre>
    </main>
  );
}
