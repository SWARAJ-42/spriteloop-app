"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/8bit/card";
import { FloatingAssets } from "@/components/floating-assets";
import { useEffect, useState } from "react";
import { PixelStar } from "./hero";

const features = [
  {
    icon: (
      <svg viewBox="0 0 12 12" className="w-8 h-8 pixelated" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="8" width="2" height="2" fill="hsl(190 100% 55%)" />
        <rect x="4" y="5" width="2" height="2" fill="hsl(190 100% 55%)" />
        <rect x="7" y="3" width="2" height="2" fill="hsl(190 100% 55%)" />
        <rect x="10" y="1" width="2" height="2" fill="hsl(45 100% 60%)" />
        <rect x="0" y="10" width="12" height="1" fill="hsl(275 70% 55% / 0.4)" />
      </svg>
    ),
    title: "Pixel Animation generation",
    description:
      "Automatically generate smooth walk, run, jump, attack and idle animation with customizable frame counts and speeds.",
  },
  {
    icon: (
      <svg viewBox="0 0 12 12" className="w-8 h-8 pixelated" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="1" width="2" height="2" fill="hsl(45 100% 60%)" />
        <rect x="3" y="3" width="6" height="6" fill="none" stroke="hsl(190 100% 55%)" strokeWidth="1" />
        <rect x="5" y="5" width="2" height="2" fill="hsl(275 70% 55%)" />
        <rect x="1" y="5" width="2" height="2" fill="hsl(190 100% 55% / 0.5)" />
        <rect x="9" y="5" width="2" height="2" fill="hsl(190 100% 55% / 0.5)" />
      </svg>
    ),
    title: "Real-time Preview",
    description:
      "See your animations come alive in real-time as AI processes each frame. Adjust speed and direction on the fly.",
  },
  {
    icon: (
      <svg viewBox="0 0 12 12" className="w-8 h-8 pixelated" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="8" height="8" fill="none" stroke="hsl(275 70% 55%)" strokeWidth="1" />
        <rect x="4" y="4" width="4" height="4" fill="hsl(190 100% 55%)" />
        <rect x="0" y="0" width="2" height="2" fill="hsl(45 100% 60%)" />
        <rect x="10" y="0" width="2" height="2" fill="hsl(45 100% 60%)" />
        <rect x="0" y="10" width="2" height="2" fill="hsl(45 100% 60%)" />
        <rect x="10" y="10" width="2" height="2" fill="hsl(45 100% 60%)" />
      </svg>
    ),
    title: "Animation editing",
    description:
      "Edit your AI generated sprite animation with ease to have the maximum control over your assets.",
  },
];

export function Features() {
  const [stars, setStars] = useState<{ x: number; y: number; delay: number; size: number }[]>([]);
  
  useEffect(() => {
    setStars(
      Array.from({ length: 60 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 4,
        size: Math.random() > 0.85 ? 5 : Math.random() > 0.5 ? 3 : 1,
      }))
    );
  }, []);

  return (
    <section id="features" className="relative py-24 nebula-bg-alt space-grid overflow-hidden">
      {/* Bottom Fade Gradient */}
      <div className="pointer-events-none absolute top-0 left-0 w-full h-54 bg-gradient-to-b from-[hsl(230_40%_4%)] to-transparent z-10" />
      <div className="pointer-events-none absolute bottom-0 left-0 w-full h-54 bg-gradient-to-b from-transparent to-[hsl(230_40%_4%)] z-10" />

      {/* Stars */}
      {stars.map((star, i) => (
        <PixelStar key={i} x={star.x} y={star.y} delay={star.delay} size={star.size} />
      ))}
      
      {/* Floating pixel assets */}
      <FloatingAssets section="features" />
       
      {/* Top pixelated fade border */}
      {/* <PixelatedFadeBorder direction="top" /> */}
       
      <div className="">
        <div className="relative z-10 mx-auto max-w-xl px-4 lg:px-8">
          {/* Section header */}
          <div className="mb-16 flex flex-col items-center gap-4">
            <span className="retro text-[10px] text-accent glow-gold">
              {"< FEATURES >"}
            </span>
            <h2 className="retro text-center text-lg text-foreground  md:text-xl">
              Power-Ups Included
            </h2>
            <p className="retro max-w-xl text-center text-[9px] leading-relaxed text-muted-foreground">
              Everything you need to turn static images into living, breathing game characters.
            </p>
          </div>

          {/* Feature cards grid */}
          <div className="grid gap-6 md:grid-cols-1">
            {features.map((feature) => (
              <Card key={feature.title} font="retro" className="group transition-all hover:glow-box-cyan bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-[11px] text-foreground">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-[9px] leading-relaxed text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom pixelated fade border */}
      {/* <PixelatedFadeBorder direction="bottom" /> */}
    </section>
  );
}
