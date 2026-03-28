"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  XSquare,
  Pencil,
  Paintbrush,
  Eraser,
  RotateCcw,
  Check,
  ChevronLeft,
  ChevronRight,
  Undo2,
  Redo2,
} from "lucide-react";
import { Badge } from "@/components/ui/8bit/badge";
import { Button } from "@/components/ui/8bit/button";
import { Card } from "@/components/ui/8bit/card";

// ── Shared types ───────────────────────────────────────────────
export interface FrameItem {
  uid: number;
  src: string;
}

export interface FrameModalProps {
  item: FrameItem;
  index: number;
  isKept: boolean;
  totalFrames: number;
  onToggle: () => void;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
  /** Called with the item's uid + new PNG data-URL after the user applies edits */
  onSave: (uid: number, newSrc: string) => void;
  /** If true, opens directly in pixel editor mode */
  startInEditMode?: boolean;
}

// ── Pixel-editor constants ─────────────────────────────────────
const IMG_SIZE = 256; // source image is always 256×256 px
const BLOCK = 4; // one pixel-art cell = 4×4 source pixels
const GRID = IMG_SIZE / BLOCK; // 64 cells
const CANVAS_PX = 448; // canvas render size
const CELL = CANVAS_PX / GRID; // px per cell

type PaintTool = "paint" | "eraser";

// ── Color helpers ──────────────────────────────────────────────
function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

function colorDist(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number,
): number {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

/**
 * Find up to `maxColors` perceptually distinct colors from ImageData.
 * Quantises to 5-bit channels first, then de-dupes by Euclidean distance.
 */
function extractPalette(imageData: ImageData, maxColors = 24): string[] {
  const data = imageData.data;
  const counts: Record<string, number> = {};

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue; // skip mostly-transparent
    const r = data[i] & 0xf8;
    const g = data[i + 1] & 0xf8;
    const b = data[i + 2] & 0xf8;
    const key = `${r},${g},${b}`;
    counts[key] = (counts[key] ?? 0) + 1;
  }

  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k.split(",").map(Number) as [number, number, number]);

  const palette: [number, number, number][] = [];
  for (const [r, g, b] of sorted) {
    if (palette.length >= maxColors) break;
    const tooClose = palette.some(([pr, pg, pb]) =>
      colorDist(r, g, b, pr, pg, pb) < 28,
    );
    if (!tooClose) palette.push([r, g, b]);
  }

  return palette.map(([r, g, b]) => rgbToHex(r, g, b));
}

/** Decode src into a grid — each cell samples the centre pixel of its block. Returns grid + original dimensions */
async function srcToGrid(src: string): Promise<{ grid: string[][]; originalWidth: number; originalHeight: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Store original dimensions before any scaling
      const originalWidth = img.naturalWidth;
      const originalHeight = img.naturalHeight;
      
      const off = document.createElement("canvas");
      off.width = IMG_SIZE;
      off.height = IMG_SIZE;
      const ctx = off.getContext("2d")!;
      ctx.drawImage(img, 0, 0, IMG_SIZE, IMG_SIZE);
      const grid: string[][] = Array.from({ length: GRID }, (_, row) =>
        Array.from({ length: GRID }, (_, col) => {
          const px = col * BLOCK + Math.floor(BLOCK / 2);
          const py = row * BLOCK + Math.floor(BLOCK / 2);
          const [r, g, b] = ctx.getImageData(px, py, 1, 1).data;
          return rgbToHex(r, g, b);
        }),
      );
      resolve({ grid, originalWidth, originalHeight });
    };
    img.onerror = () =>
      resolve({ 
        grid: Array.from({ length: GRID }, () => Array(GRID).fill("#000000")),
        originalWidth: IMG_SIZE,
        originalHeight: IMG_SIZE
      });
    img.src = src;
  });
}

/** Extract dominant palette directly from the src URL */
async function paletteFromSrc(src: string): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const off = document.createElement("canvas");
      off.width = IMG_SIZE;
      off.height = IMG_SIZE;
      const ctx = off.getContext("2d")!;
      ctx.drawImage(img, 0, 0, IMG_SIZE, IMG_SIZE);
      resolve(extractPalette(ctx.getImageData(0, 0, IMG_SIZE, IMG_SIZE), 24));
    };
    img.onerror = () => resolve([]);
    img.src = src;
  });
}

/** Render the grid back to a PNG data-URL at the specified dimensions (defaults to original IMG_SIZE) */
function gridToDataUrl(grid: string[][], outputWidth: number = IMG_SIZE, outputHeight: number = IMG_SIZE): string {
  const off = document.createElement("canvas");
  off.width = outputWidth;
  off.height = outputHeight;
  const ctx = off.getContext("2d")!;
  
  // Calculate block size based on output dimensions
  const blockWidth = outputWidth / GRID;
  const blockHeight = outputHeight / GRID;
  
  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      ctx.fillStyle = grid[row][col];
      ctx.fillRect(col * blockWidth, row * blockHeight, blockWidth, blockHeight);
    }
  }
  return off.toDataURL("image/png");
}

// ── Color swatch ───────────────────────────────────────────────
function ColorSwatch({
  color,
  selected,
  onClick,
}: {
  color: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      title={color}
      onClick={onClick}
      aria-pressed={selected}
      aria-label={`Select color ${color}`}
      className={`w-6 h-6 shrink-0 transition-transform hover:scale-110 focus:outline-none border ${
        selected
          ? "scale-110 ring-2 ring-offset-1 ring-offset-background ring-primary border-transparent"
          : color === "#ffffff"
            ? "border-border/50"
            : "border-transparent"
      }`}
      style={{ backgroundColor: color }}
    />
  );
}

// ── Pixel editor with undo/redo and frame navigation ───────────
function PixelEditor({
  src,
  frameIndex,
  totalFrames,
  onApply,
  onCancel,
  onNavigate,
}: {
  src: string;
  frameIndex: number;
  totalFrames: number;
  onApply: (newSrc: string) => void;
  onCancel: () => void;
  onNavigate: (newIndex: number) => void;
}) {
const canvasRef = useRef<HTMLCanvasElement>(null);
  const [grid, setGrid] = useState<string[][] | null>(null);
  const [originalGrid, setOriginalGrid] = useState<string[][] | null>(null);
  const [palette, setPalette] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [tool, setTool] = useState<PaintTool>("paint");
  const [isPainting, setIsPainting] = useState(false);
  const [loading, setLoading] = useState(true);
  // Store original image dimensions to preserve size on save
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number }>({ width: IMG_SIZE, height: IMG_SIZE });
  
  // Undo/Redo history
  const [history, setHistory] = useState<string[][][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoAction = useRef(false);

// Load grid + palette
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    // Reset history when loading new frame
    setHistory([]);
    setHistoryIndex(-1);
    
    Promise.all([srcToGrid(src), paletteFromSrc(src)]).then(
      ([gridResult, extracted]) => {
        if (cancelled) return;
        // Always put pure black + white first, then the rest deduplicated
        const rest = extracted.filter(
          (c) => c !== "#000000" && c !== "#ffffff",
        );
        setPalette(["#000000", "#ffffff", ...rest]);
        setSelectedColor("#000000");
        setGrid(gridResult.grid);
        setOriginalGrid(gridResult.grid.map((row) => [...row]));
        // Store original dimensions to preserve size when saving
        setOriginalDimensions({ width: gridResult.originalWidth, height: gridResult.originalHeight });
        // Initialize history with the original state
        setHistory([gridResult.grid.map((row) => [...row])]);
        setHistoryIndex(0);
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [src]);

  // Track grid changes for undo/redo
  useEffect(() => {
    if (!grid || isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }
    
    // Don't add to history if it's the same as the current state
    if (history.length > 0 && historyIndex >= 0) {
      const currentState = history[historyIndex];
      const isSame = currentState.every((row, r) => 
        row.every((cell, c) => cell === grid[r][c])
      );
      if (isSame) return;
    }
    
    // Add new state to history, removing any future states
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(grid.map(row => [...row]));
      // Keep max 50 states
      if (newHistory.length > 50) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [grid]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    isUndoRedoAction.current = true;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    setGrid(history[newIndex].map(row => [...row]));
  }, [canUndo, historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    isUndoRedoAction.current = true;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    setGrid(history[newIndex].map(row => [...row]));
  }, [canRedo, historyIndex, history]);

  // Redraw canvas whenever grid changes
  useEffect(() => {
    if (!grid || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d")!;
    ctx.clearRect(0, 0, CANVAS_PX, CANVAS_PX);
    for (let row = 0; row < GRID; row++) {
      for (let col = 0; col < GRID; col++) {
        ctx.fillStyle = grid[row][col];
        ctx.fillRect(col * CELL, row * CELL, CELL, CELL);
      }
    }
    // Subtle cell grid overlay
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL, 0);
      ctx.lineTo(i * CELL, CANVAS_PX);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL);
      ctx.lineTo(CANVAS_PX, i * CELL);
      ctx.stroke();
    }
  }, [grid]);

  // Keyboard shortcuts (b = paint, e = eraser, z = undo, y = redo, arrows = navigate)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "b" || e.key === "B") setTool("paint");
      if (e.key === "e" || e.key === "E") setTool("eraser");
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.shiftKey && e.key === "z"))) {
        e.preventDefault();
        handleRedo();
      }
      if (e.key === "ArrowLeft" && frameIndex > 0) {
        onNavigate(frameIndex - 1);
      }
      if (e.key === "ArrowRight" && frameIndex < totalFrames - 1) {
        onNavigate(frameIndex + 1);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleUndo, handleRedo, frameIndex, totalFrames, onNavigate]);

  const paintCell = useCallback(
    (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>,
    ) => {
      if (!grid || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const clientX =
        "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY =
        "touches" in e ? e.touches[0].clientY : e.clientY;
      const scaleX = CANVAS_PX / rect.width;
      const scaleY = CANVAS_PX / rect.height;
      const col = Math.floor(((clientX - rect.left) * scaleX) / CELL);
      const row = Math.floor(((clientY - rect.top) * scaleY) / CELL);
      if (col < 0 || col >= GRID || row < 0 || row >= GRID) return;
      // Eraser uses white color (transparent effect)
      const newColor = tool === "eraser" ? "#ffffff" : selectedColor;
      if (grid[row][col] === newColor) return;
      setGrid((prev) => {
        if (!prev) return prev;
        const next = prev.map((r) => [...r]);
        next[row][col] = newColor;
        return next;
      });
    },
    [grid, selectedColor, tool],
  );

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsPainting(true);
    paintCell(e);
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPainting) paintCell(e);
  };
  const stopPainting = () => setIsPainting(false);

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsPainting(true);
    paintCell(e);
  };
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (isPainting) paintCell(e);
  };

const handleApplyClick = () => {
    if (grid) {
      // Output at original dimensions to prevent shrinking
      const dataUrl = gridToDataUrl(grid, originalDimensions.width, originalDimensions.height);
      onApply(dataUrl);
    }
  };

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* ── Canvas side ─────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 bg-background/40">
        {/* Tool bar */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border shrink-0">
          <button
            title="Paint (B)"
            onClick={() => setTool("paint")}
            className={`flex items-center gap-1.5 px-3 py-1.5 border retro text-[8px] transition-colors ${
              tool === "paint"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            <Paintbrush size={11} />
            Paint
          </button>
          <button
            title="Eraser (E)"
            onClick={() => setTool("eraser")}
            className={`flex items-center gap-1.5 px-3 py-1.5 border retro text-[8px] transition-colors ${
              tool === "eraser"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            <Eraser size={11} />
            Eraser
          </button>
          
          <div className="w-px h-5 bg-border mx-1" />
          
          <button
            title="Undo (Ctrl+Z)"
            onClick={handleUndo}
            disabled={!canUndo}
            className={`flex items-center gap-1.5 px-2 py-1.5 border retro text-[8px] transition-colors ${
              canUndo
                ? "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                : "border-border/50 text-muted-foreground/30 cursor-not-allowed"
            }`}
          >
            <Undo2 size={11} />
          </button>
          <button
            title="Redo (Ctrl+Y)"
            onClick={handleRedo}
            disabled={!canRedo}
            className={`flex items-center gap-1.5 px-2 py-1.5 border retro text-[8px] transition-colors ${
              canRedo
                ? "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                : "border-border/50 text-muted-foreground/30 cursor-not-allowed"
            }`}
          >
            <Redo2 size={11} />
          </button>
          
          <div className="w-px h-5 bg-border mx-1" />
          
          <button
            title="Reset to original"
            onClick={() => {
              if (originalGrid) {
                isUndoRedoAction.current = false;
                setGrid(originalGrid.map((r) => [...r]));
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border retro text-[8px] text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
          >
            <RotateCcw size={11} />
            Reset
          </button>
          {/* Active colour preview */}
          <div className="flex items-center gap-1.5 ml-auto">
            <div
              className="w-4 h-4 border border-border/60 shrink-0"
              style={{ backgroundColor: selectedColor }}
            />
            <span className="retro text-[7px] text-muted-foreground font-mono">
              {selectedColor}
            </span>
          </div>
        </div>

        {/* Canvas with navigation */}
        <div className="relative flex items-center justify-center p-4 flex-1">
          {/* Left navigation */}
          <button
            onClick={() => frameIndex > 0 && onNavigate(frameIndex - 1)}
            disabled={frameIndex === 0}
            className={`absolute left-2 z-10 p-2 border bg-background/80 transition-colors ${
              frameIndex === 0
                ? "border-border/30 text-muted-foreground/30 cursor-not-allowed"
                : "border-border text-muted-foreground hover:border-primary hover:text-primary"
            }`}
            title="Previous frame"
          >
            <ChevronLeft size={16} />
          </button>

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70 z-10">
              <span className="retro text-[9px] text-muted-foreground animate-pulse">
                Loading…
              </span>
            </div>
          )}
          <canvas
            ref={canvasRef}
            width={CANVAS_PX}
            height={CANVAS_PX}
            className="border border-border/40 cursor-crosshair touch-none"
            style={{
              width: CANVAS_PX,
              height: CANVAS_PX,
              imageRendering: "pixelated",
              maxWidth: "100%",
              maxHeight: "100%",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={stopPainting}
            onMouseLeave={stopPainting}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={stopPainting}
          />

          {/* Right navigation */}
          <button
            onClick={() => frameIndex < totalFrames - 1 && onNavigate(frameIndex + 1)}
            disabled={frameIndex === totalFrames - 1}
            className={`absolute right-2 z-10 p-2 border bg-background/80 transition-colors ${
              frameIndex === totalFrames - 1
                ? "border-border/30 text-muted-foreground/30 cursor-not-allowed"
                : "border-border text-muted-foreground hover:border-primary hover:text-primary"
            }`}
            title="Next frame"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Frame indicator */}
        <div className="flex items-center justify-center gap-2 px-4 py-2 border-t border-border">
          <span className="retro text-[8px] text-muted-foreground">
            Frame {frameIndex + 1} / {totalFrames}
          </span>
        </div>
      </div>

      {/* ── Palette + actions ────────────────────────────────── */}
      <div className="flex flex-col border-l border-border w-52 shrink-0 p-4 gap-4 overflow-y-auto">
        <div className="flex flex-col gap-3">
          <span className="retro text-[8px] text-muted-foreground tracking-widest uppercase">
            Palette
          </span>

          {loading ? (
            <span className="retro text-[8px] text-muted-foreground animate-pulse">
              Extracting…
            </span>
          ) : (
            <>
              {/* Black & white — always shown first */}
              <div className="flex flex-col gap-1.5">
                <span className="retro text-[7px] text-muted-foreground/60 uppercase tracking-wide">
                  Base
                </span>
                <div className="flex gap-1.5">
                  {palette.slice(0, 2).map((color) => (
                    <ColorSwatch
                      key={color}
                      color={color}
                      selected={selectedColor === color}
                      onClick={() => {
                        setSelectedColor(color);
                        setTool("paint");
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Colors extracted from image */}
              {palette.length > 2 && (
                <div className="flex flex-col gap-1.5">
                  <span className="retro text-[7px] text-muted-foreground/60 uppercase tracking-wide">
                    From image
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {palette.slice(2).map((color) => (
                      <ColorSwatch
                        key={color}
                        color={color}
                        selected={selectedColor === color}
                        onClick={() => {
                          setSelectedColor(color);
                          setTool("paint");
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Keyboard hints */}
        <div className="flex flex-col gap-1 retro text-[7px] text-muted-foreground/40 mt-auto">
          <span>B — paint</span>
          <span>E — eraser</span>
          <span>Ctrl+Z — undo</span>
          <span>Ctrl+Y — redo</span>
          <span>Arrow keys — navigate</span>
          <span>Esc — back</span>
        </div>

        {/* Apply / Cancel */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleApplyClick}
            disabled={!grid || loading}
            className="flex items-center justify-center gap-1.5 w-full py-2 px-3 bg-primary text-primary-foreground retro text-[8px] tracking-widest uppercase hover:opacity-90 disabled:opacity-40 transition-opacity border border-primary"
          >
            <Check size={10} />
            Apply & Save
          </button>
          <button
            onClick={onCancel}
            className="w-full py-2 px-3 border border-border text-muted-foreground retro text-[8px] tracking-widest uppercase hover:border-primary/50 hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── FrameModal with navigation ─────────────────────────────────
export function FrameModal({
  item,
  index,
  isKept,
  totalFrames,
  onToggle,
  onClose,
  onNavigate,
  onSave,
  startInEditMode = false,
}: FrameModalProps) {
  const [editMode, setEditMode] = useState(startInEditMode);

  // Escape: exit edit mode → then close
  // Arrow keys: navigate frames (only in preview mode)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (editMode) setEditMode(false);
        else onClose();
        return;
      }
      
      // Only handle arrow navigation in preview mode (edit mode handles its own)
      if (!editMode) {
        if (e.key === "ArrowLeft" && index > 0) {
          onNavigate(index - 1);
        }
        if (e.key === "ArrowRight" && index < totalFrames - 1) {
          onNavigate(index + 1);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editMode, onClose, index, totalFrames, onNavigate]);

  const handleApply = (newSrc: string) => {
    onSave(item.uid, newSrc);
    setEditMode(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={() => !editMode && onClose()}
    >
      <Card
        className={`relative flex flex-col transition-all duration-200 ${
          editMode ? "w-full max-w-5xl h-[90vh]" : "w-full max-w-xl"
        }`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Frame ${index + 1} — ${editMode ? "pixel editor" : "preview"}`}
      >
        {/* ── Header (always visible) ──────────────────── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <span className="retro text-[10px] text-foreground">
              Frame {String(index + 1).padStart(2, "0")} / {totalFrames}
            </span>
            <Badge variant={isKept ? "default" : "secondary"}>
              <span className="text-[7px]">{isKept ? "SELECTED" : "REMOVED"}</span>
            </Badge>
            {editMode && (
              <Badge variant="outline">
                <span className="text-[7px]">EDIT MODE</span>
              </Badge>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <XSquare size={18} />
          </button>
        </div>

        {/* ── Body ─────────────────────────────────────── */}
        {editMode ? (
          <PixelEditor
            src={item.src}
            frameIndex={index}
            totalFrames={totalFrames}
            onApply={handleApply}
            onCancel={() => setEditMode(false)}
            onNavigate={onNavigate}
          />
        ) : (
          <div className="flex flex-col gap-4 p-6">
            {/* Frame preview with navigation */}
            <div className="relative flex items-center">
              {/* Left navigation */}
              <button
                onClick={() => index > 0 && onNavigate(index - 1)}
                disabled={index === 0}
                className={`absolute left-0 z-10 p-2 border bg-background/80 transition-colors ${
                  index === 0
                    ? "border-border/30 text-muted-foreground/30 cursor-not-allowed"
                    : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                }`}
                title="Previous frame"
              >
                <ChevronLeft size={20} />
              </button>

              <div
                className={`flex-1 flex items-center justify-center border-2 bg-background/50 p-4 mx-12 transition-all ${
                  isKept ? "border-primary " : "border-border/30"
                }`}
              >
                <img
                  src={item.src}
                  alt={`Frame ${index + 1}`}
                  className={`w-full max-h-72 object-contain transition-all ${
                    !isKept ? "opacity-40 grayscale" : ""
                  }`}
                  style={{ imageRendering: "pixelated" }}
                />
              </div>

              {/* Right navigation */}
              <button
                onClick={() => index < totalFrames - 1 && onNavigate(index + 1)}
                disabled={index === totalFrames - 1}
                className={`absolute right-0 z-10 p-2 border bg-background/80 transition-colors ${
                  index === totalFrames - 1
                    ? "border-border/30 text-muted-foreground/30 cursor-not-allowed"
                    : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                }`}
                title="Next frame"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant={isKept ? "outline" : "default"}
                className="flex-1 retro text-[9px]"
                onClick={onToggle}
              >
                {isKept ? "Remove Frame" : "Keep Frame"}
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-1.5 retro text-[9px] px-4"
                onClick={() => setEditMode(true)}
              >
                <Pencil size={12} />
                Edit Pixels
              </Button>
              <Button
                variant="outline"
                className="retro text-[9px] px-4"
                onClick={onClose}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}