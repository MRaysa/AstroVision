import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { FeatureGrid } from "@/features/landing/feature-grid";
import { Hero } from "@/features/landing/hero";
import { SampleGallery } from "@/features/samples/sample-gallery";
import { UploadDropzone } from "@/features/upload/upload-dropzone";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />

        {/* Get started: upload or open a sample */}
        <section id="samples" className="container pb-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="flex flex-col justify-center">
              <h2 className="text-2xl font-bold tracking-tight">Start analyzing</h2>
              <p className="mt-2 text-muted-foreground">
                Upload your own FITS file, or open one of the bundled sample datasets to explore the
                full toolset instantly.
              </p>
              <div className="mt-6">
                <UploadDropzone />
              </div>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Sample datasets
              </h3>
              <SampleGallery columns="sm:grid-cols-2" />
            </div>
          </div>
        </section>

        <FeatureGrid />
      </main>
      <SiteFooter />
    </div>
  );
}
