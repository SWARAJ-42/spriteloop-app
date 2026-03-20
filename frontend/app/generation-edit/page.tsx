import { Suspense } from "react";
import GenerationEditInner from "@/components/generation-edit";

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex w-screen h-screen items-center justify-center">
        <div className="retro text-sm text-cyan-400 animate-pulse">
          Loading Sprite...
        </div>
      </div>
    }>
      <GenerationEditInner />
    </Suspense>
  );
}