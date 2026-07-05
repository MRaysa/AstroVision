"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Telescope } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/** Landing hero: headline, sub-copy and primary calls-to-action. */
export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Ambient aurora glows */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl animate-aurora" />
        <div className="absolute right-1/4 top-20 h-72 w-72 translate-x-1/2 rounded-full bg-accent/20 blur-3xl animate-aurora [animation-delay:3s]" />
      </div>
      <div className="starfield absolute inset-0 -z-10 opacity-40" />

      <div className="container flex flex-col items-center py-20 text-center md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Badge variant="accent" className="mb-5 gap-1.5 px-3 py-1">
            <Sparkles className="h-3.5 w-3.5" /> FITS analysis in your browser
          </Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="max-w-4xl text-balance text-4xl font-bold tracking-tight md:text-6xl"
        >
          Inspect the universe with <span className="text-gradient">AstroVision</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="mt-5 max-w-2xl text-pretty text-lg text-muted-foreground"
        >
          A lightweight research tool for viewing, analyzing and processing astronomical FITS
          images — header metadata, statistics, histograms, filters, edge detection and star
          detection, all powered by Astropy and Photutils.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="mt-8 flex flex-col gap-3 sm:flex-row"
        >
          <Button size="lg" asChild>
            <Link href="/workspace">
              <Telescope className="h-4 w-4" /> Open the Workspace
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href="#samples">
              Try a sample <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
