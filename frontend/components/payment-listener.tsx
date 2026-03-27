"use client";

import { useEffect } from "react";
import { auth } from "@/app/lib/firebase";
import { toast } from "@/components/ui/8bit/toast";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

export function PaymentListener() {
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;

        const res = await fetch(`${API_URL}/payments/latest-status`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!data || data.status === "none") return;

        // 🔥 prevent duplicate toasts
        const key = `payment-toast-${data.payment_id}`;
        if (localStorage.getItem(key)) return;

        // ✅ 8bit toast
        if (data.status === "succeeded") {
          toast(`+${data.credits} credits added 🎉`);
        }

        if (data.status === "failed") {
          toast("Payment failed ❌");
        }

        if (data.status === "cancelled") {
          toast("Payment cancelled ⚠️");
        }

        localStorage.setItem(key, "true");

      } catch (err) {
        console.error(err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return null;
}