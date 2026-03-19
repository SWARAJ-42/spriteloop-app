"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/8bit/card";
import { FloatingAssets } from "@/components/floating-assets";
import { PixelStar } from "./hero";

const steps = [
  {
    number: "01",
    title: "Upload 2D Art",
    description:
      "Upload your 2D character art, sketch, or illustration. Our system accepts any 2D artwork as your starting point.",
    detail: "Supports PNG, JPG, WebP. Max 10MB.",
  },
  {
    number: "02",
    title: "Pose Correction",
    description:
      "Our pose correction model analyzes and optimizes the character's pose for better animation generation.",
    detail: "Ensures clean skeleton alignment.",
  },
  {
    number: "03",
    title: "Diffusion Generation",
    description:
      "The image is processed through our custom-trained diffusion model to generate smooth animation sequences.",
    detail: "Powered by advanced diffusion architecture.",
  },
  {
    number: "04",
    title: "Export & Customize",
    description:
      "Download your animation in any format. Adjust FPS, trim frames, and export as sprite sheets or video. Plug and play frames ready to use.",
    detail: "Frame-by-frame editing available.",
  },
];

function TimelineStep({
  step,
  index,
  isVisible,
}: {
  step: (typeof steps)[0];
  index: number;
  isVisible: boolean;
}) {
  return (
    <div className="relative w-full flex justify-center items-center mb-16 md:mb-20">
      {/* Left side - Card (even indices) */}
      {index % 2 === 0 && (
        <>
          {/* Desktop layout */}
          <div className="hidden md:flex w-5/12 pr-8 justify-end relative">
            {/* Connecting line */}
            <div
              className={`absolute right-0 top-1/2 h-0.5 transition-all duration-700 ${
                isVisible ? "w-8" : "w-0"
              }`}
              style={{
                backgroundColor: isVisible
                  ? "hsl(190 100% 55%)"
                  : "transparent",
                boxShadow: isVisible ? "0 0 8px hsl(190 100% 55%)" : "none",
              }}
            />
            <div
              className={`w-full max-w-xs transition-all duration-700 ${
                isVisible
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-4"
              }`}
            >
              <Card
                font="retro"
                className={`border-border bg-card ${isVisible ? "glow-box-cyan" : ""}`}
              >
                <CardHeader>
                  <CardTitle className="text-[11px] text-foreground">
                    {step.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <CardDescription className="text-[9px] leading-relaxed text-muted-foreground">
                    {step.description}
                  </CardDescription>
                  <span className="retro text-[8px] text-secondary/70 block">
                    {"// "}
                    {step.detail}
                  </span>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Center dot */}
          <div className="w-fit flex justify-center items-center mb-4 md:mb-0">
            <div
              className={`relative z-10 flex h-12 w-12 items-center justify-center border-4 bg-background transition-all duration-700 ${
                isVisible
                  ? "border-accent  scale-100"
                  : "border-border/30 scale-50"
              }`}
              style={{
                borderRadius: "4px",
              }}
            >
              <span className="retro text-xs text-accent glow-gold">
                {step.number}
              </span>
            </div>
          </div>

          {/* Mobile layout */}
          <div className="md:hidden w-full flex justify-start pl-4">
            <div
              className={`w-full max-w-xs transition-all duration-700 ${
                isVisible
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-4"
              }`}
            >
              <Card
                font="retro"
                className={`border-border bg-card ${isVisible ? "glow-box-cyan" : ""}`}
              >
                <CardHeader>
                  <CardTitle className="text-[11px] text-foreground">
                    {step.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <CardDescription className="text-[9px] leading-relaxed text-muted-foreground">
                    {step.description}
                  </CardDescription>
                  <span className="retro text-[8px] text-secondary/70 block">
                    {"// "}
                    {step.detail}
                  </span>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right side empty - desktop only */}
          <div className="hidden md:flex w-5/12" />
        </>
      )}

      {/* Right side - Card (odd indices) */}
      {index % 2 === 1 && (
        <>
          {/* Left side empty - desktop only */}
          <div className="hidden md:flex w-5/12" />

          {/* Center dot */}
          <div className="w-fit flex justify-center mb-4 md:mb-0">
            <div
              className={`relative z-10 flex h-12 w-12 items-center justify-center border-4 bg-background transition-all duration-700 ${
                isVisible
                  ? "border-accent  scale-100"
                  : "border-border/30 scale-50"
              }`}
              style={{
                borderRadius: "4px",
              }}
            >
              <span className="retro text-xs text-accent glow-gold">
                {step.number}
              </span>
            </div>
          </div>

          {/* Desktop layout */}
          <div className="hidden md:flex w-5/12 pl-8 justify-start relative">
            {/* Connecting line */}
            <div
              className={`absolute left-0 top-1/2 h-0.5 transition-all duration-700 ${
                isVisible ? "w-8" : "w-0"
              }`}
              style={{
                backgroundColor: isVisible
                  ? "hsl(190 100% 55%)"
                  : "transparent",
                boxShadow: isVisible ? "0 0 8px hsl(190 100% 55%)" : "none",
              }}
            />
            <div
              className={`w-full max-w-xs transition-all duration-700 ${
                isVisible
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 translate-x-4"
              }`}
            >
              <Card
                font="retro"
                className={`border-border bg-card ${isVisible ? "glow-box-cyan" : ""}`}
              >
                <CardHeader>
                  <CardTitle className="text-[11px] text-foreground">
                    {step.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <CardDescription className="text-[9px] leading-relaxed text-muted-foreground">
                    {step.description}
                  </CardDescription>
                  <span className="retro text-[8px] text-secondary/70 block">
                    {"// "}
                    {step.detail}
                  </span>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Mobile layout */}
          <div className="md:hidden w-full flex justify-start pl-4">
            <div
              className={`w-full max-w-xs transition-all duration-700 ${
                isVisible
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 translate-x-4"
              }`}
            >
              <Card
                font="retro"
                className={`border-border bg-card ${isVisible ? "glow-box-cyan" : ""}`}
              >
                <CardHeader>
                  <CardTitle className="text-[11px] text-foreground">
                    {step.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <CardDescription className="text-[9px] leading-relaxed text-muted-foreground">
                    {step.description}
                  </CardDescription>
                  <span className="retro text-[8px] text-secondary/70 block">
                    {"// "}
                    {step.detail}
                  </span>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function HowItWorks() {
  const [visibleSteps, setVisibleSteps] = useState<boolean[]>([
    false,
    false,
    false,
    false,
  ]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(
              entry.target.getAttribute("data-index") || "0",
            );
            setVisibleSteps((prev) => {
              const newVisible = [...prev];
              newVisible[index] = true;
              return newVisible;
            });
          }
        });
      },
      { threshold: 0.3, rootMargin: "0px 0px -100px 0px" },
    );

    const stepElements = containerRef.current?.querySelectorAll("[data-step]");
    stepElements?.forEach((el) => observer.observe(el));

    return () => {
      stepElements?.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const [stars, setStars] = useState<
    { x: number; y: number; delay: number; size: number }[]
  >([]);

  useEffect(() => {
    setStars(
      Array.from({ length: 100 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 4,
        size: Math.random() > 0.85 ? 5 : Math.random() > 0.5 ? 3 : 1,
      })),
    );
  }, []);

  return (
    <section id="how-it-works" className="relative py-24 nebula-bg">
      <div className="pointer-events-none absolute top-0 left-0 w-full h-54 bg-gradient-to-b from-[hsl(230_40%_4%)] to-transparent z-10" />
      <div className="pointer-events-none absolute bottom-0 left-0 w-full h-54 bg-gradient-to-b from-transparent to-[hsl(230_40%_4%)] z-10" />
      {/* Stars */}
      {stars.map((star, i) => (
        <PixelStar
          key={i}
          x={star.x}
          y={star.y}
          delay={star.delay}
          size={star.size}
        />
      ))}
      <div className="scanline-overlay absolute inset-0 z-0" />
      {/* Floating pixel assets */}
      <FloatingAssets section="howItWorks" />
      <div className="relative z-10 mx-auto w-full px-4 lg:px-8">
        {/* Section header */}
        <div className="mb-20 flex flex-col items-center gap-4">
          <span className="retro text-[10px] text-secondary glow-purple">
            {"< HOW IT WORKS >"}
          </span>
          <h2 className="retro text-center text-lg text-foreground  md:text-xl">
            The Process Tree
          </h2>
          <p className="retro max-w-xl text-center text-[9px] leading-relaxed text-muted-foreground">
            Scroll through each stage of the animation journey.
          </p>
        </div>

        {/* Timeline container */}
        <div ref={containerRef} className="relative mx-auto max-w-5xl">
          {/* Vertical timeline line - only between steps 1 and 4 */}
          <div className="absolute left-1/2 top-24 bottom-24 w-1 bg-linear-to-b from-accent/20 via-accent/40 to-accent/20 hidden md:block" />

          {/* Steps */}
          {steps.map((step, index) => (
            <div key={step.number} data-step data-index={index}>
              <TimelineStep
                step={step}
                index={index}
                isVisible={visibleSteps[index]}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
