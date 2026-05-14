import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ImageGalleryProps {
  mainImage: string;
  images?: string[];
  alt: string;
}

const ImageGallery = ({ mainImage, images = [], alt }: ImageGalleryProps) => {
  const allImages = [mainImage, ...images].filter(Boolean);
  const [activeIndex, setActiveIndex] = useState(0);

  const goTo = (idx: number) => {
    setActiveIndex((idx + allImages.length) % allImages.length);
  };

  if (allImages.length === 0) {
    return (
      <div className="card-brutal overflow-hidden">
        <div className="aspect-[3/4] bg-muted flex items-center justify-center text-muted-foreground">
          No image
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div className="card-brutal overflow-hidden relative group">
        <div className="aspect-[3/4] bg-muted">
          <img
            src={allImages[activeIndex]}
            alt={`${alt} ${activeIndex + 1}`}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
        {allImages.length > 1 && (
          <>
            <button
              onClick={() => goTo(activeIndex - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 border-2 border-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => goTo(activeIndex + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 border-2 border-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-background/80 px-3 py-1 text-xs font-heading">
              {activeIndex + 1} / {allImages.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`w-16 h-20 md:w-20 md:h-24 flex-shrink-0 border-2 overflow-hidden transition-colors ${
                idx === activeIndex
                  ? "border-foreground"
                  : "border-border-subtle hover:border-foreground/50"
              }`}
            >
              <img
                src={img}
                alt={`${alt} thumb ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
