"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { ComparisonView } from "@/features/comparison/comparison-view";

export default function ComparePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="Home" className="flex items-center gap-2">
            <Logo className="h-6 w-6" />
            <span className="hidden text-sm font-semibold sm:inline">AstroVision</span>
          </Link>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/workspace">
              <ArrowLeft className="h-4 w-4" /> Workspace
            </Link>
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <main className="container flex-1 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Comparison View</h1>
          <p className="mt-1 text-muted-foreground">
            Load two frames and drag the divider to compare them.
          </p>
        </div>
        <ComparisonView />
      </main>
    </div>
  );
}
