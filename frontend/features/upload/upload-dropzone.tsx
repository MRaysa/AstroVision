"use client";

import { motion } from "framer-motion";
import { Loader2, UploadCloud } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { useImageLoader } from "@/hooks/use-image-loader";
import { cn } from "@/utils/cn";

const ACCEPTED = [".fits", ".fit", ".fts"];

function hasAcceptedExtension(name: string): boolean {
  const lower = name.toLowerCase();
  return ACCEPTED.some((ext) => lower.endsWith(ext)) || lower.endsWith(".fits.gz");
}

interface UploadDropzoneProps {
  navigate?: boolean;
  compact?: boolean;
}

/** Drag-and-drop / click-to-browse zone for uploading a FITS file. */
export function UploadDropzone({ navigate = true, compact = false }: UploadDropzoneProps) {
  const { uploadFile, isLoading } = useImageLoader({ navigate });
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      if (!hasAcceptedExtension(file.name)) {
        toast.error("Unsupported file", {
          description: "Please choose a FITS file (.fits, .fit, .fts).",
        });
        return;
      }
      uploadFile(file);
    },
    [uploadFile],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFile(e.dataTransfer.files?.[0]);
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      className={cn(
        "glass group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center transition-all hover:border-primary/60 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isDragging ? "border-primary bg-primary/10" : "border-border",
        compact ? "gap-2 p-6" : "gap-4 p-10",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".fits,.fit,.fts,.gz"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110",
          compact ? "h-10 w-10" : "h-16 w-16",
        )}
      >
        {isLoading ? (
          <Loader2 className={compact ? "h-5 w-5 animate-spin" : "h-7 w-7 animate-spin"} />
        ) : (
          <UploadCloud className={compact ? "h-5 w-5" : "h-7 w-7"} />
        )}
      </div>
      <div>
        <p className={cn("font-medium", compact ? "text-sm" : "text-base")}>
          {isLoading ? "Uploading & analyzing…" : "Drop a FITS file here"}
        </p>
        {!compact && (
          <p className="mt-1 text-sm text-muted-foreground">
            or click to browse — supports .fits, .fit, .fts
          </p>
        )}
      </div>
    </motion.div>
  );
}
