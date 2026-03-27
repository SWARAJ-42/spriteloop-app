import { auth } from "@/app/lib/firebase";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function createCheckout(product_id: string) {
  const token = await auth.currentUser?.getIdToken();

  const res = await fetch(`${API_URL}/payments/create-checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ product_id }),
  });

  return await res.json();
}