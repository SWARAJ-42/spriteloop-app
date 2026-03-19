"use client";

import React from "react"
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/8bit/button";
import { Badge } from "@/components/ui/8bit/badge";
import { Card } from "./ui/8bit/card";
import Image from "next/image";
import hero from "@/assets/hero.png"

function DummyCharacter({ className }: { className?: string }) {
  return (
    <div className={className}>
      <svg viewBox="0 0 32 48" className="w-full h-full pixelated" xmlns="http://www.w3.org/2000/svg">
        {/* Head */}
        <rect x="8" y="4" width="16" height="12" fill="hsl(35 100% 80%)" />
        <rect x="10" y="6" width="4" height="4" fill="hsl(190 100% 55%)" />
        <rect x="18" y="6" width="4" height="4" fill="hsl(190 100% 55%)" />
        <rect x="14" y="13" width="4" height="2" fill="hsl(0 0% 30%)" />
        
        {/* Body */}
        <rect x="8" y="16" width="16" height="14" fill="hsl(275 70% 55%)" />
        <rect x="10" y="18" width="12" height="10" fill="hsl(275 50% 40%)" />
        
        {/* Arms */}
        <rect x="4" y="18" width="4" height="10" fill="hsl(35 100% 80%)" />
        <rect x="24" y="18" width="4" height="10" fill="hsl(35 100% 80%)" />
        
        {/* Legs */}
        <rect x="10" y="30" width="4" height="14" fill="hsl(210 30% 40%)" />
        <rect x="18" y="30" width="4" height="14" fill="hsl(210 30% 40%)" />
      </svg>
    </div>
  );
}

function ArrowIcon({ direction }: { direction: "up" | "down" | "left" | "right" }) {
  const rotations = {
    up: "rotate(0deg)",
    right: "rotate(90deg)",
    down: "rotate(180deg)",
    left: "rotate(270deg)",
  };

  return (
    <svg
      viewBox="0 0 24 24"
      className="w-6 h-6"
      style={{ transform: rotations[direction] }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <polygon points="12,4 20,16 4,16" fill="currentColor" />
    </svg>
  );
}

function KeyboardButton({
  label,
  direction,
}: {
  label: string;
  direction?: "up" | "down" | "left" | "right";
}) {
  const isArrow = direction !== undefined;
  const size = isArrow ? "48px" : "60px";

  return (
    <Button
      className="text-[11px] whitespace-nowrap bg-blue-700/10 text-foreground hover:text-foreground hover: hover:bg-blue-700/20"
      style={{
        width: size,
        height: size,
        fontSize: isArrow ? "20px" : "9px",
      }}
    >
      {isArrow ? <ArrowIcon direction={direction!} /> : label}
    </Button>
  );
}

export function PixelStar({ x, y, delay, size }: { x: number; y: number; delay: number; size: number }) {
  return (
    <div
      className="absolute animate-twinkle"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${size}px`,
        height: `${size}px`,
        animationDelay: `${delay}s`,
        backgroundColor: size > 2 ? "hsl(190 100% 80%)" : "hsl(200 50% 85%)",
      }}
    />
  );
}

export function Hero() {
  const [typedText, setTypedText] = useState("");
  const fullText = "Transform 2D Characters Into Game Sprite Animation";

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i <= fullText.length) {
        setTypedText(fullText.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 60);
    return () => clearInterval(interval);
  }, []);

  const [stars, setStars] = useState<{ x: number; y: number; delay: number; size: number }[]>([]);

  useEffect(() => {
    setStars(
      Array.from({ length: 60 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 4,
        size: Math.random() > 0.85 ? 3 : Math.random() > 0.5 ? 2 : 1,
      }))
    );
  }, []);

  return (
    <section className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center px-4 lg:px-8 py-48 md:py-48">
      {/* Bottom Fade Gradient */}
      <div className="pointer-events-none absolute bottom-0 left-0 w-full h-54 bg-gradient-to-b from-transparent to-[hsl(230_40%_4%)] z-10" />
      <Image className="-z-10 absolute h-screen w-screen opacity-50" src={hero} alt="hero"/>
      {/* Scanline overlay */}
      <div className="scanline-overlay absolute inset-0 z-10" />

      {/* Stars */}
      {/* {stars.map((star, i) => (
        <PixelStar key={i} x={star.x} y={star.y} delay={star.delay} size={star.size} />
      ))} */}

      <div className="relative z-20 flex flex-col items-center justify-center w-full max-w-5xl px-4 md:px-0">
        {/* Badge */}
        <Badge font="retro" className="mb-8">
          <span className="text-[8px]">AI-Powered Sprite generation Engine v1.0</span>
        </Badge>

        {/* Main heading with typed effect */}
        <h1 className="retro mb-6 text-center text-lg leading-relaxed text-foreground  md:text-2xl lg:text-3xl">
          {typedText}
          <span className="animate-blink text-foreground">_</span>
        </h1>

        {/* Subheading */}
        <p className="retro mb-20 max-w-2xl text-center text-[10px] leading-relaxed text-foreground md:text-xs">
          Upload any 2D character image. Our AI engine transforms it into fully animated game sprites with walk cycles, attacks, idles, and more.
        </p>

        {/* CTA Buttons */}
        {/* <div className="flex flex-col items-center gap-4 sm:flex-row mt-16">
          <Button font="retro" className="text-[11px] px-8 py-3" size="lg">
            Launch Mission
          </Button>
          <Button font="retro" variant="outline" className="text-[11px] whitespace-nowrap bg-blue-700/10 text-foreground hover:text-foreground hover: hover:bg-blue-700/20 w-full" size="lg">
            View Demo
          </Button>
        </div> */}
      </div>
    </section>
  );
}
