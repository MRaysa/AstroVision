"use client";

import { Github, Telescope } from "lucide-react";
import Link from "next/link";

import { LogoWordmark } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

/** Top navigation for the landing page. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" aria-label="AstroVision home">
          <LogoWordmark />
        </Link>
        <nav className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
            <a href="#features">Features</a>
          </Button>
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
            <a href="#samples">Samples</a>
          </Button>
          <Button variant="ghost" size="icon" asChild aria-label="Source code">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">
              <Github className="h-4 w-4" />
            </a>
          </Button>
          <ThemeToggle />
          <Button size="sm" asChild className="ml-1">
            <Link href="/workspace">
              <Telescope className="h-4 w-4" /> Workspace
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
