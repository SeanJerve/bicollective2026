import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Package, Store, MapPin, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SearchResult {
  type: "product" | "brand" | "location";
  id: string;
  name: string;
  slug: string;
  extra?: string;
}

const BICOL_LOCATIONS = [
  "Legazpi City",
  "Naga City",
  "Tabaco City",
  "Ligao City",
  "Iriga City",
  "Sorsogon City",
  "Masbate City",
  "Daet",
  "Virac",
  "Albay",
  "Camarines Sur",
  "Camarines Norte",
  "Sorsogon",
  "Masbate",
  "Catanduanes",
];

interface Props {
  onClose?: () => void;
  className?: string;
  autoFocus?: boolean;
}

const SearchAutocomplete = ({ onClose, className = "", autoFocus = false }: Props) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const debounce = setTimeout(async () => {
      setLoading(true);
      try {
        const lowerQuery = query.toLowerCase();

        // Search products
        const { data: products } = await supabase
          .from("products")
          .select("id, name, slug, brand:brands(name)")
          .eq("is_active", true)
          .ilike("name", `%${query}%`)
          .limit(5);

        // Search brands (by name or location)
        const { data: brands } = await supabase
          .from("brands")
          .select("id, name, slug, location")
          .in("status", ["approved", "verified"])
          .or(`name.ilike.%${query}%,location.ilike.%${query}%`)
          .limit(5);

        // Location suggestions
        const locationMatches = BICOL_LOCATIONS.filter((loc) =>
          loc.toLowerCase().includes(lowerQuery)
        ).slice(0, 3);

        const combined: SearchResult[] = [
          ...(products || []).map((p) => ({
            type: "product" as const,
            id: p.id,
            name: p.name,
            slug: p.slug,
            extra: (p.brand as any)?.name || "",
          })),
          ...(brands || []).map((b) => ({
            type: "brand" as const,
            id: b.id,
            name: b.name,
            slug: b.slug,
            extra: b.location || "",
          })),
          ...locationMatches.map((loc) => ({
            type: "location" as const,
            id: loc,
            name: loc,
            slug: loc.toLowerCase().replace(/\s+/g, "-"),
            extra: "Location",
          })),
        ];

        setResults(combined);
        setIsOpen(combined.length > 0);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    setIsOpen(false);
    setQuery("");
    onClose?.();

    switch (result.type) {
      case "product":
        navigate(`/products/${result.slug}`);
        break;
      case "brand":
        navigate(`/brands/${result.slug}`);
        break;
      case "location":
        navigate(`/products?location=${encodeURIComponent(result.name)}`);
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      onClose?.();
      navigate(`/products?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "product":
        return <Package className="w-4 h-4 text-muted-foreground" />;
      case "brand":
        return <Store className="w-4 h-4 text-muted-foreground" />;
      case "location":
        return <MapPin className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setIsOpen(true)}
            placeholder="Search products, brands, locations..."
            className="input-brutal w-full pr-20"
          />
          <div className="absolute right-0 top-0 h-full flex">
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="px-2 flex items-center text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="h-full px-4 bg-foreground text-background border-2 border-foreground flex items-center"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>
      </form>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border-2 border-foreground shadow-brutal z-50 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">Searching...</div>
          ) : (
            <ul>
              {results.map((result, idx) => (
                <li key={`${result.type}-${result.id}-${idx}`}>
                  <button
                    onClick={() => handleSelect(result)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary text-left transition-colors"
                  >
                    {getIcon(result.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{result.name}</p>
                      {result.extra && (
                        <p className="text-xs text-muted-foreground truncate">{result.extra}</p>
                      )}
                    </div>
                    <span className="text-xs uppercase text-muted-foreground">{result.type}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;
