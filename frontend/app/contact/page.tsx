"use client";

import { Button } from "@/components/ui/8bit/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/8bit/card";
import { Mail, MessageSquare, ArrowLeft, HelpCircle, Bug, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const EMAIL = "biswalswaraj88@gmail.com";

export default function ContactPage() {
  const router = useRouter();

  const handleEmailClick = () => {
    window.location.href = `mailto:${EMAIL}`;
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(EMAIL);
  };

  return (
    <main className="relative min-h-screen nebula-bg flex flex-col items-center justify-center p-4">

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Back button */}
        <Button
          onClick={() => router.back()}
          className={cn(
            "mb-6 retro text-[10px]",
            "bg-cyan-900/30 hover:bg-cyan-800/50",
            "text-cyan-400 border-cyan-900",
            "border-2 border-b-4 border-r-4",
            "active:translate-x-px active:translate-y-px active:border-b-2 active:border-r-2",
            "transition-all duration-150"
          )}
        >
          <ArrowLeft size={12} />
          <span>Back</span>
        </Button>

        {/* Header section */}
        <div className="flex flex-col items-center mb-8">
          <h1 className="retro text-2xl text-cyan-300 text-center tracking-wider">
            CONTACT US
          </h1>
          <p className="retro text-[10px] text-cyan-400/60 mt-2 text-center">
            We are here to help
          </p>
        </div>

        {/* Contact Card */}
        <Card 
          font="retro"
          className={cn(
            "bg-[oklch(0.13_0.03_240)] text-foreground"
          )}
        >
          <CardHeader className="text-center pb-2">
            <CardTitle className="retro text-sm text-cyan-200">
              Get In Touch
            </CardTitle>
            <CardDescription className="retro text-[9px] text-cyan-400/60">
              Have questions, issues, or feedback? Drop us an email!
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Email display box */}
            <div className="bg-cyan-950/40 border-2 border-cyan-900/60 p-4 text-center">
              <Mail className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
              <p className="retro text-[11px] text-cyan-300 break-all">
                {EMAIL}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleEmailClick}
                className={cn(
                  "flex-1 retro text-[10px]",
                  "bg-cyan-900/40 hover:bg-cyan-800/60",
                  "text-cyan-300 border-cyan-900",
                  "border-2 border-b-4 border-r-4",
                  "active:translate-x-px active:translate-y-px active:border-b-2 active:border-r-2",
                  "transition-all duration-150",
                  "h-11 gap-2"
                )}
              >
                <Mail size={14} />
                <span>Send Email</span>
              </Button>

              <Button
                onClick={handleCopyEmail}
                className={cn(
                  "flex-1 retro text-[10px]",
                  "bg-cyan-950/50 hover:bg-cyan-900/50",
                  "text-cyan-400 border-cyan-900/70",
                  "border-2 border-b-4 border-r-4",
                  "active:translate-x-px active:translate-y-px active:border-b-2 active:border-r-2",
                  "transition-all duration-150",
                  "h-11 gap-2"
                )}
              >
                <span>Copy Email</span>
              </Button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 h-px bg-cyan-900/50" />
              <span className="retro text-[8px] text-cyan-400/40">REACH OUT FOR</span>
              <div className="flex-1 h-px bg-cyan-900/50" />
            </div>

            {/* Contact reasons */}
            <div className="space-y-3">
              {[
                { icon: HelpCircle, text: "General questions about SpriteLoop" },
                { icon: Bug, text: "Bug reports and technical issues" },
                { icon: Lightbulb, text: "Feature requests and suggestions" },
                { icon: MessageSquare, text: "Feedback and improvements" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-cyan-950/20 p-2 border border-cyan-900/30">
                  <item.icon size={14} className="text-cyan-500/70 shrink-0" />
                  <span className="retro text-[9px] text-cyan-300/80">{item.text}</span>
                </div>
              ))}
            </div>

            {/* Response time notice */}
            <div className="bg-cyan-900/20 border border-cyan-800/40 p-3 mt-4">
              <p className="retro text-[8px] text-cyan-400/70 text-center">
                We typically respond within 24-48 hours. Thank you for your patience!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="retro text-[8px] text-cyan-400/40 text-center mt-6">
          Your feedback helps us improve SpriteLoop
        </p>
      </div>
    </main>
  );
}