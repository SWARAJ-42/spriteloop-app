"use client";

import Image, { StaticImageData } from "next/image";

// Import all small assets
import asset1 from "@/assets/small_assets/1.png";
import asset2 from "@/assets/small_assets/2.png";
import asset3 from "@/assets/small_assets/3.png";
import asset4 from "@/assets/small_assets/4.png";
import asset5 from "@/assets/small_assets/5.png";
import asset6 from "@/assets/small_assets/6.png";
import asset7 from "@/assets/small_assets/7.png";

interface AssetConfig {
  src: StaticImageData;
  top: string;
  left: string;
  opacity: number;
  rotation: number;
  animationDelay: string;
}

// Hardcoded configurations for each section variant
// Each section uses all 7 unique assets spread across the space
const SECTION_CONFIGS: Record<string, AssetConfig[]> = {
  features: [
    { src: asset1, top: "5%", left: "10%", opacity: 0.5, rotation: 15, animationDelay: "0s" },
    { src: asset2, top: "48%", left: "65%", opacity: 0.45, rotation: 25, animationDelay: "0.8s" },
    { src: asset3, top: "5%", left: "72%", opacity: 0.4, rotation: 0, animationDelay: "1.5s" },
    { src: asset4, top: "65%", left: "2%", opacity: 0.5, rotation: -10, animationDelay: "2.2s" },
    { src: asset5, top: "70%", left: "86%", opacity: 0.45, rotation: 30, animationDelay: "0.5s" },
    // { src: asset6, top: "35%", left: "15%", opacity: 0.4, rotation: -35, animationDelay: "1.8s" },
    // { src: asset7, top: "60%", left: "75%", opacity: 0.5, rotation: 20, animationDelay: "2.8s" },
  ],
  howItWorks: [
    { src: asset1, top: "3%", left: "70%", opacity: 0.5, rotation: 30, animationDelay: "0.3s" },
    { src: asset2, top: "15%", left: "2%", opacity: 0.45, rotation: -18, animationDelay: "1.2s" },
    { src: asset3, top: "40%", left: "80%", opacity: 0.4, rotation: 12, animationDelay: "2s" },
    { src: asset4, top: "40%", left: "4%", opacity: 0.5, rotation: -40, animationDelay: "0.7s" },
    { src: asset5, top: "68%", left: "85%", opacity: 0.45, rotation: 25, animationDelay: "1.6s" },
    { src: asset6, top: "70%", left: "15%", opacity: 0.4, rotation: -15, animationDelay: "2.5s" },
    // { src: asset7, top: "92%", left: "80%", opacity: 0.5, rotation: 35, animationDelay: "0s" },
  ],
  hero: [
    { src: asset1, top: "5%", left: "5%", opacity: 0.45, rotation: 20, animationDelay: "0s" },
    { src: asset2, top: "10%", left: "90%", opacity: 0.5, rotation: -30, animationDelay: "1s" },
    { src: asset3, top: "30%", left: "2%", opacity: 0.4, rotation: 15, animationDelay: "1.8s" },
    { src: asset4, top: "45%", left: "92%", opacity: 0.5, rotation: -22, animationDelay: "0.5s" },
    { src: asset5, top: "65%", left: "4%", opacity: 0.45, rotation: 38, animationDelay: "2.2s" },
    { src: asset6, top: "75%", left: "88%", opacity: 0.4, rotation: -12, animationDelay: "1.3s" },
    { src: asset7, top: "88%", left: "8%", opacity: 0.5, rotation: 28, animationDelay: "2.8s" },
  ],
  pricing: [
    { src: asset1, top: "6%", left: "90%", opacity: 0.5, rotation: -18, animationDelay: "0.4s" },
    { src: asset2, top: "12%", left: "3%", opacity: 0.45, rotation: 28, animationDelay: "1.5s" },
    { src: asset3, top: "38%", left: "88%", opacity: 0.4, rotation: -8, animationDelay: "2.2s" },
    { src: asset4, top: "52%", left: "5%", opacity: 0.55, rotation: 40, animationDelay: "0.8s" },
    { src: asset5, top: "65%", left: "92%", opacity: 0.45, rotation: -32, animationDelay: "1.8s" },
    { src: asset6, top: "78%", left: "2%", opacity: 0.4, rotation: 18, animationDelay: "0s" },
    { src: asset7, top: "88%", left: "85%", opacity: 0.5, rotation: -25, animationDelay: "2.5s" },
  ],
};

export function FloatingAssets({ 
  section = "features",
  className = ""
}: { 
  section?: "features" | "howItWorks" | "hero" | "pricing";
  className?: string;
}) {
  const assets = SECTION_CONFIGS[section] || SECTION_CONFIGS.features;

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {assets.map((asset, index) => (
        <div
          key={index}
          className="absolute animate-float"
          style={{
            top: asset.top,
            left: asset.left,
            opacity: asset.opacity,
            transform: `rotate(${asset.rotation}deg)`,
            animationDelay: asset.animationDelay,
          }}
        >
          <Image
            src={asset.src}
            alt=""
            width={300}
            height={300}
            className="pixelated"
            style={{ imageRendering: "pixelated" }}
          />
        </div>
      ))}
    </div>
  );
}
