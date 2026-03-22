"use client";

import { Button } from "@/components/ui/8bit/button";

function PixelRocket({ className, delay }: { className?: string; delay?: string }) {
  return (
    <svg viewBox="0 0 16 20" className={className} style={{ animationDelay: delay }} xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="0" width="4" height="2" fill="hsl(0 0% 90%)" />
      <rect x="5" y="2" width="6" height="4" fill="hsl(190 100% 55%)" />
      <rect x="7" y="3" width="2" height="2" fill="hsl(45 100% 60%)" />
      <rect x="3" y="5" width="2" height="3" fill="hsl(275 70% 55%)" />
      <rect x="11" y="5" width="2" height="3" fill="hsl(275 70% 55%)" />
      <rect x="5" y="6" width="6" height="3" fill="hsl(210 30% 55%)" />
      <rect x="6" y="9" width="4" height="2" fill="hsl(190 80% 45%)" />
      <rect x="7" y="11" width="2" height="3" fill="hsl(45 100% 60%)" />
      <rect x="6" y="12" width="1" height="2" fill="hsl(20 100% 55%)" />
      <rect x="9" y="12" width="1" height="2" fill="hsl(20 100% 55%)" />
    </svg>
  );
}

function PixelDiscord() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.317 4.3671a19.8 19.8 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.444.864-.607 1.25a18.27 18.27 0 0 0-5.487 0c-.163-.386-.395-.875-.607-1.25a.077.077 0 0 0-.079-.037A19.89 19.89 0 0 0 3.677 4.367a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.93 19.93 0 0 0 5.993 3.03.08.08 0 0 0 .087-.027c.461-.63.873-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.294.075.075 0 0 1 .078-.01c3.927 1.793 8.18 1.793 12.062 0a.075.075 0 0 1 .079.009c.12.098.246.198.373.295a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.076.076 0 0 0-.041.107c.36.698.77 1.363 1.225 1.993a.076.076 0 0 0 .084.028 19.86 19.86 0 0 0 6.002-3.03.077.077 0 0 0 .032-.057c.5-4.761-.838-8.9-3.549-12.571a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-.965-2.157-2.156 0-1.193.974-2.157 2.157-2.157 1.193 0 2.156.964 2.157 2.157 0 1.19-.964 2.156-2.157 2.156zm7.975 0c-1.183 0-2.157-.965-2.157-2.156 0-1.193.974-2.157 2.157-2.157 1.193 0 2.157.964 2.157 2.157 0 1.19-.964 2.156-2.157 2.156z" />
    </svg>
  );
}

export function CtaSection() {
  const discordInviteUrl = "https://discord.gg/your-discord-invite"; // Replace with your actual Discord invite link

  return (
    <section className="relative py-24 space-grid nebula-bg-alt">
      <div className="pointer-events-none absolute top-0 left-0 w-full h-54 bg-gradient-to-b from-[hsl(230_40%_4%)] to-transparent z-10" />
      <div className="scanline-overlay absolute inset-0 z-0" />
      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center lg:px-8">
        {/* Constellation decoration */}
        <div className="mb-8 flex justify-center gap-3">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="h-2 w-2"
              style={{
                opacity: i === 4 ? 1 : 0.2 + (4 - Math.abs(i - 4)) * 0.15,
                animation: "pixel-float 2s ease-in-out infinite",
                animationDelay: `${i * 0.12}s`,
                backgroundColor: i % 3 === 0 ? "hsl(190 100% 55%)" : i % 3 === 1 ? "hsl(275 70% 55%)" : "hsl(45 100% 60%)",
              }}
            />
          ))}
        </div>

        <h2 className="retro mb-6 text-lg text-foreground  md:text-2xl">
          Join Our Community
        </h2>

        <p className="retro mb-10 text-[10px] leading-relaxed text-muted-foreground md:text-xs">
          Connect with game developers, share your creations, and get instant support for your sprite animations.
        </p>

        {/* Discord Invite Button */}
        <div className="mx-auto mb-8 max-w-lg">
          <a
            href={discordInviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block"
          >
            <Button 
              font="retro" 
              variant="default"
              className="text-[8px] sm:text-[11px] whitespace-nowrap bg-blue-700/10 text-foreground hover:text-foreground hover: hover:bg-blue-700/20"
              size="lg"
            >
              <PixelDiscord />
              JOIN DISCORD SERVER
            </Button>
          </a>
        </div>

        <p className="retro text-[7px] text-muted-foreground/50">
          Get real-time updates, share animations, and connect with the community.
        </p>

        {/* Rockets */}
        {/* <div className="mt-12 flex justify-center gap-16">
          <PixelRocket className="h-14 w-10 pixelated animate-pixel-float" delay="0s" />
          <PixelRocket className="h-14 w-10 pixelated animate-pixel-float" delay="0.5s" />
          <PixelRocket className="h-14 w-10 pixelated animate-pixel-float" delay="1s" />
        </div> */}
      </div>
    </section>
  );
}
