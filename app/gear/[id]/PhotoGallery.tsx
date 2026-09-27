"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface Photo {
  id: string;
  url: string;
  position: number;
}

export default function PhotoGallery({ photos, title }: { photos: Photo[]; title: string }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Close on Escape, navigate with arrow keys
  useEffect(() => {
    if (lightboxIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight") setLightboxIndex((i) => i !== null ? Math.min(i + 1, photos.length - 1) : null);
      if (e.key === "ArrowLeft")  setLightboxIndex((i) => i !== null ? Math.max(i - 1, 0) : null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, photos.length]);

  if (photos.length === 0) return null;

  const coverUrl = photos[0].url;

  return (
    <>
      {/* Main image */}
      <div
        className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-100 aspect-[4/3] relative cursor-zoom-in"
        onClick={() => setLightboxIndex(0)}
      >
        <Image
          src={coverUrl}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 640px"
          priority
        />
        <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-[#27667B] text-xs font-semibold px-3 py-1 rounded-full border border-[#27667B]/20">
          {photos.length} photo{photos.length !== 1 ? "s" : ""}
        </span>
        {/* Expand hint */}
        <div className="absolute bottom-3 right-3 bg-black/40 backdrop-blur-sm rounded-xl px-2 py-1 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          <span className="text-white text-[10px] font-medium">Expand</span>
        </div>
      </div>

      {/* Thumbnails — only real photos, no placeholders */}
      {photos.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {photos.slice(0, 4).map((img, i) => (
            <div
              key={img.id}
              onClick={() => setLightboxIndex(i)}
              className={`aspect-square rounded-xl overflow-hidden relative cursor-pointer transition-all duration-200 hover:opacity-90 hover:shadow-md ${
                i === 0 ? "border-2 border-[#143D60]" : "border border-gray-100"
              }`}
            >
              <Image src={img.url} alt={`Photo ${i + 1}`} fill className="object-cover" sizes="120px" />
              {/* "View all" overlay on the 4th if there are more than 4 */}
              {i === 3 && photos.length > 4 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">+{photos.length - 4}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close button */}
          <button
            className="absolute top-5 right-5 text-white/70 hover:text-white transition-colors duration-200 z-10"
            onClick={() => setLightboxIndex(null)}
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Counter */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 text-white/50 text-sm font-medium">
            {lightboxIndex + 1} / {photos.length}
          </div>

          {/* Prev arrow */}
          {lightboxIndex > 0 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors duration-200 z-10"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Image */}
          <div
            className="relative max-w-5xl max-h-[85vh] w-full mx-16"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photos[lightboxIndex].url}
              alt={`${title} — photo ${lightboxIndex + 1}`}
              className="w-full h-full object-contain max-h-[85vh] rounded-xl"
            />
          </div>

          {/* Next arrow */}
          {lightboxIndex < photos.length - 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors duration-200 z-10"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Thumbnail strip at bottom */}
          {photos.length > 1 && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
              {photos.map((img, i) => (
                <button
                  key={img.id}
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
                  className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all duration-200 flex-shrink-0 ${
                    i === lightboxIndex ? "border-[#DDEB9D] opacity-100" : "border-transparent opacity-50 hover:opacity-80"
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}