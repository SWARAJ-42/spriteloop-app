"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
import { createProject, fetchProjects } from "@/lib/api-projects";
import { ProjectSelectModal } from "@/components/project-select-model";
import { useRouter } from "next/navigation";
import { auth } from "@/app/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import CreditCounter from "@/components/credit-counter";
import GIF from "gif.js";
import { LucideIcon, Circle, Footprints, Zap, ArrowUp, Pencil } from "lucide-react";
import { FrameModal } from "@/components/frame-modal";

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
                    <span className="text-[7px]">{file.name}</span>
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

// ─── Frame item type ───────────────────────────────────────────
let _uidCounter = 0;
function makeId() {
  return ++_uidCounter;
}

interface FrameItem {
  uid: number;
  src: string;
}

// ─── Draggable frame grid ──────────────────────────────────────
function FrameGrid({
  frameList,
  keptUids,
  onReorder,
  onCopy,
  onToggleUid,
  onInspect,
  onEditPixels,
}: {
  frameList: FrameItem[];
  keptUids: Set<number>;
  onReorder: (newList: FrameItem[]) => void;
  onCopy: (uid: number) => void;
  onToggleUid: (uid: number) => void;
  onInspect: (index: number) => void;
  onEditPixels: (index: number) => void;
}) {
  const dragUid = useRef<number | null>(null);
  const dragOverUid = useRef<number | null>(null);
  // context menu state
  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    uid: number;
  } | null>(null);

  // close context menu on outside click
  useEffect(() => {
    const close = () => setMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const handleDragStart = (e: React.DragEvent, uid: number) => {
    dragUid.current = uid;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, uid: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    dragOverUid.current = uid;
  };

  const handleDrop = (e: React.DragEvent, targetUid: number) => {
    e.preventDefault();
    const fromUid = dragUid.current;
    if (fromUid === null || fromUid === targetUid) return;

    const list = [...frameList];
    const fromIdx = list.findIndex((f) => f.uid === fromUid);
    const toIdx = list.findIndex((f) => f.uid === targetUid);
    if (fromIdx === -1 || toIdx === -1) return;

    const [item] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, item);
    onReorder(list);
    dragUid.current = null;
    dragOverUid.current = null;
  };

  const handleDragEnd = () => {
    dragUid.current = null;
    dragOverUid.current = null;
  };

  const handleContextMenu = (e: React.MouseEvent, uid: number) => {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY, uid });
  };

  return (
    <div className="flex-1 relative">
      <div className="grid grid-cols-4 gap-2 overflow-y-auto max-h-[60vh] pr-1">
        {frameList.map((item, i) => {
          const isKept = keptUids.has(item.uid);
          const isDragging = dragUid.current === item.uid;
          return (
            <div
              key={item.uid}
              draggable
              onDragStart={(e) => handleDragStart(e, item.uid)}
              onDragOver={(e) => handleDragOver(e, item.uid)}
              onDrop={(e) => handleDrop(e, item.uid)}
              onDragEnd={handleDragEnd}
              onContextMenu={(e) => handleContextMenu(e, item.uid)}
              className={`relative border-2 cursor-grab active:cursor-grabbing select-none transition-all ${
                isDragging ? "opacity-30 scale-95" : ""
              } ${
                isKept
                  ? "border-primary "
                  : "border-border/30 opacity-40 grayscale"
              }`}
            >
              {/* thumbnail */}
              <img
                src={item.src}
                alt={`frame-${i}`}
                draggable={false}
                className="w-full aspect-square object-contain pixelated bg-background/50 pointer-events-none"
              />

              {/* frame number */}
              <span className="absolute bottom-0 left-0 retro text-[6px] bg-background/80 px-1 py-0.5 text-muted-foreground">
                {i + 1}
              </span>

              {/* removed dim */}
              {!isKept && (
                <div className="absolute inset-0 bg-background/40 pointer-events-none" />
              )}

              {/* hover overlay — full cover with four actions */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/85 opacity-0 hover:opacity-100 transition-opacity">
                <button
                  className="flex items-center justify-center w-7 h-7 border border-border bg-background hover:border-primary hover:text-primary text-muted-foreground retro text-[11px] transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onInspect(i);
                  }}
                  title="Inspect"
                >
                  ⤢
                </button>
                <button
                  className="flex items-center justify-center w-7 h-7 border border-border bg-background hover:border-primary hover:text-primary text-muted-foreground transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditPixels(i);
                  }}
                  title="Edit Pixels"
                >
                  <Pencil size={14} />
                </button>
                <button
                  className="flex items-center justify-center w-7 h-7 border border-border bg-background hover:border-primary hover:text-primary text-muted-foreground retro text-[11px] transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopy(item.uid);
                  }}
                  title="Duplicate"
                >
                  ⧉
                </button>
                <button
                  className={`flex items-center justify-center w-7 h-7 border bg-background retro text-[11px] transition-colors ${
                    isKept
                      ? "border-red-400/60 text-red-400 hover:border-red-300 hover:text-red-300"
                      : "border-primary/60 text-primary hover:border-primary hover:text-primary/80"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleUid(item.uid);
                  }}
                  title={isKept ? "Remove" : "Keep"}
                >
                  {isKept ? "✕" : "✓"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Context menu */}
      {menu && (
        <div
          className="fixed z-50 border border-border bg-card shadow-lg py-1 min-w-[120px]"
          style={{ top: menu.y, left: menu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {[
            {
              label: "Duplicate",
              icon: "⧉",
              action: () => {
                onCopy(menu.uid);
                setMenu(null);
              },
            },
            {
              label: keptUids.has(menu.uid) ? "Remove" : "Keep",
              icon: keptUids.has(menu.uid) ? "✕" : "✓",
              action: () => {
                onToggleUid(menu.uid);
                setMenu(null);
              },
            },
            {
              label: "Inspect",
              icon: "⤢",
              action: () => {
                const idx = frameList.findIndex((f) => f.uid === menu.uid);
                if (idx !== -1) onInspect(idx);
                setMenu(null);
              },
            },
            {
              label: "Edit Pixels",
              icon: "✎",
              action: () => {
                const idx = frameList.findIndex((f) => f.uid === menu.uid);
                if (idx !== -1) onEditPixels(idx);
                setMenu(null);
              },
            },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className="flex w-full items-center gap-2 px-3 py-1.5 retro text-[8px] text-foreground hover:bg-primary/10 hover:text-primary"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Phase 3 ──────────────────────────────────────────────────
function PhaseFrames({
  frames,
  jobId,
  onBack,
}: {
  frames: string[];
  jobId: string;
  onBack: () => void;
}) {
  // frameList holds the mutable ordered list with stable UIDs
  const [frameList, setFrameList] = useState<FrameItem[]>(() =>
    frames.map((src) => ({ uid: makeId(), src })),
  );
  // keptUids tracks which UIDs are selected (all on by default)
  const [keptUids, setKeptUids] = useState<Set<number>>(
    () => new Set(frames.map((_, i) => i + 1)), // mirrors initial UIDs from makeId()
  );
  // activeFrames drive the preview — only updated on "Apply"
  const [activeFrames, setActiveFrames] = useState<string[]>(frames);
  const [fps, setFps] = useState(8);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const [editModeIndex, setEditModeIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projects, setProjects] = useState([]);

  // pending = preview doesn't reflect current kept+order
  const pendingChanges = useRef(false);
  const activeKey = activeFrames.join(",");
  const currentKey = frameList
    .filter((f) => keptUids.has(f.uid))
    .map((f) => f.src)
    .join(",");
  pendingChanges.current = activeKey !== currentKey;

  const handleApply = () => {
    const ordered = frameList
      .filter((f) => keptUids.has(f.uid))
      .map((f) => f.src);
    setActiveFrames(ordered);
    setCurrentFrame(0);
  };

  // playback
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!activeFrames.length) return;
    intervalRef.current = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % activeFrames.length);
    }, 1000 / fps);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fps, activeFrames]);

  useEffect(() => {
    fetchProjects().then(setProjects);
  }, []);

  const toggleUid = useCallback((uid: number) => {
    setKeptUids((prev) => {
      const next = new Set(prev);
      next.has(uid) ? next.delete(uid) : next.add(uid);
      return next;
    });
  }, []);

  const updateFrameSrc = useCallback((uid: number, newSrc: string) => {
    setFrameList((prev) =>
      prev.map((f) => (f.uid === uid ? { ...f, src: newSrc } : f)),
    );
  }, []);

  const copyFrame = useCallback((uid: number) => {
    setFrameList((prev) => {
      const idx = prev.findIndex((f) => f.uid === uid);
      if (idx === -1) return prev;
      const newItem: FrameItem = { uid: makeId(), src: prev[idx].src };
      const next = [...prev];
      next.splice(idx + 1, 0, newItem);
      setKeptUids((k) => {
        const n = new Set(k);
        n.add(newItem.uid);
        return n;
      });
      return next;
    });
  }, []);

  // Handle navigation in modals
  const handleModalNavigate = useCallback((newIndex: number) => {
    if (newIndex >= 0 && newIndex < frameList.length) {
      setModalIndex(newIndex);
      // Reset editModeIndex when navigating - edit mode will be handled by the modal itself
      setEditModeIndex(null);
    }
  }, [frameList.length]);

  // Handle direct pixel editor opening
  const handleEditPixels = useCallback((index: number) => {
    setModalIndex(index);
    setEditModeIndex(index);
  }, []);

  // Handle frame save from pixel editor
  const handleFrameSave = useCallback((uid: number, newSrc: string) => {
    updateFrameSrc(uid, newSrc);
  }, [updateFrameSrc]);

  async function buildGif(frames: string[]): Promise<Blob> {
    return new Promise(async (resolve) => {
      const gif = new GIF({
        workers: 2,
        quality: 10,
        workerScript: "/gif.worker.js",
      });

      for (const src of frames) {
        const img = new Image();
        img.src = src;

        await new Promise((res) => {
          img.onload = res;
        });

        gif.addFrame(img, { delay: 1000 / fps });
      }

      gif.on("finished", (blob: Blob) => {
        resolve(blob);
      });

      gif.render();
    });
  }

  const handleProjectSelect = async (projectId: number) => {
    setSaving(true);

    try {
      const gifBlob = await buildGif(activeFrames);

      const res = await saveGif({
        job_id: jobId,
        project_id: projectId,
        gif: gifBlob,
      });

      if (!res.success) throw new Error("Save failed");

      setSaved(true);
      setShowProjectModal(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const keptCount = keptUids.size;
  const removedCount = frameList.length - keptCount;

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

      {modalIndex !== null && frameList[modalIndex] && (
        <FrameModal
          item={frameList[modalIndex]}
          index={modalIndex}
          totalFrames={frameList.length}
          isKept={keptUids.has(frameList[modalIndex].uid)}
          onToggle={() => toggleUid(frameList[modalIndex].uid)}
          onClose={() => {
            setModalIndex(null);
            setEditModeIndex(null);
          }}
          onNavigate={handleModalNavigate}
          onSave={handleFrameSave}
          startInEditMode={editModeIndex === modalIndex}
        />
      )}

      <div className="flex">
        {/* Left — Preview + controls */}
        <Card
          font="retro"
          className="flex-1 border-border bg-card mr-6 w-[30%]"
        >
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-[11px]">Preview</CardTitle>
            <CardDescription className="text-[8px]">
              Live playback at {fps} FPS
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-2 px-4 pb-4">
            <div className="flex aspect-square items-center justify-center border-2 border-border bg-background/50">
              {activeFrames.length > 0 ? (
                <img
                  src={activeFrames[currentFrame]}
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
              <span className="retro text-[7px] text-muted-foreground">
                Frame {currentFrame + 1} / {activeFrames.length}
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

            <div className="flex items-center gap-2 flex-wrap">
              <span className="retro text-[7px] text-muted-foreground">
                {frameList.length} total
              </span>
              <Badge font="retro" variant="secondary">
                <span className="text-[7px]">{keptCount} kept</span>
              </Badge>
              <Badge font="retro">
                <span className="text-[7px]">{removedCount} removed</span>
              </Badge>
            </div>

            <div className="flex gap-2">
              <Button
                font="retro"
                variant="outline"
                className="flex-1 text-[7px]"
                onClick={() =>
                  setKeptUids(new Set(frameList.map((f) => f.uid)))
                }
              >
                All
              </Button>
              <Button
                font="retro"
                variant="outline"
                className="flex-1 text-[7px]"
                onClick={() => setKeptUids(new Set())}
              >
                None
              </Button>
            </div>

            <div className="flex gap-1">
              <Button
                font="retro"
                className="w-fit text-[7px] w-full"
                onClick={handleApply}
                disabled={keptCount === 0}
              >
                {pendingChanges.current
                  ? "Apply to Preview *"
                  : "Apply to Preview"}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                font="retro"
                variant="outline"
                className="flex-1 text-[7px]"
                onClick={onBack}
              >
                Back
              </Button>
              <Button
                font="retro"
                className="flex-1 text-[7px]"
                onClick={() => setShowProjectModal(true)}
                disabled={keptCount === 0 || saving}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>

            {saved && (
              <div className="flex items-center justify-center gap-2 border border-primary/30 bg-green-500/50 p-1.5 m">
                <span className="retro text-[7px]">✓ Saved</span>
              </div>
            )}
            {error && <ErrorBox message={error} />}
          </CardContent>
        </Card>

        {/* Right — Drag-and-drop frame grid */}
        <Card font="retro" className="flex justify-center border-border bg-card w-[70%]">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-[11px]">Frames</CardTitle>
            <CardDescription className="text-[8px]">
              Drag to reorder · right-click or hover for options
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <FrameGrid
              frameList={frameList}
              keptUids={keptUids}
              onReorder={setFrameList}
              onCopy={copyFrame}
              onToggleUid={toggleUid}
              onInspect={setModalIndex}
              onEditPixels={handleEditPixels}
            />
          </CardContent>
        </Card>
      </div>
    </>
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
