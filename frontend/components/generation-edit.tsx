"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { PhaseFrames } from "@/components/frame-editor";
import CreditCounter from "@/components/credit-counter";

export default function GenerationEditInner() {
  const params = useSearchParams();
  const router = useRouter();

  const gifUrl = params.get("gif");
  const projectId = params.get("project");

const [frames, setFrames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMdScreen, setIsMdScreen] = useState(false);
  
  // Track screen size for responsive sidebar margin
  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    setIsMdScreen(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setIsMdScreen(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!gifUrl) return;

    async function loadFrames() {
      const gif = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/proxy?url=${encodeURIComponent(gifUrl)}`,
      );
      const blob = await gif.blob();
      const buffer = await blob.arrayBuffer();

      const { parseGIF, decompressFrames } = await import("gifuct-js");

      const parsed = parseGIF(buffer);
      const frameData = decompressFrames(parsed, true);

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const extracted: string[] = [];

      for (const frame of frameData) {
        canvas.width = frame.dims.width;
        canvas.height = frame.dims.height;

        const imageData = ctx!.createImageData(
          frame.dims.width,
          frame.dims.height,
        );

        imageData.data.set(frame.patch);
        ctx!.putImageData(imageData, 0, 0);

        extracted.push(canvas.toDataURL());
      }

      setFrames(extracted);
      setLoading(false);
    }

    loadFrames();
  }, [gifUrl]);

  if (loading) {
    return (
      <div className="flex w-screen h-screen items-center justify-center">
        <div className="retro text-sm text-cyan-400 animate-pulse">
          Loading Sprite...
        </div>
      </div>
    );
  }

return (
    <div className="relative min-h-screen nebula-bg">
      {/* Fixed Sidebar */}
      <DashboardSidebar onCollapseChange={setSidebarCollapsed} />
      <CreditCounter />
      
      {/* Main Content - takes remaining space */}
      {/* On mobile (<md): always use 80px margin (sidebar overlays when expanded) */}
      {/* On desktop (md+): margin adjusts based on sidebar state */}
      <div 
        className="relative min-h-screen flex justify-center items-center transition-[margin] duration-300 ease-in-out"
        style={{ 
          marginLeft: isMdScreen 
            ? (sidebarCollapsed ? '80px' : '350px') 
            : '80px'
        }}
      >
        <div className="p-6 max-w-7xl">
          <PhaseFrames
            frames={frames}
            projectId={projectId}
            onBack={() => router.back()}
          />
        </div>
      </div>
    </div>
  );
}
