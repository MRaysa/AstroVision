"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  Contrast,
  Download,
  Image as ImageIcon,
  ScanLine,
  SplitSquareHorizontal,
  Sparkles,
  Table2,
} from "lucide-react";

import { Card } from "@/components/ui/card";

const FEATURES = [
  {
    icon: ImageIcon,
    title: "Interactive Viewer",
    description: "Zoom, pan, reset and go fullscreen with live pixel coordinates and values.",
  },
  {
    icon: Table2,
    title: "Header Metadata",
    description: "Telescope, instrument, exposure, filter and the full FITS header in a searchable table.",
  },
  {
    icon: BarChart3,
    title: "Statistics & Histogram",
    description: "Mean, median, std-dev, dynamic range and an interactive intensity histogram.",
  },
  {
    icon: Contrast,
    title: "Image Processing",
    description: "Brightness, contrast, gamma, normalize, invert, blur, median and sharpen filters.",
  },
  {
    icon: ScanLine,
    title: "Edge Detection",
    description: "Sobel, Laplacian and Canny operators computed on the server with OpenCV.",
  },
  {
    icon: Sparkles,
    title: "Star Detection",
    description: "Find and count point sources with Photutils DAOFIND and overlay their positions.",
  },
  {
    icon: SplitSquareHorizontal,
    title: "Comparison View",
    description: "Compare two frames side-by-side with a draggable split slider.",
  },
  {
    icon: Download,
    title: "Export",
    description: "Download PNG/JPEG renders, statistics as CSV and metadata as JSON.",
  },
];

/** Overview grid of the application's core capabilities. */
export function FeatureGrid() {
  return (
    <section id="features" className="container py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight">Everything you need to inspect a frame</h2>
        <p className="mt-3 text-muted-foreground">
          A focused feature set modeled on professional astronomy software.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, delay: (index % 4) * 0.05 }}
          >
            <Card className="h-full p-5 transition-colors hover:border-primary/40">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{feature.description}</p>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
