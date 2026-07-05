"use client";

import { FileImage, Home, SplitSquareHorizontal } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExportMenu } from "@/features/export/export-menu";
import { useAstroStore } from "@/hooks/use-astro-store";

/** Top navigation bar for the analysis workspace. */
export function WorkspaceHeader() {
  const image = useAstroStore((s) => s.image);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-3">
        <Link href="/" aria-label="Home" className="flex items-center gap-2">
          <Logo className="h-6 w-6" />
          <span className="hidden text-sm font-semibold sm:inline">AstroVision</span>
        </Link>
        {image && (
          <Badge variant="secondary" className="max-w-[40vw] gap-1.5 truncate">
            <FileImage className="h-3 w-3 shrink-0" />
            <span className="truncate font-mono">{image.filename}</span>
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
          <Link href="/compare">
            <SplitSquareHorizontal className="h-4 w-4" /> Compare
          </Link>
        </Button>
        {image && <ExportMenu />}
        <Button variant="ghost" size="icon" asChild aria-label="Home">
          <Link href="/">
            <Home className="h-4 w-4" />
          </Link>
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
