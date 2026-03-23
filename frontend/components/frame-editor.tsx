"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/8bit/button";
import { Badge } from "@/components/ui/8bit/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/8bit/card";
import { saveGif } from "@/lib/api-generate";
import { createProject, fetchProjects } from "@/lib/api-projects";
import { ProjectSelectModal } from "@/components/project-select-model";
import GIF from "gif.js";
import { FrameModal } from "./frame-modal";

// ─── Frame item type ───────────────────────────────────────────
let _uidCounter = 0;
function makeId() {
  return ++_uidCounter;
}

interface FrameItem {
  uid: number;
  src: string;
}

// ─── Shared helpers ────────────────────────────────────────────
function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded border border-red-500/30 bg-red-500/10 p-3">
      <span className="retro text-[8px] text-red-400">! {message}</span>
    </div>
  );
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-2 overflow-y-auto max-h-[40vh] lg:max-h-[70vh] pr-1">
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
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-background/85 opacity-0 hover:opacity-100 transition-opacity">
                <button
                  className="flex items-center justify-center w-7 h-7 border border-border bg-background hover:border-primary hover:text-primary text-muted-foreground retro text-[11px] transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onInspect(i);
                  }}
                  title="Inspect"
                >
                  {"⤢"}
                </button>
                <button
                  className="flex items-center justify-center w-7 h-7 border border-border bg-background hover:border-primary hover:text-primary text-muted-foreground transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditPixels(i);
                  }}
                  title="Edit Pixels"
                >
                  <Pencil size={12} />
                </button>
                <button
                  className="flex items-center justify-center w-7 h-7 border border-border bg-background hover:border-primary hover:text-primary text-muted-foreground retro text-[11px] transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopy(item.uid);
                  }}
                  title="Duplicate"
                >
                  {"⧉"}
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
export function PhaseFrames({
  frames,
  projectId,
  onBack,
}: {
  frames: string[];
  projectId: string | null;
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

  // Handle frame save from modal (updates the frame source)
  const handleFrameSave = useCallback((uid: number, newSrc: string) => {
    setFrameList((prev) =>
      prev.map((f) => (f.uid === uid ? { ...f, src: newSrc } : f))
    );
  }, []);

  // Handle navigation in modals
  const handleModalNavigate = useCallback((newIndex: number) => {
    if (newIndex >= 0 && newIndex < frameList.length) {
      setModalIndex(newIndex);
      // Reset editModeIndex when navigating - edit mode will be handled by the modal itself
      setEditModeIndex(null);
    }
  }, [frameList.length]);

  // Open pixel editor directly
  const handleEditPixels = useCallback((index: number) => {
    setModalIndex(index);
    setEditModeIndex(index);
  }, []);

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
        job_id: "manual",
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
          onCreateProject={async (name: string) => {
            const newProject = await createProject(name);
            setProjects((prev) => [...prev, newProject]);
            return newProject;
          }}
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

<div className="flex flex-col lg:flex-row w-full max-w-6xl gap-4 lg:gap-6 px-4 lg:px-0">
        {/* Left — Preview + controls */}
        <Card
          font="retro"
          className="border-border bg-card w-full lg:w-[35%] shrink-0"
        >
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-[11px]">Preview</CardTitle>
            <CardDescription className="text-[8px]">
              Live playback at {fps} FPS
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-2 px-4 pb-4">
            <div className="flex aspect-square max-h-[300px] lg:max-h-none items-center justify-center border-2 border-border bg-background/50 mx-auto w-full">
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
                {saving ? "Saving..." : "Save Animation"}
              </Button>
            </div>

            {saved && (
              <div className="flex items-center justify-center gap-2 border border-primary/30 bg-green-500/50 p-1.5 m">
                <span className="retro text-[7px]">Saved</span>
              </div>
            )}
            {error && <ErrorBox message={error} />}
          </CardContent>
        </Card>

{/* Right — Drag-and-drop frame grid */}
        <Card font="retro" className="flex flex-col border-border bg-card w-full lg:flex-1">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-[11px]">Frames</CardTitle>
            <CardDescription className="text-[8px]">
              Drag to reorder - right-click or hover for options
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