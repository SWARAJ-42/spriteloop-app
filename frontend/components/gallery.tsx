"use client";

import Image, { StaticImageData } from "next/image";
import { Badge } from "@/components/ui/8bit/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/8bit/card";
import animation_0 from "@/assets/gallery/animation_0.gif";
import animation_1 from "@/assets/gallery/animation_1.gif";
import animation_2 from "@/assets/gallery/animation_2.gif";
import animation_3 from "@/assets/gallery/animation_3.gif";
import animation_4 from "@/assets/gallery/animation_4.gif";
import animation_5 from "@/assets/gallery/animation_5.gif";
import animation_6 from "@/assets/gallery/animation_6.gif";
import animation_7 from "@/assets/gallery/animation_7.gif";
import animation_8 from "@/assets/gallery/animation_8.gif";

interface GalleryItem {
  name: string;
  type: string;
  src: StaticImageData;
}

const showcaseItems: GalleryItem[] = [
  {
    name: "Animation 0",
    type: "Walk Cycle",
    src: animation_0,
  },
  {
    name: "Animation 1",
    type: "Walk Cycle",
    src: animation_1,
  },
  {
    name: "Animation 2",
    type: "Spell Cast",
    src: animation_2,
  },
  {
    name: "Animation 3",
    type: "Attack",
    src: animation_3,
  },
  {
    name: "Animation 4",
    type: "Idle",
    src: animation_4,
  },
  {
    name: "Animation 5",
    type: "Dash",
    src: animation_5,
  },
  {
    name: "Animation 6",
    type: "Float",
    src: animation_6,
  },
  {
    name: "Animation 7",
    type: "Float",
    src: animation_7,
  },
  {
    name: "Animation 8",
    type: "Float",
    src: animation_8,
  },
];

export function Gallery() {
  return (
    <section id="gallery" className="relative py-24 space-grid nebula-bg-alt">
      <div className="pointer-events-none absolute top-0 left-0 w-full h-54 bg-gradient-to-b from-[hsl(230_40%_4%)] to-transparent z-10" />
      <div className="pointer-events-none absolute bottom-0 left-0 w-full h-54 bg-gradient-to-b from-transparent to-[hsl(230_40%_4%)] z-10" />
      <div className="scanline-overlay absolute inset-0 z-0" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 lg:px-8">
        {/* Section header */}
        <div className="mb-16 flex flex-col items-center gap-4">
          <span className="retro text-[10px] text-secondary glow-purple">
            {"< GALLERY >"}
          </span>
          <h2 className="retro text-center text-lg text-foreground  md:text-xl">
            Character Gallery
          </h2>
          <p className="retro max-w-xl text-center text-[9px] leading-relaxed text-muted-foreground">
            Some of our example generations.
          </p>
        </div>

        {/* Gallery grid */}
        <div className="flex flex-wrap justify-center items-center">
          {showcaseItems.map((item) => (
            <Card
              key={item.name}
              font="retro"
              className="border-border bg-card group transition-all hover:glow-box-cyan m-4"
            >
              <div className="relative h-48 w-48">
                <Image
                  src={item.src}
                  alt={item.name}
                  fill
                  className="object-contain pixelated"
                  unoptimized
                />
              </div>

              {/* Info section */}
              {/* <CardContent className="flex items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <CardTitle className="text-[9px] text-foreground">
                    {item.name}
                  </CardTitle>
                  <CardDescription className="text-[7px]">
                    {item.type}
                  </CardDescription>
                </div>
                <Badge font="retro" variant="secondary">
                  <span className="text-[7px]">8 FPS</span>
                </Badge>
              </CardContent> */}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
