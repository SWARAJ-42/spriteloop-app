"use client";

import { useEffect, useState } from "react";
import { auth } from "@/app/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { logout } from "@/app/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/8bit/avatar";
import { Button } from "@/components/ui/8bit/button";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogHeader,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import {
  LogOut,
  Trash2,
  Home,
  Sparkles,
  LayoutGrid,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface DashboardSidebarProps {
  defaultCollapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
}

export function DashboardSidebar({ defaultCollapsed = false, onCollapseChange }: DashboardSidebarProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  async function handleDelete() {
    const token = await auth.currentUser?.getIdToken();
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/delete-account`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    await logout();
    router.push("/");
  }

  const initials = user?.displayName
    ? user.displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <>
      {/* Backdrop overlay for mobile when sidebar is expanded */}
      {!collapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => {
            setCollapsed(true);
            onCollapseChange?.(true);
          }}
        />
      )}

      {/* Sidebar card */}
      <aside
        className={cn(
          "flex flex-col h-screen fixed top-0 left-0 z-50",
          /* pixelated card look */
          "bg-[oklch(0.13_0.03_240)] text-foreground",
          "border-2 border-r-4 border-b-4 border-cyan-900/80",
          "transition-[width,transform] duration-300 ease-in-out",
          /* Mobile: collapsed slides out completely, expanded overlays */
          collapsed ? "w-[80px]" : "w-[280px] md:w-[350px] px-5"
        )}
      >
        {/* ── Collapse toggle ─────────────────────────────── */}
        <div className="flex items-center justify-between px-3 pt-4 pb-3 border-b-2 border-cyan-900/50 shrink-0">
          {!collapsed && (
            <span className="retro text-[10px] tracking-widest text-cyan-400/70 uppercase select-none">
              Menu
            </span>
          )}
<Button
            onClick={() => {
              const newCollapsed = !collapsed;
              setCollapsed(newCollapsed);
              onCollapseChange?.(newCollapsed);
            }}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "retro inline-flex items-center justify-center",
              "h-7 px-2 gap-1",
              "text-[10px] text-cyan-300",
              "bg-cyan-950/60 border-2 border-b-[3px] border-r-[3px] border-cyan-800",
              "hover:bg-cyan-900/60 active:translate-x-px active:translate-y-px active:border-b-2 active:border-r-2",
              "transition-colors",
              collapsed && "mx-auto"
            )}
          >
            {collapsed ? <ArrowRight size={13} /> : <ArrowLeft size={13} />}
          </Button>
        </div>

        {/* ── User Profile ────────────────────────────────── */}
        <div
          className={cn(
            "flex flex-col items-center gap-2 px-3 py-4 border-b-2 border-cyan-900/50 shrink-0",
            collapsed && "px-2"
          )}
        >
          {/* Pixelated avatar border via box-shadow stepping */}
          <div
            className={cn(
              "relative shrink-0",
              /* pixel-art stepped outline */
              "before:absolute before:-inset-[3px]",
              "after:absolute after:-inset-[6px]"
            )}
          >
            <Avatar
              className={cn(
                "",
                collapsed ? "size-12" : "size-15"
              )}
            >
              <AvatarImage src={user?.photoURL || ""} alt="Profile" />
              <AvatarFallback className="rounded-none retro text-[11px] bg-cyan-950 text-cyan-300">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>

          {!collapsed && user && (
            <div className="text-center w-full overflow-hidden">
              {user.displayName && (
                <p className="retro text-[10px] text-cyan-200 font-semibold truncate">
                  {user.displayName}
                </p>
              )}
              <p className="retro text-[9px] text-cyan-400/60 truncate">{user.email}</p>
            </div>
          )}
        </div>

        {/* ── Navigation ──────────────────────────────────── */}
        <nav className="flex flex-col gap-2 flex-1 px-3 py-4">
          {/* Home — blue */}
          <Button
            onClick={() => router.push("/")}
            className={cn(
              "w-full text-[11px] bg-blue-900/40 hover:bg-blue-800/60 text-blue-300 border-blue-900",
              collapsed ? "justify-center size-9 px-0" : "justify-start"
            )}
            title="Home"
          >
            <Home size={13} />
            {!collapsed && <span>Home</span>}
          </Button>

          {/* Dashboard — indigo */}
          <Button
            onClick={() => router.push("/dashboard")}
            className={cn(
              "w-full text-[11px] bg-indigo-900/40 hover:bg-indigo-800/60 text-indigo-300 border-indigo-900",
              collapsed ? "justify-center size-9 px-0" : "justify-start"
            )}
            title="Dashboard"
          >
            <LayoutGrid size={13} />
            {!collapsed && <span>Dashboard</span>}
          </Button>

          {/* Generate — cyan, primary action */}
          <Button
            onClick={() => router.push("/main")}
            className={cn(
              "w-full text-[11px] bg-cyan-900/40 hover:bg-cyan-800/60 text-cyan-300 border-cyan-900",
              collapsed ? "justify-center size-9 px-0" : "justify-start"
            )}
            title="Generate"
          >
            <Sparkles size={13} />
            {!collapsed && <span>Generate</span>}
          </Button>

          {/* Spacer to push auth actions to bottom */}
          <div className="flex-1" />

          {/* Logout — amber / warning */}
          <Button
            onClick={async () => {
              await logout();
              router.push("/");
            }}
            className={cn(
              "w-full text-[11px] bg-amber-900/40 hover:bg-amber-800/60 text-amber-300 border-amber-900",
              collapsed ? "justify-center size-9 px-0" : "justify-start"
            )}
            title="Logout"
          >
            <LogOut size={13} />
            {!collapsed && <span>Logout</span>}
          </Button>

          {/* Delete Account — red / destructive */}
          <Button
            onClick={() => setDeleteDialogOpen(true)}
            className={cn(
              "w-full text-[11px] bg-red-900/40 hover:bg-red-800/60 text-red-300 border-red-900",
              collapsed ? "justify-center size-9 px-0" : "justify-start"
            )}
            title="Delete Account"
          >
            <Trash2 size={13} />
            {!collapsed && <span>Delete Account</span>}
          </Button>
        </nav>
      </aside>

      {/* ── Delete Confirmation Dialog ───────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-none border-2 border-b-4 border-r-4 border-red-900/80 bg-[oklch(0.13_0.03_240)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="retro text-sm text-red-400">
              Delete Account
            </AlertDialogTitle>
            <AlertDialogDescription className="retro text-xs text-foreground/60">
              Are you sure? This action cannot be undone and all your data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-none hover:bg-background">
              <Button className="bg-foreground/10 hover:bg-foreground/20 text-foreground border-foreground/20 h-7 px-3 text-[10px]">
                Cancel
              </Button>
            </AlertDialogCancel>
              <Button
                onClick={handleDelete}
                className="bg-red-900/40 hover:bg-red-800/60 text-red-300 border-red-900 h-7 px-3 text-[10px]"
              >
                Delete
              </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
