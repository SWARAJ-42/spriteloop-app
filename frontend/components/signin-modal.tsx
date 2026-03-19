"use client";

import { useState } from "react";
import { Button } from "@/components/ui/8bit/button";
import { cn } from "@/lib/utils";
import { Card } from "./ui/8bit/card";

interface SignInModalProps {
  open: boolean;
  onClose: () => void;
  onSignIn: () => Promise<void>;
}

export function SignInModal({ open, onClose, onSignIn }: SignInModalProps) {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await onSignIn();
    } finally {
      setLoading(false);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      {/* Modal Container */}
      <Card className="px-10 w-[90%] sm:w-100">
        {/* Content */}
        <div className="relative z-10 flex flex-col gap-4">
          <div className="text-center">
            <h2 className="retro text-sm text-foreground  mb-2">
              Welcome Back
            </h2>
            <p className="retro text-[11px] text-muted-foreground">
              Sign in to get started with Spriteloop
            </p>
          </div>
        </div>

        {/* Sign In Button */}
        <div className="relative z-10">
          <Button
            font="retro"
            className="text-[11px] whitespace-nowrap bg-blue-700/10 text-foreground hover:text-foreground hover: hover:bg-blue-700/20 w-full"
            onClick={handleSignIn}
            disabled={loading}
          >
            {loading ? "Connecting..." : "Sign In with Google"}
          </Button>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="relative z-10 retro text-[10px] text-muted-foreground hover:text-foreground transition-colors text-center"
        >
          Or press ESC
        </button>
      </Card>

      {/* Close on ESC */}
      <div
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        className="absolute inset-0"
      />
    </div>
  );
}
