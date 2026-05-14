import { Link } from "react-router-dom";
import { Construction } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";

const ComingSoon = () => {
  return (
    <PageLayout>
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center px-4">
          <Construction className="w-16 h-16 mx-auto mb-6 text-muted-foreground" />
          <h1 className="font-heading text-4xl md:text-5xl uppercase mb-4">Coming Soon</h1>
          <p className="text-muted-foreground text-lg mb-2">This feature will be ready soon.</p>
          <p className="text-muted-foreground text-sm mb-8">
            We're working on making this available. Check back later!
          </p>
          <Link to="/" className="btn-brutal">
            Return to Home
          </Link>
        </div>
      </div>
    </PageLayout>
  );
};

export default ComingSoon;
