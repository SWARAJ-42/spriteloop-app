"use client";

import { Button } from "@/components/ui/8bit/button";
import { Badge } from "@/components/ui/8bit/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/8bit/card";
import { createCheckout } from "@/lib/api-payment";

const plans = [
  {
    name: "Hitchhiker",
    // subtitle: "Sector 1",
    price: "Free",
    period: "",
    features: [
      "500 SpriteLoop Tokens",
      "All animations supported",
      "Pose Correction not available",
    ],
    cta: "Start Free",
    dodoProductId: null,
    highlight: false,
  },
  {
    name: "Explorer",
    // subtitle: "Sector 1",
    price: "$5",
    period: " one-time",
    features: [
      "2000 SpriteLoop Tokens",
      "All animations supported",
      "Pose Correction available",
    ],
    cta: "Go Explorer",
    dodoProductId: "pdt_0NbN3OJcBin2HUVp3zW1j",
    highlight: false,
  },
  {
    name: "Commander",
    // subtitle: "Sector 50",
    price: "$10",
    period: " one-time",
    features: [
      "5000 SpriteLoop Tokens",
      "All animations supported",
      "Pose Correction available",
      "Priority processing",
    ],
    cta: "Go Commander",
    dodoProductId: "pdt_0NbN3NbuJMwbLLk2dqfQn",
    highlight: false,
  },
];

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 8 8"
      className="h-3 w-3 shrink-0 pixelated"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="6" y="1" width="1" height="1" fill="hsl(190 100% 55%)" />
      <rect x="5" y="2" width="1" height="1" fill="hsl(190 100% 55%)" />
      <rect x="4" y="3" width="1" height="1" fill="hsl(190 100% 55%)" />
      <rect x="3" y="4" width="1" height="1" fill="hsl(190 100% 55%)" />
      <rect x="2" y="3" width="1" height="1" fill="hsl(190 100% 55%)" />
      <rect x="1" y="2" width="1" height="1" fill="hsl(190 100% 55%)" />
    </svg>
  );
}

export function Pricing() {
  async function handleCheckout(plan) {
    try {
      if (!plan.dodoProductId) {
        await fetch("/api/activate-free", { method: "POST" });
        return;
      }

      const data = await createCheckout(plan.dodoProductId);

      // 🔥 redirect to Dodo checkout
      window.location.href = data.checkout_url;
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Failed to start checkout");
    }
  }

  return (
    <section id="pricing" className="relative py-24 nebula-bg">
      <div className="pointer-events-none absolute top-0 left-0 w-full h-54 bg-gradient-to-b from-[hsl(230_40%_4%)] to-transparent z-10" />
      <div className="pointer-events-none absolute bottom-0 left-0 w-full h-54 bg-gradient-to-b from-transparent to-[hsl(230_40%_4%)] z-10" />
      <div className="scanline-overlay absolute inset-0 z-0" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 lg:px-8">
        {/* Section header */}
        <div className="mb-16 flex flex-col items-center gap-4">
          <span className="retro text-[10px] text-accent glow-gold">
            {"< PRICE TIERS >"}
          </span>
          <h2 className="retro text-center text-lg text-foreground  md:text-xl">
            Choose Your Rank
          </h2>
          <p className="retro max-w-xl text-center text-[9px] leading-relaxed text-muted-foreground">
            Start free. Level up when you are ready for the deep cosmos.
          </p>
          <p className="retro max-w-xl text-center text-[9px] leading-relaxed text-muted-foreground">
            We are comming up with a subscription plan soon.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              font="retro"
              className={`relative flex flex-col justify-between bg-card ${
                plan.highlight
                  ? "border-primary glow-box-cyan"
                  : "border-border"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                  <Badge font="retro" variant="default">
                    <span className="text-[7px]">RECOMMENDED</span>
                  </Badge>
                </div>
              )}

              <CardHeader className="items-center text-center">
                {/*<span className="retro text-[8px] text-muted-foreground">
                  {plan.subtitle}
                </span>*/}
                <CardTitle className="text-sm text-foreground">
                  {plan.name}
                </CardTitle>
                <div className="flex items-baseline gap-1">
                  <span className="retro text-xl text-accent glow-gold">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="retro text-[8px] text-muted-foreground">
                      {plan.period}
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex flex-col gap-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2">
                      <CheckIcon />
                      <span className="retro text-[8px] text-muted-foreground">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  font="retro"
                  className="text-[11px] whitespace-nowrap bg-blue-700/10 text-foreground hover:text-foreground hover: hover:bg-blue-700/20"
                  variant="default"
                  onClick={() => handleCheckout(plan)}
                >
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
