"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { XSquare, Paintbrush, Eraser, RotateCcw, Check } from "lucide-react";

// ── Constants ──────────────────────────────────────────────────
const IMG_SIZE = 256; // source image is 256×256
const BLOCK = 8; // each pixel-art cell is 8×8 source pixels
const GRID = IMG_SIZE / BLOCK; // 32 cells across / down
const CANVAS_DISPLAY = 384; // display size of the drawing canvas (px)
const CELL_DISPLAY = CANVAS_DISPLAY / GRID; // ≈ 12px per cell on screen

// ── Types ──────────────────────────────────────────────────────
// Only `src` is needed; any extra fields (uid, id, etc.) are allowed
export interface FrameItem {
  src: string;
  [key: string]: unknown;
}

type Tool = "paint" | "eraser";

// ── Color helpers ──────────────────────────────────────────────
function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function colorDistance(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number
): number {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

/**
 * Extract up to `maxColors` dominant colors from an ImageData
 * using a simple median-cut–style bucket approach.
 */
function extractPalette(imageData: ImageData, maxColors = 16): string[] {
  const data = imageData.data;
  const counts: Record<string, number> = {};

  // Quantise each pixel to 5-bit channels to group similar shades
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 128) continue; // skip transparent
    const r = data[i] & 0xf8;
    const g = data[i + 1] & 0xf8;
    const b = data[i + 2] & 0xf8;
    const key = `${r},${g},${b}`;
    counts[key] = (counts[key] ?? 0) + 1;
  }

  // Sort by frequency and take top candidates
  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key.split(",").map(Number) as [number, number, number]);

  // De-duplicate colours that are too similar (Euclidean dist < 30)
  const palette: [number, number, number][] = [];
  for (const [r, g, b] of sorted) {
    if (palette.length >= maxColors) break;
    const tooClose = palette.some(([pr, pg, pb]) =>
      colorDistance(r, g, b, pr, pg, pb) < 30
    );
    if (!tooClose) palette.push([r, g, b]);
  }

  return palette.map(([r, g, b]) => rgbToHex(r, g, b));
}

/**
 * Read the source image into an off-screen canvas and return a
 * flat array of hex colours for each BLOCK×BLOCK cell (row-major),
 * along with the original image dimensions.
 */
async function srcToGrid(src: string): Promise<{ grid: string[][]; originalWidth: number; originalHeight: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Store original dimensions
      const originalWidth = img.naturalWidth;
      const originalHeight = img.naturalHeight;

      const offscreen = document.createElement("canvas");
      offscreen.width = IMG_SIZE;
      offscreen.height = IMG_SIZE;
      const ctx = offscreen.getContext("2d")!;
      ctx.drawImage(img, 0, 0, IMG_SIZE, IMG_SIZE);

      const grid: string[][] = [];
      for (let row = 0; row < GRID; row++) {
        grid[row] = [];
        for (let col = 0; col < GRID; col++) {
          // Sample the centre pixel of each cell
          const px = col * BLOCK + Math.floor(BLOCK / 2);
          const py = row * BLOCK + Math.floor(BLOCK / 2);
          const [r, g, b] = ctx.getImageData(px, py, 1, 1).data;
          grid[row][col] = rgbToHex(r, g, b);
        }
      }
      resolve({ grid, originalWidth, originalHeight });
    };
    img.onerror = () => {
      // Fallback: white grid at default size
      resolve({
        grid: Array.from({ length: GRID }, () => Array(GRID).fill("#ffffff")),
        originalWidth: IMG_SIZE,
        originalHeight: IMG_SIZE,
      });
    };
    img.src = src;
  });
}

/**
 * Convert the 32×32 colour grid back to a data-URL PNG at the specified size.
 * If no size is provided, defaults to IMG_SIZE (256×256).
 */
function gridToDataUrl(grid: string[][], outputWidth: number = IMG_SIZE, outputHeight: number = IMG_SIZE): string {
  const offscreen = document.createElement("canvas");
  offscreen.width = outputWidth;
  offscreen.height = outputHeight;
  const ctx = offscreen.getContext("2d")!;

  // Calculate block size based on output dimensions
  const blockWidth = outputWidth / GRID;
  const blockHeight = outputHeight / GRID;

  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      ctx.fillStyle = grid[row][col];
      ctx.fillRect(col * blockWidth, row * blockHeight, blockWidth, blockHeight);
    }
  }
  return offscreen.toDataURL("image/png");
}

/**
 * Read the full palette from the source image (for the palette panel).
 */
async function extractPaletteFromSrc(src: string): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const offscreen = document.createElement("canvas");
      offscreen.width = IMG_SIZE;
      offscreen.height = IMG_SIZE;
      const ctx = offscreen.getContext("2d")!;
      ctx.drawImage(img, 0, 0, IMG_SIZE, IMG_SIZE);
      const imageData = ctx.getImageData(0, 0, IMG_SIZE, IMG_SIZE);
      resolve(extractPalette(imageData, 20));
    };
    img.onerror = () => resolve(["#000000", "#ffffff"]);
    img.src = src;
  });
}

// ── Sub-components ─────────────────────────────────────────────

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
      className={`w-7 h-7 rounded-sm border-2 transition-transform hover:scale-110 focus:outline-none ${
        selected
          ? "border-white scale-110 shadow-lg shadow-white/30 ring-1 ring-white"
          : "border-transparent"
      }`}
      style={{ backgroundColor: color }}
      aria-label={`Select color ${color}`}
      aria-pressed={selected}
    />
  );
}

function ToolButton({
  active,
  onClick,
  children,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`p-2 rounded border transition-colors ${
        active
          ? "bg-white/20 border-white/40 text-white"
          : "border-white/10 text-white/50 hover:text-white hover:border-white/30"
      }`}
    >
      {children}
    </button>
  );
}

// ── Main PixelEditorModal ──────────────────────────────────────

export function PixelEditorModal({
  item,
  index,
  onSave,
  onClose,
}: {
  item: FrameItem;
  index: number;
  onSave: (newSrc: string) => void;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

const [grid, setGrid] = useState<string[][] | null>(null);
  const [palette, setPalette] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>("#000000");
  const [tool, setTool] = useState<Tool>("paint");
  const [isPainting, setIsPainting] = useState(false);
  const [originalGrid, setOriginalGrid] = useState<string[][] | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number }>({ width: IMG_SIZE, height: IMG_SIZE });

// ── Load image into grid + palette on mount ──────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [gridResult, p] = await Promise.all([
        srcToGrid(item.src),
        extractPaletteFromSrc(item.src),
      ]);
      if (cancelled) return;

      // Always include pure black & white at the front
      const fullPalette = ["#000000", "#ffffff", ...p.filter(
        (c) => c !== "#000000" && c !== "#ffffff"
      )];
      setPalette(fullPalette);
      setSelectedColor(fullPalette[0]);
      setGrid(gridResult.grid);
      setOriginalGrid(gridResult.grid.map((row) => [...row]));
      // Store original dimensions so we can output at the same size
      setOriginalDimensions({ width: gridResult.originalWidth, height: gridResult.originalHeight });
    })();
    return () => { cancelled = true; };
  }, [item.src]);

  // ── Redraw canvas whenever grid changes ─────────────────────
  useEffect(() => {
    if (!grid || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d")!;
    ctx.clearRect(0, 0, CANVAS_DISPLAY, CANVAS_DISPLAY);

    for (let row = 0; row < GRID; row++) {
      for (let col = 0; col < GRID; col++) {
        ctx.fillStyle = grid[row][col];
        ctx.fillRect(
          col * CELL_DISPLAY,
          row * CELL_DISPLAY,
          CELL_DISPLAY,
          CELL_DISPLAY
        );
      }
    }

    // Draw faint grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_DISPLAY, 0);
      ctx.lineTo(i * CELL_DISPLAY, CANVAS_DISPLAY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_DISPLAY);
      ctx.lineTo(CANVAS_DISPLAY, i * CELL_DISPLAY);
      ctx.stroke();
    }
  }, [grid]);

  // ── Escape key ───────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "b" || e.key === "B") setTool("paint");
      if (e.key === "e" || e.key === "E") setTool("eraser");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // ── Paint helper ─────────────────────────────────────────────
  const paintCell = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!grid || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const clientX =
        "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY =
        "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

      const scaleX = CANVAS_DISPLAY / rect.width;
      const scaleY = CANVAS_DISPLAY / rect.height;
      const x = (clientX - rect.left) * scaleX;
      const y = (clientY - rect.top) * scaleY;

      const col = Math.floor(x / CELL_DISPLAY);
      const row = Math.floor(y / CELL_DISPLAY);

      if (col < 0 || col >= GRID || row < 0 || row >= GRID) return;

      const newColor = tool === "eraser" ? "#ffffff" : selectedColor;
      if (grid[row][col] === newColor) return; // no change

      setGrid((prev) => {
        if (!prev) return prev;
        const next = prev.map((r) => [...r]);
        next[row][col] = newColor;
        return next;
      });
    },
    [grid, selectedColor, tool]
  );

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsPainting(true);
    paintCell(e);
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPainting) paintCell(e);
  };
  const handleMouseUp = () => setIsPainting(false);

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsPainting(true);
    paintCell(e);
  };
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (isPainting) paintCell(e);
  };

  // ── Reset ────────────────────────────────────────────────────
  const handleReset = () => {
    if (originalGrid) setGrid(originalGrid.map((row) => [...row]));
  };

// ── Apply / save ─────────────────────────────────────────────
  const handleApply = () => {
    if (!grid) return;
    // Output at the original image dimensions to prevent shrinking
    const dataUrl = gridToDataUrl(grid, originalDimensions.width, originalDimensions.height);
    onSave(dataUrl);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col md:flex-row gap-4 bg-[#111118] border border-white/10 rounded-xl p-5 shadow-2xl w-full max-w-3xl mx-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="absolute top-4 left-5 right-5 flex items-center justify-between pointer-events-none">
          <span className="text-[10px] font-mono text-white/40 tracking-widest uppercase">
            Pixel Editor · Frame {String(index + 1).padStart(2, "0")}
          </span>
          <button
            className="pointer-events-auto text-white/40 hover:text-white transition-colors"
            onClick={onClose}
            aria-label="Close editor"
          >
            <XSquare size={18} />
          </button>
        </div>

        {/* ── Canvas ── */}
        <div className="flex flex-col items-center gap-3 pt-7">
          <canvas
            ref={canvasRef}
            width={CANVAS_DISPLAY}
            height={CANVAS_DISPLAY}
            className="border border-white/10 rounded cursor-crosshair touch-none"
            style={{ width: CANVAS_DISPLAY, height: CANVAS_DISPLAY, imageRendering: "pixelated" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => setIsPainting(false)}
          />

          {/* Tool row */}
          <div className="flex items-center gap-2">
            <ToolButton active={tool === "paint"} onClick={() => setTool("paint")} title="Paint (B)">
              <Paintbrush size={14} />
            </ToolButton>
            <ToolButton active={tool === "eraser"} onClick={() => setTool("eraser")} title="Eraser (E)">
              <Eraser size={14} />
            </ToolButton>
            <ToolButton active={false} onClick={handleReset} title="Reset to original">
              <RotateCcw size={14} />
            </ToolButton>

            {/* Active color preview */}
            <div
              className="w-7 h-7 rounded border-2 border-white/30 ml-2"
              style={{ backgroundColor: selectedColor }}
              title={`Active: ${selectedColor}`}
            />
            <span className="text-[9px] font-mono text-white/40">{selectedColor}</span>
          </div>
        </div>

        {/* ── Right panel: palette + actions ── */}
        <div className="flex flex-col justify-between gap-4 pt-7 min-w-[140px]">
          <div className="flex flex-col gap-3">
            <span className="text-[9px] font-mono text-white/30 tracking-widest uppercase">
              Palette
            </span>

            {palette.length === 0 ? (
              <div className="text-[9px] text-white/30 font-mono">Extracting…</div>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-w-[140px]">
                {palette.map((color) => (
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
            )}
          </div>

          {/* Apply / Cancel */}
          <div className="flex flex-col gap-2 mt-auto">
            <button
              onClick={handleApply}
              disabled={!grid}
              className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-white text-black text-[10px] font-mono tracking-widest uppercase rounded hover:bg-white/90 disabled:opacity-40 transition-colors"
            >
              <Check size={12} />
              Apply & Save
            </button>
            <button
              onClick={onClose}
              className="w-full py-2 px-4 border border-white/10 text-white/40 text-[10px] font-mono tracking-widest uppercase rounded hover:border-white/30 hover:text-white/70 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}