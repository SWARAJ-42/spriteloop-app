import logo from "@/assets/logo.png";
import Image from "next/image";

export function Footer() {
  const footerLinks = {
    // Product: ["Features", "Pricing", "API Docs", "Changelog", "Roadmap"],
    // Resources: ["Tutorials", "Blog", "Community", "Discord", "GitHub"],
    // Company: ["About", "Careers", "Press Kit", "Contact", "Legal"],
    // Support: ["Help Center", "Status", "Bug Report", "Feature Request"],
  };

  return (
    <footer className="border-t-2 border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="flex">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-1 mb-4">
              <Image
                src={logo}
                alt="logo"
                className="w-[60px]"
              />
              <span className="retro text-[9px] text-foreground ">
                SpriteLoop
              </span>
            </div>
            <p className="retro text-[8px] leading-relaxed text-muted-foreground">
              AI-powered 2D Character images to game animation. Made for indie
              devs and studios.
            </p>

            {/* Social links */}
            <div className="mt-4 flex gap-3">
              {["X", "GH", "DC"].map((social) => (
                <div
                  key={social}
                  className="flex h-7 w-7 items-center justify-center border border-border bg-background transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <span className="retro text-[7px]">{social}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {/* {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="retro mb-4 text-[9px] text-foreground">
                {category}
              </h4>
              <ul className="flex flex-col gap-2">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="retro text-[8px] text-muted-foreground transition-colors hover:text-foreground hover:"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))} */}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-border/30 pt-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <span className="retro text-[7px] text-muted-foreground">
              2026 SpriteLoop.ai, All rights reserved.
            </span>
            <div className="flex gap-4">
              <a
                href="#"
                className="retro text-[7px] text-muted-foreground hover:text-foreground"
              >
                Privacy
              </a>
              <a
                href="#"
                className="retro text-[7px] text-muted-foreground hover:text-foreground"
              >
                Terms
              </a>
              <a
                href="#"
                className="retro text-[7px] text-muted-foreground hover:text-foreground"
              >
                Cookies
              </a>
            </div>
          </div>

          {/* Easter egg */}
          {/* <div className="mt-6 flex justify-center">
            <span className="retro text-[6px] text-muted-foreground/30">
              {"// TRANSMITTING FROM SECTOR 7G"}
            </span>
          </div> */}
        </div>
      </div>
    </footer>
  );
}
