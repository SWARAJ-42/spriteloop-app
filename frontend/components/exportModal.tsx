import { Button } from "@/components/ui/8bit/button";
import { Card } from "./ui/8bit/card";

export function ExportModal({
  frames,
  fps,
  onClose,
  onExportSpritesheet,
  onExportSpine,
  onExportGif,
}: {
  frames: string[];
  fps: number;
  onClose: () => void;
  onExportSpritesheet: () => void;
  onExportSpine: () => void;
  onExportGif: () => void;
}) {
  return (
    <Card className="fixed inset-0 bg-black/70 flex items-center justify-center z-100">
      <Card className="bg-card p-4 w-[320px] space-y-3">
        
        {/* Preview */}
        <div className="aspect-square border bg-background flex items-center justify-center">
          <img src={frames[0]} className="pixelated object-contain w-full h-full" />
        </div>

        <div className="retro text-[8px] text-center">
          Preview ({frames.length} frames)
        </div>

        {/* OPTIONS */}
        <div className="flex flex-col gap-2">
          <Button onClick={onExportSpritesheet} className="bg-cyan-900/40 hover:bg-cyan-800/60 text-cyan-300 border-cyan-900 h-7 text-[8px]">
            Export SpriteSheet
          </Button>

          <Button onClick={onExportSpine} className="bg-cyan-900/40 hover:bg-cyan-800/60 text-cyan-300 border-cyan-900 h-7 text-[8px]">
            Export Spine (.json)
          </Button>

          <Button onClick={onExportGif} className="bg-cyan-900/40 hover:bg-cyan-800/60 text-cyan-300 border-cyan-900 h-7 text-[8px]">
            Export GIF
          </Button>
        </div>

        <Button onClick={onClose} className="bg-cyan-900/40 hover:bg-cyan-800/60 text-cyan-300 border-cyan-900 h-7 text-[8px]">
          Close
        </Button>
      </Card>
    </Card>
  );
}