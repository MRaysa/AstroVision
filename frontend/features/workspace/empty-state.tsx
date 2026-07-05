"use client";

import { Telescope } from "lucide-react";

import { SampleGallery } from "@/features/samples/sample-gallery";
import { UploadDropzone } from "@/features/upload/upload-dropzone";

/** Shown in the workspace when no image is loaded (e.g. on a fresh visit). */
export function WorkspaceEmptyState() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-12">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Telescope className="h-7 w-7" />
      </div>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">Open an image to begin</h1>
      <p className="mt-2 text-center text-muted-foreground">
        Upload a FITS file or pick a sample dataset to load it into the workspace.
      </p>

      <div className="mt-8 w-full">
        <UploadDropzone navigate={false} />
      </div>

      <div className="mt-8 w-full">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Sample datasets
        </h2>
        <SampleGallery navigate={false} columns="sm:grid-cols-2 lg:grid-cols-3" />
      </div>
    </div>
  );
}
