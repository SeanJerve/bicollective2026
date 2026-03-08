import { useEffect } from "react";

interface PageSEOProps {
  title: string;
  description?: string;
  canonical?: string;
}

const usePageSEO = ({ title, description, canonical }: PageSEOProps) => {
  useEffect(() => {
    const fullTitle = title ? `${title} | Bicollective` : "Bicollective — Local Bicolano Fashion Marketplace";
    document.title = fullTitle;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && description) {
      metaDesc.setAttribute("content", description);
    }

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute("content", fullTitle);
    }

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc && description) {
      ogDesc.setAttribute("content", description);
    }

    // Handle canonical
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (canonical) {
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = canonical;
    }

    return () => {
      document.title = "Bicollective — Local Bicolano Fashion Marketplace";
    };
  }, [title, description, canonical]);
};

export default usePageSEO;
