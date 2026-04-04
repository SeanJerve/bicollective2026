import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const SitePopup = () => {
  const [isOpen, setIsOpen] = useState(false);

  const { data: popup } = useQuery({
    queryKey: ["active-site-popup"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("site_popups" as any)
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle() as any);
      
      if (error) {
        console.error("Error fetching site popup:", error);
        return null; // Fail silently for the user
      }
      return data;
    },
  });

  useEffect(() => {
    // If we have a popup and haven't shown it this session
    if (popup) {
      const hasSeenPopup = sessionStorage.getItem(`site_popup_${popup.id}`);
      if (!hasSeenPopup) {
        // Add a small delay so it doesn't jarringly appear before paint structure
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [popup]);

  const handleClose = () => {
    setIsOpen(false);
    if (popup) {
      sessionStorage.setItem(`site_popup_${popup.id}`, "true");
    }
  };

  if (!isOpen || !popup) return null;

  const content = (
    <div className="relative w-full h-full">
      <img 
        src={popup.image_url} 
        alt="Promotion" 
        className="w-full h-full object-cover rounded-sm"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      <div className="relative z-10 w-full max-w-lg bg-background p-1 border-2 border-foreground shadow-brutal animate-in zoom-in-95 duration-200">
        <button 
          onClick={handleClose}
          className="absolute -top-3 -right-3 z-20 w-8 h-8 bg-foreground text-background border-2 border-foreground rounded-full flex items-center justify-center hover:bg-background hover:text-foreground transition-colors"
          title="Close Dialog"
        >
          <X className="w-5 h-5" />
        </button>
        
        {popup.redirect_url ? (
          <Link to={popup.redirect_url} onClick={handleClose} className="block w-full">
            {content}
          </Link>
        ) : (
          content
        )}
      </div>
    </div>
  );
};

export default SitePopup;
