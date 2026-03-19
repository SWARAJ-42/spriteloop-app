"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/8bit/button";
import { Badge } from "@/components/ui/8bit/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/8bit/card";
import {
  preGenerate,
  generateAnimation,
  saveFrames,
  type AnimationType,
} from "@/lib/api-generate";
import { createProject, fetchProjects } from "@/lib/api-projects";
import { ProjectSelectModal } from "@/components/project-select-model";

// ─── Types ────────────────────────────────────────────────────
type Phase = "upload" | "animate" | "frames";

const ANIMATION_TYPES: { id: AnimationType; label: string; icon: string }[] = [
  { id: "idle", label: "Idle", icon: "◉" },
  { id: "walking", label: "Walking", icon: "➤" },
  { id: "running", label: "Running", icon: "⚡" },
  { id: "jumping", label: "Jumping", icon: "▲" },
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
}: {
  onNext: (processedUrl: string, jobId: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [poseCorrection, setPoseCorrection] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);

  const handleFile = (f: File) => {
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
      const res = await preGenerate({
        file,
        pose_correction: poseCorrection,
        preprocess_prompt: prompt,
      });
      if (!res.success || !res.processed_image_url)
        throw new Error(res.error ?? "Processing failed");
      setProcessedUrl(res.processed_image_url);
      setJobId(res.job_id ?? "");
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
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Left — config */}
      <Card font="retro" className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-[12px]">Upload Image</CardTitle>
          <CardDescription className="text-[9px]">
            PNG, JPG, WebP supported
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Drop zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative flex flex-col items-center justify-center border-2 border-dashed p-8 transition-all ${
              drag
                ? "border-primary/80 bg-primary/10 "
                : "border-border bg-background/30"
            }`}
          >
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={(e) =>
                e.target.files?.[0] && handleFile(e.target.files[0])
              }
            />
            <span className="retro text-[20px] text-muted-foreground/50 mb-3">
              ↑
            </span>
            <span className="retro text-center text-[9px] text-muted-foreground">
              Drag & drop or click to browse
            </span>
            {file && (
              <Badge font="retro" variant="secondary" className="mt-3">
                <span className="text-[7px]">{file.name}</span>
              </Badge>
            )}
          </div>

          {/* Pose correction */}
          <div className="flex items-center justify-between border border-border bg-background/50 p-3">
            <div>
              <p className="retro text-[9px] text-foreground">
                Pose Correction
              </p>
              <p className="retro text-[7px] text-muted-foreground">
                Auto-fix pose for animation
              </p>
            </div>
            <button
              onClick={() => setPoseCorrection((v) => !v)}
              className={`relative h-6 w-11 transition-colors ${poseCorrection ? "bg-primary" : "bg-border"}`}
            >
              <div
                className={`absolute top-1 h-4 w-4 bg-background transition-transform ${
                  poseCorrection ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Prompt */}
          <div className="space-y-2">
            <label className="retro text-[9px] text-foreground">
              Preprocess Prompt (optional)
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. 'remove background, enhance contrast'"
              rows={3}
              className="retro w-full border border-border bg-background/50 p-3 text-[8px] text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none resize-none"
            />
          </div>

          {error && <ErrorBox message={error} />}

          <Button
            font="retro"
            className="w-full text-[10px]"
            onClick={handleProcess}
            disabled={!file || loading}
          >
            {loading ? "Processing..." : "Process Image"}
          </Button>
        </CardContent>
      </Card>

      {/* Right — preview */}
      <Card font="retro" className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-[12px]">Preview</CardTitle>
          <CardDescription className="text-[9px]">
            {processedUrl
              ? "Processed result — proceed if satisfied"
              : "Your uploaded image"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex aspect-square items-center justify-center border-2 border-border bg-background/30 p-4">
            {(processedUrl ?? previewUrl) ? (
              <img
                src={(processedUrl ?? previewUrl)!}
                alt="preview"
                className="h-full w-full object-contain pixelated"
              />
            ) : (
              <span className="retro text-[8px] text-muted-foreground">
                No image yet
              </span>
            )}
          </div>

          {processedUrl && (
            <div className="flex items-center justify-center gap-2 border border-primary/30 bg-primary/10 p-3">
              <span className="retro text-[9px] text-primary">
                ✓ Processing complete
              </span>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              font="retro"
              variant="outline"
              className="flex-1 text-[9px]"
              onClick={reset}
              disabled={!file}
            >
              Reset
            </Button>
            <Button
              font="retro"
              className="flex-1 text-[9px]"
              disabled={!processedUrl}
              onClick={() =>
                processedUrl && jobId !== null && onNext(processedUrl, jobId)
              }
            >
              Next →
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Phase 2 ──────────────────────────────────────────────────
function PhaseAnimate({
  processedImageUrl,
  jobId,
  onNext,
  onBack,
}: {
  processedImageUrl: string;
  jobId: string;
  onNext: (frames: string[]) => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState<AnimationType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      const res = await generateAnimation({
        job_id: jobId,
        animation_type: selected,
      });
      if (!res.success || !res.frames?.length)
        throw new Error(res.error ?? "Generation failed");
      onNext(res.frames);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Left — processed image */}
      <Card font="retro" className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-[12px]">Base Image</CardTitle>
          <CardDescription className="text-[9px]">
            Processed & ready for animation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex aspect-square items-center justify-center border-2 border-border bg-background/30 p-4">
            <img
              src={processedImageUrl}
              alt="base"
              className="h-full w-full object-contain pixelated"
            />
          </div>
        </CardContent>
      </Card>

      {/* Right — animation picker */}
      <Card font="retro" className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-[12px]">Choose Animation</CardTitle>
          <CardDescription className="text-[9px]">
            Select the animation type to generate
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Grid of animation types */}
          <div className="grid grid-cols-2 gap-4">
            {ANIMATION_TYPES.map((anim) => (
              <button
                key={anim.id}
                onClick={() => setSelected(anim.id)}
                className={`flex flex-col items-center justify-center gap-3 border-2 p-6 transition-all retro text-[10px] ${
                  selected === anim.id
                    ? "border-primary bg-primary/10  text-primary"
                    : "border-border bg-background/30 text-muted-foreground hover:border-primary/50"
                }`}
              >
                <span className="text-2xl">{anim.icon}</span>
                <span>{anim.label}</span>
              </button>
            ))}
          </div>

          {error && <ErrorBox message={error} />}

          <div className="flex gap-3">
            <Button
              font="retro"
              variant="outline"
              className="flex-1 text-[9px]"
              onClick={onBack}
            >
              ← Back
            </Button>
            <Button
              font="retro"
              className="flex-1 text-[9px]"
              disabled={!selected || loading}
              onClick={handleGenerate}
            >
              {loading ? "Generating..." : "Generate →"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Frame modal ───────────────────────────────────────────────
function FrameModal({
  src,
  index,
  kept,
  onToggle,
  onClose,
}: {
  src: string;
  index: number;
  kept: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  // close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <Card
        className="relative flex flex-col gap-4 p-6 max-w-xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="retro text-[10px] text-foreground">
              Frame {String(index + 1).padStart(2, "0")}
            </span>
            <Badge font="retro" variant={kept ? "default" : "secondary"}>
              <span className="text-[7px]">
                {kept ? "SELECTED" : "REMOVED"}
              </span>
            </Badge>
          </div>
          <button
            onClick={onClose}
            className="retro text-[10px] text-muted-foreground hover:text-foreground border border-border px-2 py-1"
          >
            ✕
          </button>
        </div>

        {/* Frame image */}
        <div
          className={`flex items-center justify-center border-2 bg-background/50 p-4 transition-all ${
            kept ? "border-primary " : "border-border/30"
          }`}
        >
          <img
            src={src}
            alt={`frame-${index}`}
            className={`w-full max-h-72 object-contain pixelated transition-all ${!kept ? "opacity-40 grayscale" : ""}`}
          />
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          <Button
            font="retro"
            variant={kept ? "outline" : "default"}
            className="flex-1 text-[9px]"
            onClick={onToggle}
          >
            {kept ? "Remove Frame" : "Keep Frame"}
          </Button>
          <Button
            font="retro"
            variant="outline"
            className="text-[9px] px-4"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
}

function PhaseFrames({
  frames,
  jobId,
  onBack,
}: {
  frames: string[];
  jobId: string;
  onBack: () => void;
}) {
  const [kept, setKept] = useState<Set<number>>(
    () => new Set(frames.map((_, i) => i)),
  );
  const [fps, setFps] = useState(8);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projects, setProjects] = useState([]);

  // Playback
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!frames.length) return;

    intervalRef.current = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % frames.length);
    }, 1000 / fps);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fps, frames.length]);

  // Load Projects
  useEffect(() => {
    async function loadProjects() {
      const data = await fetchProjects();
      setProjects(data);
    }

    loadProjects();
  }, []);

  const toggle = useCallback((i: number) => {
    setKept((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }, []);

  const handleProjectSelect = async (projectId: number) => {
    setSaving(true);

    try {
      const res = await saveFrames({
        job_id: jobId,
        project_id: projectId,
        selected_frame_indices: Array.from(kept).sort((a, b) => a - b),
      });

      if (!res.success) throw new Error("Save failed");

      setSaved(true);
      setShowProjectModal(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await saveFrames({
        job_id: jobId,
        selected_frame_indices: Array.from(kept).sort((a, b) => a - b),
      });
      if (!res.success) throw new Error(res.error ?? "Save failed");
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {showProjectModal && (
        <ProjectSelectModal
          projects={projects}
          onSave={handleProjectSelect}
          onCreateProject={createProject}
          onClose={() => setShowProjectModal(false)}
        />
      )}

      {modalIndex !== null && (
        <FrameModal
          src={frames[modalIndex]}
          index={modalIndex}
          kept={kept.has(modalIndex)}
          onToggle={() => toggle(modalIndex)}
          onClose={() => setModalIndex(null)}
        />
      )}

      <div className="space-y-6">
        {/* Toolbar */}
        <Card font="retro" className="border-border bg-card">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-4">
              <span className="retro text-[9px] text-foreground">
                {frames.length} frames total
              </span>
              <Badge font="retro" variant="secondary">
                <span className="text-[7px]">{kept.size} kept</span>
              </Badge>
              <Badge font="retro">
                <span className="text-[7px]">
                  {frames.length - kept.size} removed
                </span>
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              {saved && (
                <span className="retro text-[8px] text-primary">✓ Saved</span>
              )}
              {error && (
                <span className="retro text-[8px] text-red-400">! {error}</span>
              )}
              <Button
                font="retro"
                variant="outline"
                className="text-[9px]"
                onClick={onBack}
              >
                ← Back
              </Button>
              <Button
                font="retro"
                className="text-[9px]"
                onClick={() => setShowProjectModal(true)}
                disabled={kept.size === 0}
              >
                Save Animation
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Layout */}
        <div className="grid gap-8 lg:grid-cols-[1fr_2fr] items-start">
          {/* Preview */}
          <Card font="retro" className="border-border bg-card h-full">
            <CardHeader>
              <CardTitle className="text-[12px]">Preview</CardTitle>
              <CardDescription className="text-[9px]">
                Live playback at {fps} FPS
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="flex aspect-square items-center justify-center border-2 border-border bg-background/50">
                {frames.length > 0 ? (
                  <img
                    src={frames[currentFrame]}
                    alt={`playback-${currentFrame}`}
                    className="h-full w-full object-contain pixelated"
                  />
                ) : (
                  <span className="retro text-[8px] text-muted-foreground">
                    No frames
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="retro text-[8px] text-muted-foreground">
                  Frame {currentFrame + 1} / {frames.length}
                </span>
                <Badge font="retro" variant="secondary">
                  <span className="text-[7px]">{fps} FPS</span>
                </Badge>
              </div>

              <input
                type="range"
                min={1}
                max={24}
                value={fps}
                onChange={(e) => setFps(Number(e.target.value))}
                className="w-full accent-primary"
              />

              <div className="flex gap-2">
                <Button
                  font="retro"
                  variant="outline"
                  className="flex-1 text-[8px]"
                  onClick={() => setKept(new Set(frames.map((_, i) => i)))}
                >
                  All
                </Button>
                <Button
                  font="retro"
                  variant="outline"
                  className="flex-1 text-[8px]"
                  onClick={() => setKept(new Set())}
                >
                  None
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Frame Grid */}
          <Card font="retro" className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-[12px]">Frames</CardTitle>
              <CardDescription className="text-[9px]">
                Click to inspect & toggle
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-3 gap-3 overflow-y-auto max-h-[65vh] pr-2">
                {frames.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setModalIndex(i)}
                    className={`relative border-2 transition-all ${
                      kept.has(i)
                        ? "border-primary "
                        : "border-border/30 opacity-40 grayscale"
                    }`}
                  >
                    <img
                      src={src}
                      alt={`frame-${i}`}
                      className="w-full aspect-square object-contain pixelated bg-background/50"
                    />
                    <span className="absolute bottom-0 left-0 retro text-[6px] bg-background/80 px-1 py-0.5 text-muted-foreground">
                      {i + 1}
                    </span>
                    {!kept.has(i) && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="retro text-[10px] text-red-400">
                          ✕
                        </span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

// ─── Root page ─────────────────────────────────────────────────
export default function MainPage() {
  const [phase, setPhase] = useState<Phase>("upload");
  const [processedImageUrl, setProcessedImageUrl] = useState("");
  const [jobId, setJobId] = useState("");
  const [frames, setFrames] = useState<string[]>([]);

  return (
    <div className="relative min-h-screen nebula-bg">
      <div className="scanline-overlay absolute inset-0 z-0" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 lg:px-8">
        {/* Header */}
        <div className="mb-12 flex flex-col items-center gap-4">
          <Badge font="retro">
            <span className="text-[8px]">{PHASE_LABELS[phase]}</span>
          </Badge>
          <h1 className="retro text-center text-2xl text-foreground  md:text-3xl">
            {phase === "upload" && "Upload & Configure"}
            {phase === "animate" && "Choose Animation Type"}
            {phase === "frames" && "Review Frames"}
          </h1>

          {/* Step indicator */}
          <div className="flex items-center gap-3">
            {(["upload", "animate", "frames"] as Phase[]).map((p, i) => (
              <div key={p} className="flex items-center gap-3">
                <div
                  className={`flex h-7 w-7 items-center justify-center border-2 retro text-[9px] transition-all ${
                    phase === p
                      ? "border-primary bg-primary/10 text-primary "
                      : ["frames", "animate"].includes(phase) &&
                          (p === "upload" ||
                            (phase === "frames" && p === "animate"))
                        ? "border-primary/50 text-primary/50"
                        : "border-border text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </div>
                {i < 2 && (
                  <div
                    className={`h-px w-8 transition-all ${phase !== "upload" && i === 0 ? "bg-primary/50" : phase === "frames" && i === 1 ? "bg-primary/50" : "bg-border"}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Phase content */}
        {phase === "upload" && (
          <PhaseUpload
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
  );
}
