"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/8bit/button";
import { cn } from "@/lib/utils";
import { signInWithGoogle, logout } from "@/app/lib/auth";
import { auth } from "@/app/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { SignInModal } from "./signin-modal";
import { LogOut, Menu, X } from "lucide-react";
import { Card } from "./ui/8bit/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/8bit/avatar";
import Link from "next/link";

import { syncUser, trackLogout } from "@/lib/api-auth";
import Image from "next/image";
import logo from "@/assets/logo.png"
import { useRouter } from "next/navigation";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Gallery", href: "#gallery" },
  { label: "Pricing", href: "#pricing" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [signInModalOpen, setSignInModalOpen] = useState(false);
  const router = useRouter()

  /**
   * AUTH LISTENER
   */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (u) {
        // Sync with backend (creates DB user if not exists)
        await syncUser();
      }
    });

    return () => unsub();
  }, []);

  /**
   * Scroll UI effect
   */
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /**
   * ESC close
   */
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDropdownOpen(false);
        setSignInModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <>
      <SignInModal
        open={signInModalOpen}
        onClose={() => setSignInModalOpen(false)}
        onSignIn={async () => {
          await signInWithGoogle();
          router.push("/dashboard");
        }}
      />

      <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
        <div
          className={cn(
            "transition-all duration-300 w-full max-w-6xl",
            scrolled ? "scale-95" : "scale-100",
          )}
        >
          <Card className="flex flex-row justify-between items-center px-4 md:px-10 py-2 bg-blue-900/10 backdrop-blur-md">
            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-foreground"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div className="flex items-center">
              <Image
                src={logo}
                alt="logo"
                className="w-[60px]"
              />
              <span className="relative z-10 retro text-xs text-foreground tracking-wider whitespace-nowrap">
                SpriteLoop
              </span>
            </div>

            <div className="hidden md:flex gap-8 flex-1 px-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="retro text-[11px] text-foreground hover:text-foreground hover: transition-all"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="relative">
              {!user ? (
                <Button
                  font="retro"
                  className="text-[11px] whitespace-nowrap bg-blue-700/10 text-foreground hover:text-foreground hover: hover:bg-blue-700/20"
                  onClick={() => setSignInModalOpen(true)}
                >
                  Get Started
                </Button>
              ) : (
                <div className="relative">
                  <button onClick={() => setDropdownOpen(!dropdownOpen)}>
                    <Avatar variant="pixel" className="size-12">
                      <AvatarImage src={user.photoURL || ""} alt="avatar" />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  </button>

                  {dropdownOpen && (
                    <div
                      className={cn(
                        "absolute right-0 mt-3 w-48",
                        "border-2 border-border",
                        "bg-linear-to-b from-[#0a0f2a] via-[#11183c] to-[#0a0f2a]",
                        "shadow-[0_0_0_3px_rgba(0,0,0,0.8),0_15px_40px_rgba(0,0,0,0.9)]",
                        "p-2 flex flex-col gap-2",
                        "animate-in fade-in zoom-in-95",
                        "pixelated",
                      )}
                    >
                      <div className="px-3 py-2 border-b border-border/50 mb-1">
                        <p className="retro text-[10px] text-cyan-400 truncate">
                          {user.email}
                        </p>
                      </div>

                      <Link
                        href="/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className={cn(
                          "retro text-[11px]",
                          "flex items-center gap-2",
                          "px-3 py-2",
                          "border border-border/40",
                          "bg-blue-900/30 hover:bg-blue-800/50",
                          "text-blue-300 hover:text-blue-100",
                          "transition-all",
                          "rounded-none",
                          "text-center justify-center",
                        )}
                      >
                        Dashboard
                      </Link>

                      <button
                        onClick={async () => {
                          await trackLogout();
                          await logout();
                          setDropdownOpen(false);
                        }}
                        className={cn(
                          "retro text-[11px]",
                          "flex items-center gap-2",
                          "px-3 py-2",
                          "border border-border/40",
                          "bg-emerald-900/30 hover:bg-emerald-800/50",
                          "text-emerald-300 hover:text-emerald-100",
                          "transition-all",
                          "rounded-none",
                        )}
                      >
                        <LogOut size={14} />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {dropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setDropdownOpen(false)}
        />
      )}

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile menu drawer */}
      {mobileOpen && (
        <div
          className={cn(
            "fixed top-24 left-4 right-4 z-50 md:hidden",
            "border-2 border-border",
            "bg-linear-to-b from-[#0a0f2a] via-[#11183c] to-[#0a0f2a]",
            "shadow-[0_0_0_3px_rgba(0,0,0,0.8),0_15px_40px_rgba(0,0,0,0.9)]",
            "p-4 flex flex-col gap-3",
            "animate-in fade-in slide-in-from-top-2",
            "backdrop-blur-3xl",
          )}
        >
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "retro text-[11px] text-foreground hover:text-cyan-400",
                "px-4 py-3",
                "border border-border/40",
                "bg-blue-900/30 hover:bg-blue-800/50",
                "transition-all text-center",
              )}
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </>
  );
}
