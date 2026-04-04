import { Link } from "react-router-dom";
import { HelpCircle } from "lucide-react";

const AuthHeader = () => {
  return (
    <header className="bg-background border-b-2 border-foreground h-16 md:h-20 flex items-center">
      <div className="section-container flex items-center justify-between w-full">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <span className="font-heading text-2xl md:text-3xl font-bold tracking-tight">
            BICOLLECTIVE
          </span>
        </Link>

        {/* Need Help link */}
        <Link 
          to="/help-center" 
          className="flex items-center gap-2 font-heading text-sm uppercase tracking-wide transition-opacity hover:opacity-60"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Need Help?</span>
        </Link>
      </div>
    </header>
  );
};

export default AuthHeader;
