"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/app/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import CreditCounter from "@/components/credit-counter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import {
  Lightbulb,
  Target,
  Palette,
  Layers,
  Pencil,
  Workflow,
  ChevronRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ArrowRightIcon,
  WorkflowIcon,
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import pose from "@/assets/guide/pose.png";
import prompt_result from "@/assets/guide/prompt_result.gif";
import prompt_input from "@/assets/guide/prompt_input.png";
import frame_editor from "@/assets/guide/frame_editor.png";
import pixel_editor from "@/assets/guide/pixel_editor.png";
import phase1 from "@/assets/guide/phase1.png";
import phase2 from "@/assets/guide/phase2.png";
import phase3 from "@/assets/guide/phase3.png";
import running from "@/assets/guide/running.png";
import idle from "@/assets/guide/idle.png";
import walking from "@/assets/guide/walking.png";
import jumping from "@/assets/guide/jumping.png";
import { Navbar } from "@/components/navbar";

export default function GuidePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMdScreen, setIsMdScreen] = useState(false);

  // Track screen size for responsive sidebar margin
  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    setIsMdScreen(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsMdScreen(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
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
      <Navbar />
      <div className="scanline-overlay absolute inset-0 z-0 pointer-events-none" />

      {/* Fixed Sidebar */}
      {/* <DashboardSidebar onCollapseChange={setSidebarCollapsed} /> */}

      {/* <CreditCounter /> */}

      {/* Main content */}
      <div
        className="relative z-10 min-h-screen transition-[margin] duration-300 ease-in-out pt-32"
      >
        <div className="mx-auto max-w-4xl px-4 py-8 lg:px-6">
          {/* Header */}
          <div className="mb-8 flex flex-col items-center gap-4">
            <Badge className="retro text-[8px] bg-cyan-900/40 text-cyan-300 border-cyan-800">
              GUIDE
            </Badge>
            <h1 className="retro text-center text-xl md:text-3xl text-cyan-400">
              How to Get Better Results
            </h1>
            <p className="retro text-center text-[10px] md:text-xs text-foreground/70 max-w-2xl">
              SpriteLoop v1 is built for creating clean 2D sprite-style
              animations from a single character image.
            </p>
          </div>

          {/* Workflow */}
          <Card className="mb-6 rounded-none border-2 border-b-4 border-r-4 border-cyan-900/80 bg-[oklch(0.13_0.03_240)]">
            <CardHeader className="pb-2">
              <CardTitle className="retro text-sm text-cyan-400 flex items-center gap-2">
                <WorkflowIcon size={14} />
                Workflow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Carousel className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl mx-auto">
                <CarouselContent>
                  {[
                    { src: phase1, alt: "Phase 1 - Upload your character" },
                    { src: phase2, alt: "Phase 2 - Generate animation" },
                    { src: phase3, alt: "Phase 3 - Export frames" },
                  ].map((phase, index) => (
                    <CarouselItem key={index}>
                      <div className="relative aspect-video w-full bg-background/20">
                        <Image
                          src={phase.src}
                          alt={phase.alt}
                          fill
                          className="object-contain p-2"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>
                      <p className="retro text-[8px] text-center text-cyan-300/70 mt-2">
                        {phase.alt}
                      </p>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-0 sm:-left-4" />
                <CarouselNext className="right-0 sm:-right-4" />
              </Carousel>
            </CardContent>
          </Card>

          {/* Supported Actions */}
          <Card className="mb-6 rounded-none border-2 border-b-4 border-r-4 border-cyan-900/80 bg-[oklch(0.13_0.03_240)]">
            <CardHeader className="pb-2">
              <CardTitle className="retro text-sm text-cyan-400 flex items-center gap-2">
                <Sparkles size={14} />
                Supported Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {["Idle", "Walking", "Running", "Jumping"].map((action) => (
                  <Badge
                    key={action}
                    className="retro text-[8px] bg-cyan-950/60 text-cyan-300 border-cyan-800"
                  >
                    {action}
                  </Badge>
                ))}
              </div>
              <p className="retro text-[9px] text-foreground/60 mt-3">
                At this stage, SpriteLoop v1 supports these 4 core actions only.
              </p>
            </CardContent>
          </Card>

          {/* Before You Start */}
          <Card className="mb-6 rounded-none border-2 border-b-4 border-r-4 border-cyan-900/80 bg-[oklch(0.13_0.03_240)]">
            <CardHeader className="pb-2">
              <CardTitle className="retro text-sm text-cyan-400 flex items-center gap-2">
                <Target size={14} />
                Before You Start
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="retro text-[9px] text-foreground/70 mb-4">
                Better results usually come from:
              </p>
              <ul className="space-y-2">
                {[
                  "A 256 x 256 image",
                  "A character with enough space around them",
                  "A starting pose close to the action",
                  "A plain white background",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 retro text-[9px] text-foreground/80"
                  >
                    <CheckCircle2
                      size={12}
                      className="text-cyan-400 mt-0.5 shrink-0"
                    />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-4 p-3 bg-cyan-950/30 border border-cyan-900/50">
                <p className="retro text-[8px] text-cyan-300/80">
                  <span className="text-cyan-400">TIP:</span> If your current
                  image does not match the action (for example, a standing pose
                  but you want running), you can use the pose correction feature
                  before generating.
                </p>
              </div>

              {/* Placeholder for pose correction image */}
              <div className="mt-4 relative aspect-video w-full max-w-md mx-auto bg-background/20 flex items-center justify-center">
                <Image
                  src={pose}
                  alt="Pose correction feature"
                  fill
                  className="object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Writing Better Prompts */}
          <Card className="mb-6 rounded-none border-2 border-b-4 border-r-4 border-cyan-900/80 bg-[oklch(0.13_0.03_240)]">
            <CardHeader className="pb-2">
              <CardTitle className="retro text-sm text-cyan-400 flex items-center gap-2">
                <Lightbulb size={14} />
                Writing Better Prompts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="retro text-[9px] text-foreground/70 mb-4">
                A strong prompt gives the model a clear idea of motion. Think of
                your prompt as a small motion sequence:
              </p>

              <div className="p-3 bg-cyan-950/30 border border-cyan-900/50 mb-4">
                <p className="retro text-[8px] text-cyan-300">
                  starting pose → movement → transition → loop
                </p>
              </div>

              {/* Bad Example */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={12} className="text-red-400" />
                  <span className="retro text-[9px] text-red-400">
                    Instead of:
                  </span>
                </div>
                <div className="p-3 bg-red-950/20 border border-red-900/30">
                  <p className="retro text-[8px] text-foreground/60">
                    {'"running"'}
                  </p>
                </div>
              </div>

              {/* Good Example */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 size={12} className="text-green-400" />
                  <span className="retro text-[9px] text-green-400">
                    Write something like:
                  </span>
                </div>
                <div className="p-3 bg-green-950/20 border border-green-900/30">
                  <p className="retro text-[8px] text-foreground/80 leading-relaxed">
                    {
                      '"The fighter runs to the right with a strong forward lean, fists clenched. His front leg extends out while the back leg pushes off the ground. On landing, he dips slightly, compressing his body and bringing his legs closer in. He quickly drives forward again into the next step, maintaining a steady, looping run cycle with controlled, combat-ready motion."'
                    }
                  </p>
                </div>
              </div>

              {/* Placeholder for prompt result image */}
              <div className="flex justify-center items-center">
                <div className="mt-4 relative aspect-video w-full max-w-md mx-auto bg-background/20 flex items-center justify-center">
                  <Image
                    src={prompt_input}
                    alt="Good prompt result example"
                    fill
                    className="object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>

                <ArrowRightIcon size={100} />

                <div className="mt-4 relative aspect-video w-full max-w-md mx-auto bg-background/20 flex items-center justify-center">
                  <Image
                    src={prompt_result}
                    alt="Good prompt result example"
                    fill
                    className="object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              </div>

              <div className="mt-4">
                <p className="retro text-[9px] text-foreground/70 mb-2">
                  This works better because it explains:
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Direction", "Pose", "Body Movement", "Flow of Motion"].map(
                    (item) => (
                      <Badge
                        key={item}
                        className="retro text-[7px] bg-green-950/40 text-green-300 border-green-800"
                      >
                        {item}
                      </Badge>
                    ),
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Why Small Prompts Fail */}
          <Card className="mb-6 rounded-none border-2 border-b-4 border-r-4 border-red-900/60 bg-[oklch(0.13_0.03_240)]">
            <CardHeader className="pb-2">
              <CardTitle className="retro text-sm text-red-400 flex items-center gap-2">
                <AlertCircle size={14} />
                Why Small Prompts Fail
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="retro text-[9px] text-foreground/70 mb-3">
                Short prompts leave too much for the model to guess:
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {['"run"', '"jump"', '"walk animation"'].map((item) => (
                  <Badge
                    key={item}
                    className="retro text-[7px] bg-red-950/40 text-red-300 border-red-800"
                  >
                    {item}
                  </Badge>
                ))}
              </div>
              <p className="retro text-[9px] text-foreground/70">
                When motion is not described, the result often feels:
              </p>
              <ul className="mt-2 space-y-1">
                {["Stiff", "Unclear", "Inconsistent"].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 retro text-[8px] text-foreground/60"
                  >
                    <ChevronRight size={10} className="text-red-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Starting Pose Matters */}
          <Card className="mb-6 rounded-none border-2 border-b-4 border-r-4 border-cyan-900/80 bg-[oklch(0.13_0.03_240)]">
            <CardHeader className="pb-2">
              <CardTitle className="retro text-sm text-cyan-400 flex items-center gap-2">
                <Palette size={14} />
                Starting Pose Matters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="retro text-[9px] text-foreground/70 mb-4">
                The starting image directly affects the result. If the pose
                already matches the action, the animation looks natural and
                clean.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    action: "Running",
                    tips: [
                      "One leg forward, one leg back",
                      "Slight forward lean",
                      "Arms positioned for movement",
                    ],
                    image: running,
                  },
                  {
                    action: "Walking",
                    tips: [
                      "One leg slightly ahead",
                      "Upright body",
                      "Natural balance",
                    ],
                    image: walking,
                  },
                  {
                    action: "Jumping",
                    tips: [
                      "Legs slightly bent",
                      "Body showing upward motion",
                      "Not fully flat on the ground",
                    ],
                    image: jumping,
                  },
                  {
                    action: "Idle",
                    tips: [
                      "Both feet grounded",
                      "Relaxed arms",
                      "Balanced stance",
                    ],
                    image: idle,
                  },
                ].map((pose) => (
                  <div
                    key={pose.action}
                    className="p-3 bg-background/20 border border-cyan-900/50"
                  >
                    <h4 className="retro text-[10px] text-cyan-300 mb-2">
                      {pose.action}
                    </h4>
                    <div className="relative aspect-square w-full max-w-[150px] mx-auto mb-3 bg-background/30 border border-cyan-900/30 flex items-center justify-center">
                      <Image
                        src={pose.image}
                        alt={`${pose.action} pose example`}
                        fill
                        className="object-contain p-2"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                    <ul className="space-y-1">
                      {pose.tips.map((tip, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-1 retro text-[7px] text-foreground/70"
                        >
                          <ChevronRight
                            size={8}
                            className="text-cyan-400 mt-0.5 shrink-0"
                          />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-cyan-950/30 border border-cyan-900/50">
                <p className="retro text-[8px] text-cyan-300/80">
                  If your input image does not match the action, use the{" "}
                  <span className="text-cyan-400">pose correction feature</span>{" "}
                  before generating.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Space Around Character */}
          <Card className="mb-6 rounded-none border-2 border-b-4 border-r-4 border-cyan-900/80 bg-[oklch(0.13_0.03_240)]">
            <CardHeader className="pb-2">
              <CardTitle className="retro text-sm text-cyan-400 flex items-center gap-2">
                <Layers size={14} />
                Space Around the Character
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="retro text-[9px] text-foreground/70 mb-3">
                Characters need space to move.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-red-950/20 border border-red-900/30">
                  <p className="retro text-[9px] text-red-400 mb-2">
                    If the image is too tight:
                  </p>
                  <ul className="space-y-1">
                    {[
                      "Motion gets compressed",
                      "Limbs cannot extend properly",
                    ].map((item, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 retro text-[7px] text-foreground/60"
                      >
                        <AlertCircle size={10} className="text-red-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-green-950/20 border border-green-900/30">
                  <p className="retro text-[9px] text-green-400 mb-2">
                    Better results come when:
                  </p>
                  <ul className="space-y-1">
                    {[
                      "Character at the center for static animations",
                      "There is space in front of movement",
                      "Character is not touching edges",
                      "Full body is visible",
                    ].map((item, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 retro text-[7px] text-foreground/60"
                      >
                        <CheckCircle2 size={10} className="text-green-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Editing and Looping */}
          <Card className="mb-6 rounded-none border-2 border-b-4 border-r-4 border-cyan-900/80 bg-[oklch(0.13_0.03_240)]">
            <CardHeader className="pb-2">
              <CardTitle className="retro text-sm text-cyan-400 flex items-center gap-2">
                <Pencil size={14} />
                Editing and Looping (Pixel Editor)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <h4 className="retro text-[10px] text-cyan-300 mb-2">
                Filtering Frames and ordering
              </h4>
              <Image
                src={frame_editor}
                alt={`Frame editor`}
                className="w-[600px] mb-4"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <p className="retro text-[9px] text-foreground/70 mb-3">
                After generation, SpriteLoop gives you all the animation frames.
                Inside the pixel editor, you can:
              </p>

              <ul className="space-y-2 mb-4">
                {[
                  "View each frame",
                  "Select which frames to keep",
                  "Remove frames that do not look good",
                  "Build your final loop",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 retro text-[8px] text-foreground/80"
                  >
                    <CheckCircle2
                      size={10}
                      className="text-cyan-400 shrink-0"
                    />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="p-3 bg-cyan-950/30 border border-cyan-900/50 mb-4">
                <p className="retro text-[8px] text-cyan-300/80">
                  <span className="text-cyan-400">TIP:</span> In many cases, a
                  better loop comes from removing the first few frames (setup
                  motion) and the last few frames (recovery), keeping the
                  strongest middle frames.
                </p>
              </div>

              <div className="mt-4">
                <h4 className="retro text-[10px] text-cyan-300 mb-2">
                  Editing each frame manually
                </h4>
                <Image
                  src={pixel_editor}
                  alt={`Pixel editor`}
                  className="w-[600px] mb-4"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <p className="retro text-[9px] text-foreground/70 mb-3">
                  You can click on any frame and edit it directly. The editor is
                  simple and designed for quick fixes:
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Fix small pixel issues",
                    "Remove noises",
                    "Adjust details",
                    "Improve consistency",
                  ].map((item) => (
                    <Badge
                      key={item}
                      className="retro text-[7px] bg-cyan-950/40 text-cyan-300 border-cyan-800"
                    >
                      {item}
                    </Badge>
                  ))}
                </div>
                <p className="retro text-[8px] text-foreground/60 mt-3">
                  The editor only uses the colors already present in the frames,
                  so everything stays visually consistent.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Best Workflow */}
          <Card className="mb-6 rounded-none border-2 border-b-4 border-r-4 border-cyan-900/80 bg-[oklch(0.13_0.03_240)]">
            <CardHeader className="pb-2">
              <CardTitle className="retro text-sm text-cyan-400 flex items-center gap-2">
                <Workflow size={14} />
                Best Workflow for SpriteLoop v1
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {[
                  "Start with a clean white background image",
                  "Use 256 x 256 size",
                  "Ensure pose matches the action (or use pose correction)",
                  "Write a clear motion-based prompt",
                  "Stay within supported actions",
                  "Generate",
                  "Pick the best frames in the editor",
                  "Trim and loop",
                  "Refine if needed",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="retro text-[10px] text-cyan-400 bg-cyan-950/60 px-2 py-1 border border-cyan-800 shrink-0">
                      {i + 1}
                    </span>
                    <span className="retro text-[9px] text-foreground/80 pt-1">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* Footer Note */}
          <div className="text-center py-6">
            <p className="retro text-[9px] text-foreground/50">
              We are actively improving the system based on feedback. Future
              versions will support more actions and much better motion quality.
            </p>
            <p className="retro text-[8px] text-cyan-400/60 mt-2">
              More features coming soon, including background remover.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
