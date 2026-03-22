"use client";

import { useState, useEffect } from "react";
import { signInWithGoogle, logout } from "@/app/lib/auth";
import { auth } from "@/app/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/8bit/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/8bit/card";
import { Gamepad2, LogIn, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png"
import Image from "next/image";

export default function AuthPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if already authenticated
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push("/dashboard");
      }
    });
    return () => unsubscribe();
  }, [router]);

  async function handleLogin() {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (err) {
      setError("Failed to sign in. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen nebula-bg flex flex-col items-center justify-center p-4">
      {/* Scanline overlay */}
      <div className="scanline-overlay absolute inset-0 z-0 pointer-events-none" />

      {/* Floating pixel decorations */}
      <div className="absolute top-10 left-10 w-2 h-2 bg-cyan-400/30 animate-pulse" />
      <div className="absolute top-20 right-20 w-3 h-3 bg-cyan-500/20 animate-pulse delay-100" />
      <div className="absolute bottom-32 left-24 w-2 h-2 bg-cyan-300/25 animate-pulse delay-200" />
      <div className="absolute bottom-20 right-16 w-4 h-4 bg-cyan-400/15 animate-pulse delay-300" />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Brand section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="w-40 h-40 flex items-center justify-center">
              <Image src={logo} alt="Logo" />
            </div>
          </div>
          <h1 className="retro text-2xl text-cyan-300 text-center tracking-wider">
            SPRITELOOP
          </h1>
          <p className="retro text-[10px] text-cyan-400/60 mt-2 text-center">
            Generate animated sprites with AI
          </p>
        </div>

        {/* Auth Card */}
        <Card 
          font="retro"
          className={cn(
            "bg-[oklch(0.13_0.03_240)] text-foreground",
            // "border-2 border-b-4 border-r-4 border-cyan-900/80"
          )}
        >
          <CardHeader className="text-center pb-2">
            <CardTitle className="retro text-sm text-cyan-200">
              Welcome Back
            </CardTitle>
            <CardDescription className="retro text-[9px] text-cyan-400/60">
              Sign in to access your sprite generations
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Google Sign In Button */}
            <Button
              onClick={handleLogin}
              disabled={isLoading}
              className={cn(
                "w-full retro text-[11px]",
                "bg-cyan-900/40 hover:bg-cyan-800/60",
                "text-cyan-300 border-cyan-900",
                "border-2 border-b-4 border-r-4",
                "active:translate-x-px active:translate-y-px active:border-b-2 active:border-r-2",
                "transition-all duration-150",
                "h-12 gap-3"
              )}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-cyan-300/30 border-t-cyan-300 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                  <LogIn size={14} />
                </>
              )}
            </Button>

            {/* Error message */}
            {error && (
              <div className="retro text-[9px] text-red-400 text-center bg-red-900/20 border border-red-900/50 p-2">
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}