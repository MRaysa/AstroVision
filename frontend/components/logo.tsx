import { cn } from "@/utils/cn";

/** AstroVision brand mark: a stylised orbit + star. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={cn("h-7 w-7", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="av-grad" x1="0" y1="0" x2="32" y2="32">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--accent))" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="4.5" fill="url(#av-grad)" />
      <ellipse
        cx="16"
        cy="16"
        rx="13"
        ry="6"
        stroke="url(#av-grad)"
        strokeWidth="1.6"
        transform="rotate(-30 16 16)"
      />
      <circle cx="27" cy="9" r="1.6" fill="hsl(var(--accent))" />
    </svg>
  );
}

export function LogoWordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Logo />
      <span className="text-lg font-semibold tracking-tight">
        Astro<span className="text-gradient">Vision</span>
      </span>
    </div>
  );
}
