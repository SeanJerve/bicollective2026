import { Check } from "lucide-react";

interface VerifiedBadgeProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const VerifiedBadge = ({ size = "sm", className = "" }: VerifiedBadgeProps) => {
  const sizeClasses = {
    sm: "w-3 h-3 p-0.5",
    md: "w-4 h-4 p-0.5",
    lg: "w-5 h-5 p-1",
  };

  return (
    <div 
      className={`inline-flex items-center justify-center bg-primary text-primary-foreground rounded-full border border-foreground shadow-sm ${sizeClasses[size]} ${className}`}
      title="Verified Brand"
    >
      <Check className="w-full h-full" strokeWidth={4} />
    </div>
  );
};

export default VerifiedBadge;
