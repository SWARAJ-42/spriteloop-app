"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/8bit/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/8bit/card";

interface SpriteConfig {
  name: string;
  type: string;
  colors: { head: string; body: string; legs: string; accent: string };
}

const showcaseItems: SpriteConfig[] = [
  {
    name: "Star Captain",
    type: "Walk Cycle",
    colors: { head: "hsl(0 0% 90%)", body: "hsl(190 100% 55%)", legs: "hsl(210 40% 40%)", accent: "hsl(45 100% 60%)" },
  },
  {
    name: "Nebula Mage",
    type: "Spell Cast",
    colors: { head: "hsl(275 50% 80%)", body: "hsl(275 70% 45%)", legs: "hsl(275 50% 30%)", accent: "hsl(190 100% 70%)" },
  },
  {
    name: "Solar Berserker",
    type: "Attack",
    colors: { head: "hsl(20 90% 60%)", body: "hsl(45 100% 50%)", legs: "hsl(20 70% 40%)", accent: "hsl(0 85% 55%)" },
  },
  {
    name: "Cryo Sentinel",
    type: "Idle",
    colors: { head: "hsl(190 80% 75%)", body: "hsl(190 60% 50%)", legs: "hsl(200 40% 35%)", accent: "hsl(190 100% 90%)" },
  },
  {
    name: "Void Assassin",
    type: "Dash",
    colors: { head: "hsl(270 20% 50%)", body: "hsl(260 30% 20%)", legs: "hsl(260 20% 15%)", accent: "hsl(275 70% 55%)" },
  },
  {
    name: "Astral Spirit",
    type: "Float",
    colors: { head: "hsl(190 80% 80%)", body: "hsl(190 60% 55%)", legs: "hsl(200 50% 40%)", accent: "hsl(45 100% 75%)" },
  },
];

function AnimatedShowcaseSprite({ config, index }: { config: SpriteConfig; index: number }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((prev) => (prev + 1) % 4);
    }, 250 + index * 50);
    return () => clearInterval(interval);
  }, [index]);

  const offsets = [0, 1, 0, -1];

  return (
    <svg viewBox="0 0 16 16" className="w-full h-full pixelated" xmlns="http://www.w3.org/2000/svg">
      {/* Helmet */}
      <rect x="5" y={1 + offsets[frame] * 0.3} width="6" height="5" fill={config.colors.head} />
      {/* Visor */}
      <rect x="6" y={3 + offsets[frame] * 0.3} width="4" height="1" fill="hsl(190 100% 55% / 0.6)" />
      {/* Body */}
      <rect x="4" y="6" width="8" height="5" fill={config.colors.body} />
      {/* Arms */}
      <rect x={2 + offsets[frame]} y="7" width="2" height="3" fill={config.colors.body} />
      <rect x={12 - offsets[frame]} y="7" width="2" height="3" fill={config.colors.body} />
      {/* Weapon glow */}
      <rect x={14 - offsets[frame]} y={4 + offsets[frame]} width="1" height="4" fill={config.colors.accent} />
      {/* Legs */}
      <rect x="5" y="11" width="2" height={3 + offsets[(frame + 1) % 4] * 0.5} fill={config.colors.legs} />
      <rect x="9" y="11" width="2" height={3 - offsets[(frame + 1) % 4] * 0.5} fill={config.colors.legs} />
    </svg>
  );
}

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
            {"< CREW MANIFEST >"}
          </span>
          <h2 className="retro text-center text-lg text-foreground  md:text-xl">
            Character Gallery
          </h2>
          <p className="retro max-w-xl text-center text-[9px] leading-relaxed text-muted-foreground">
            See what others have created. Every character started as a simple 2D image.
          </p>
        </div>

        {/* Gallery grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {showcaseItems.map((item, index) => (
            <Card key={item.name} font="retro" className="border-border bg-card group transition-all hover:glow-box-cyan">
              {/* Sprite display area */}
              <CardHeader className="flex items-center justify-center bg-background/50 p-8">
                <div className="h-24 w-24">
                  <AnimatedShowcaseSprite config={item} index={index} />
                </div>
              </CardHeader>

              {/* Info section */}
              <CardContent className="flex items-center justify-between gap-3">
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
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Community stats */}
        {/* <Card font="retro" className="mt-4 border-border bg-card">
          <CardContent className="flex flex-wrap items-center justify-center gap-8 p-6 md:justify-between">
            <span className="retro text-[9px] text-muted-foreground">
              JOIN 50,000+ SPACE EXPLORERS
            </span>
            <div className="flex gap-6">
              {["Unity", "Godot", "Unreal", "RPG Maker", "GameMaker"].map(
                (engine) => (
                  <span
                    key={engine}
                    className="retro text-[8px] text-foreground/60 transition-colors hover:text-foreground hover: cursor-pointer"
                  >
                    {engine}
                  </span>
                )
              )}
            </div>
          </CardContent>
        </Card> */}
      </div>
    </section>
  );
}
