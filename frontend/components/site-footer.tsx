import { LogoWordmark } from "@/components/logo";

/** Simple landing-page footer. */
export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 py-10">
      <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
        <LogoWordmark />
        <p>Built with Next.js, FastAPI, Astropy &amp; Photutils — a portfolio project.</p>
        <p>© {new Date().getFullYear()} AstroVision</p>
      </div>
    </footer>
  );
}
