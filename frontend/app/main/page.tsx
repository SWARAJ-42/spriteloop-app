"use client";

import { useState, useEffect, useRef } from "react";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Button } from "@/components/ui/8bit/button";
import { Badge } from "@/components/ui/8bit/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/8bit/card";
import { preGenerate, generateAnimation, saveGif } from "@/lib/api-generate";

import { useRouter } from "next/navigation";
import { auth } from "@/app/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import CreditCounter from "@/components/credit-counter";
import { LucideIcon, Circle, Footprints, Zap, ArrowUp } from "lucide-react";
import { PhaseFrames } from "@/components/frame-editor";

// ─── Types ────────────────────────────────────────────────────
type Phase = "upload" | "animate" | "frames";

const ANIMATION_TYPES: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "idle", label: "Idle", icon: Circle },
  { id: "walking", label: "Walking", icon: Footprints },
  { id: "running", label: "Running", icon: Zap },
  { id: "jumping", label: "Jumping", icon: ArrowUp },
];

const PHASE_LABELS: Record<Phase, string> = {
  upload: "PHASE 1 — UPLOAD & BASE PROCESSING",
  animate: "PHASE 2 — CHOOSE ANIMATION TYPE",
  frames: "PHASE 3 — REVIEW & SAVE FRAMES",
};

// ─── Shared helpers ────────────────────────────────────────────
function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded border border-red-500/30 bg-red-500/10 p-3">
      <span className="retro text-[8px] text-red-400">! {message}</span>
    </div>
  );
}

// ─── Phase 1 ──────────────────────────────────────────────────
function PhaseUpload({
  onNext,
  postProcess,
  setPostProcess,
  selected,
  setSelected,
}: {
  onNext: (processedUrl: string, jobId: string) => void;
  postProcess: boolean;
  setPostProcess: (v: boolean) => void;
  selected: string;
  setSelected: (v: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [poseCorrection, setPoseCorrection] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    const allowed = ["image/png", "image/jpeg"];

    if (!allowed.includes(f.type)) {
      setError("Only PNG, JPG, or JPEG files are supported.");
      return;
    }

    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setProcessedUrl(null);
    setError(null);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const handleProcess = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const blob = await preGenerate({
        file,
        pose_correction: poseCorrection,
        animation_type: selected,
        preprocess_prompt: prompt,
      });

      const url = URL.createObjectURL(blob);

      if (processedUrl) URL.revokeObjectURL(processedUrl);

      setProcessedUrl(url);

      // optional temporary id if you still want to pass something
      setJobId("local-preprocess");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setProcessedUrl(null);
    setJobId(null);
    setError(null);
    setPoseCorrection(true);
    setPrompt("");
    // Clear the file input value so the same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="mx-auto h-fit w-full max-w-3xl">
      <Card font="retro" className="border-border bg-card">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-[5px] lg:text-[11px]">Upload Image</CardTitle>
          <CardDescription className="text-[8px]">
            Only PNG, JPG, or JPEG files are supported.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col justify-center space-y-3 px-4 pb-2">
          <div className="flex flex-col lg:flex-row justify-between my-3">
            <div className="flex flex-col justify-center space-y-3 px-4 pb-2">
              {/* Drop zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative flex flex-col items-center justify-center border-2 border-dashed p-3 transition-all ${
                  drag
                    ? "border-primary/80 bg-primary/10 "
                    : "border-border bg-background/30"
                }`}
              >
<input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  className="absolute inset-0 cursor-pointer opacity-0"
                  onChange={(e) =>
                    e.target.files?.[0] && handleFile(e.target.files[0])
                  }
                />
                <span className="retro text-[18px] text-muted-foreground/50 mb-1">
                  ↑
                </span>
                <span className="retro text-center text-[8px] text-muted-foreground">
                  Drag & drop or click to browse
                </span>
                {file && (
                  <Badge font="retro" variant="secondary" className="mt-2">
                    <span className="text-[7px]">{file.name.slice(0, 20)}...</span>
                  </Badge>
                )}
              </div>

              {/* Image preview — shown once a file is selected */}
              {(processedUrl ?? previewUrl) && (
                <div className="flex aspect-square items-center justify-center border-2 border-border bg-background/30 p-3 h-[350px]">
                  <img
                    src={(processedUrl ?? previewUrl)!}
                    alt="preview"
                    className="h-[300px] w-[300px] object-contain pixelated"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col space-y-3 px-4 pb-2">
              {/* Pose Correction Toggle */}
              <div className="flex items-center justify-between border border-border bg-background/30 px-3 py-2">
                <div className="flex flex-col gap-0.5">
                  <span className="retro text-[8px] text-foreground">
                    Pose Correction (recommended) (
                    <span className="text-[15px]">💰</span>5)
                  </span>
                  <span className="retro text-[7px] text-muted-foreground">
                    Auto-align character to 2-D right pose before processing
                  </span>
                </div>
                <button
                  onClick={() => setPoseCorrection((prev) => !prev)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center border-2 transition-colors focus:outline-none ${
                    poseCorrection
                      ? "border-primary bg-primary/20"
                      : "border-border bg-background/50"
                  }`}
                  role="switch"
                  aria-checked={poseCorrection}
                  aria-label="Toggle pose correction"
                >
                  <span
                    className={`inline-block h-3 w-3 transform bg-current transition-transform retro text-[0px] ${
                      poseCorrection
                        ? "translate-x-4 text-primary"
                        : "translate-x-0.5 text-muted-foreground"
                    }`}
                  />
                </button>
              </div>

              <div className="flex flex-1 flex-col justify-between">
                {/* Grid of animation types */}
                <div className="grid grid-cols-2 gap-3">
                  {ANIMATION_TYPES.map((anim) => (
                    <Button
                      key={anim.id}
                      onClick={() => setSelected(anim.id)}
                      className={`flex flex-col items-center justify-center gap-2 border-2 p-4 transition-all retro text-[9px] h-[70px] hover:bg-background ${
                        selected === anim.id
                          ? "border-primary bg-primary/10  text-primary"
                          : "border-border bg-background/30 text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      <anim.icon size={30} />
                      <span>{anim.label}</span>
                    </Button>
                  ))}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    font="retro"
                    variant="outline"
                    className="flex-1 text-[8px]"
                    onClick={reset}
                    disabled={!file}
                  >
                    Reset
                  </Button>
                  {!processedUrl ? (
                    <Button
                      font="retro"
                      className="flex-1 text-[8px]"
                      onClick={handleProcess}
                      disabled={!file || loading || !selected}
                    >
                      {loading ? "Processing..." : "Process Image"}
                    </Button>
                  ) : (
                    <Button
                      font="retro"
                      className="flex-1 text-[8px]"
                      disabled={selected === ""}
                      onClick={() =>
                        processedUrl &&
                        jobId !== null &&
                        onNext(processedUrl, jobId)
                      }
                    >
                      Next →
                    </Button>
                  )}
                </div>
              </div>

            </div>
          </div>

          {processedUrl && (
            <div className="flex items-center justify-center gap-2 border border-primary/30 bg-primary/10 p-2">
              <span className="retro text-[8px] text-primary">
                ✔️ Processing complete
              </span>
            </div>
          )}

          {error && <ErrorBox message={error} />}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Phase 2 ──────────────────────────────────────────────────
function PhaseAnimate({
  processedImageUrl,
  jobId,
  postProcess,
  setPostProcess,
  onNext,
  onBack,
  selected,
  setSelected,
}: {
  processedImageUrl: string;
  jobId: string;
  postProcess: boolean;
  setPostProcess: (v: boolean) => void;
  onNext: (frames: string[]) => void;
  onBack: () => void;
  selected: string;
  setSelected: (v: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");

  async function urlToBase64(url: string): Promise<string> {
    const res = await fetch(url);
    const blob = await res.blob();

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(",")[1];
        resolve(base64);
      };
      reader.readAsDataURL(blob);
    });
  }

  const handleGenerate = async () => {
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      const base64 = await urlToBase64(processedImageUrl);

      const res = await generateAnimation({
        image_base64: base64,
        animation_type: selected,
        additional_prompt: prompt,
        post_process: postProcess,
      });

      if (!res.success || !res.frames?.length)
        throw new Error(res.error ?? "Generation failed");

      const frameUrls = res.frames.map((f) => `data:image/png;base64,${f}`);

      onNext(frameUrls);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Left — processed image */}
      <Card font="retro" className="border-border bg-card">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-[11px]">Base Image</CardTitle>
          <CardDescription className="text-[8px]">
            Processed & ready for animation
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="flex aspect-square items-center justify-center border-2 border-border bg-background/30 p-3">
            <img
              src={processedImageUrl}
              alt="base"
              className="h-full w-full object-contain pixelated"
            />
          </div>
        </CardContent>
      </Card>

      {/* Right — animation picker */}
      <Card font="retro" className="flex border-border bg-card">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-[11px]">Choose Animation</CardTitle>
          <CardDescription className="text-[8px]">
            Select the animation type to generate
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 justify-between space-y-4 px-4 pb-4">
          {/* Post-processing Toggle */}
          <div className="flex items-center justify-between border border-border bg-background/30 px-3 py-2">
            <div className="flex flex-col gap-0.5">
              <span className="retro text-[8px] text-foreground">
                Post Processing (<span className="text-[15px]">⚠️</span>may take
                minutes)
              </span>
              <span className="retro text-[7px] text-muted-foreground">
                Sharpen & pixelation on raw generated animation
              </span>
            </div>

            <button
              onClick={() => setPostProcess(!postProcess)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center border-2 transition-colors ${
                postProcess
                  ? "border-primary bg-primary/20"
                  : "border-border bg-background/50"
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform bg-current transition-transform ${
                  postProcess
                    ? "translate-x-4 text-primary"
                    : "translate-x-0.5 text-muted-foreground"
                }`}
              />
            </button>
          </div>
          {/* Additional Prompt instructions */}
          <div className="flex flex-1 flex-col gap-1 border border-border bg-background/30 px-3 py-2">
            <span className="retro text-[8px] text-foreground">
              Additional prompt for custom animation (optional)
            </span>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe additional animation instructions"
              rows={10}
              className="retro text-[7px] w-full bg-background border border-border p-2 resize-none outline-none focus:border-primary"
            />

            <span className="retro text-[7px] text-muted-foreground">
              Ex: A smooth side-view run cycle with alternating strides,
              opposite arm swings, slight forward lean, and a brief airborne
              moment between steps.
            </span>
          </div>

          {error && <ErrorBox message={error} />}

          <div className="flex gap-2">
            <Button
              font="retro"
              variant="outline"
              className="flex-1 text-[10px]"
              onClick={onBack}
            >
              Back
            </Button>
            <Button
              font="retro"
              className="flex-1 text-[10px]"
              disabled={!selected || loading}
              onClick={handleGenerate}
            >
              {loading ? (
                "Generating..."
              ) : (
                <div>
                  Generate (<span className="text-[15px]">💰</span>40)
                </div>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Root page ─────────────────────────────────────────────────
export default function MainPage() {
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [phase, setPhase] = useState<Phase>("upload");
  const [processedImageUrl, setProcessedImageUrl] = useState("");
  const [jobId, setJobId] = useState("");
  const [frames, setFrames] = useState<string[]>([]);
  const [postProcess, setPostProcess] = useState(true);
  const [selected, setSelected] = useState<string>("");
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

  // Auth protection
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/");
      } else {
        setIsAuthenticated(true);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex w-screen h-screen bg-background items-center justify-center">
        <div className="retro text-sm text-cyan-400 animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

return (
    <div className="relative min-h-screen nebula-bg">
      <div className="scanline-overlay absolute inset-0 z-0 pointer-events-none" />

      {/* Fixed Sidebar */}
      <DashboardSidebar onCollapseChange={setSidebarCollapsed} />

      <CreditCounter />

      {/* Main content - takes remaining space */}
      {/* On mobile (<md): always use 80px margin (sidebar is collapsed or overlay when expanded) */}
      {/* On desktop (md+): margin adjusts based on sidebar state */}
      <div 
        className="flex justify-center items-center relative z-10 min-h-screen transition-[margin] duration-300 ease-in-out"
        style={{ 
          marginLeft: isMdScreen 
            ? (sidebarCollapsed ? '80px' : '350px') 
            : '80px'
        }}
      >
        <div className="mx-auto max-w-5xl px-3 py-4 lg:px-5">
          {/* Header */}
          <div className="mb-4 flex flex-col items-center gap-2">
            <Badge font="retro">
              <span className="text-[7px]">{PHASE_LABELS[phase]}</span>
            </Badge>

            <h1 className="retro text-center text-lg text-foreground  md:text-3xl my-3">
              {phase === "upload" && "Upload & Configure"}
              {phase === "animate" && "Choose Animation Type"}
              {phase === "frames" && "Review Frames"}
            </h1>

            {/* Step indicator — card-based */}
            <div className="flex items-center gap-2">
              {(["upload", "animate", "frames"] as Phase[]).map((p, i) => {
                const isActive = phase === p;
                const isDone =
                  (p === "upload" &&
                    (phase === "animate" || phase === "frames")) ||
                  (p === "animate" && phase === "frames");
                return (
                  <div key={p} className="flex items-center gap-2">
                    <Card
                      font="retro"
                      className={`flex items-center gap-1.5 px-2.5 py-1 transition-all ${
                        isActive
                          ? "bg-primary/10 "
                          : isDone
                            ? "bg-primary/5"
                            : "bg-background/40"
                      }`}
                    >
                      <span
                        className={`retro text-[8px] font-bold transition-all ${
                          isActive
                            ? "text-primary"
                            : isDone
                              ? "text-primary/60"
                              : "text-muted-foreground"
                        }`}
                      >
                        {isDone ? "✓" : i + 1}
                      </span>
                      <span
                        className={`retro text-[8px] transition-all ${
                          isActive
                            ? "text-primary"
                            : isDone
                              ? "text-primary/60"
                              : "text-muted-foreground"
                        }`}
                      >
                        {p === "upload"
                          ? "Upload"
                          : p === "animate"
                            ? "Animate"
                            : "Frames"}
                      </span>
                    </Card>
                    {i < 2 && (
                      <div
                        className={`h-px w-5 transition-all ${
                          (phase !== "upload" && i === 0) ||
                          (phase === "frames" && i === 1)
                            ? "bg-primary/50"
                            : "bg-border"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Phase content */}
          {phase === "upload" && (
            <PhaseUpload
              postProcess={postProcess}
              setPostProcess={setPostProcess}
              selected={selected}
              setSelected={setSelected}
              onNext={(url, id) => {
                setProcessedImageUrl(url);
                setJobId(id);
                setPhase("animate");
              }}
            />
          )}

          {phase === "animate" && (
            <PhaseAnimate
              processedImageUrl={processedImageUrl}
              jobId={jobId}
              postProcess={postProcess}
              setPostProcess={setPostProcess}
              selected={selected}
              setSelected={setSelected}
              onBack={() => setPhase("upload")}
              onNext={(f) => {
                setFrames(f);
                setPhase("frames");
              }}
            />
          )}

          {phase === "frames" && (
            <PhaseFrames
              frames={frames}
              jobId={jobId}
              onBack={() => setPhase("animate")}
            />
          )}
        </div>
      </div>
    </div>
  );
}
