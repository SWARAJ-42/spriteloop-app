"use client";

import { useEffect } from "react";

export default function SuccessPage() {
  useEffect(() => {
    console.log("Payment successful");
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <h1>Payment Successful 🎉</h1>
      <p>Your plan has been activated.</p>
      <p>You can now go back and use premium features.</p>
    </div>
  );
}