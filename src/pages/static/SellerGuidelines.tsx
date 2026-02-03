import PageLayout from "@/components/layout/PageLayout";
import { Link } from "react-router-dom";
import { CheckCircle, AlertCircle, BadgeCheck, Store } from "lucide-react";

const SellerGuidelines = () => {
  return (
    <PageLayout>
      <section className="py-8 md:py-12 border-b-2 border-foreground">
        <div className="section-container">
          <h1 className="font-heading text-3xl md:text-5xl uppercase">Seller Guidelines</h1>
          <p className="text-muted-foreground mt-2">
            Everything you need to know about selling on Bicollective
          </p>
        </div>
      </section>

      <section className="py-8 md:py-12">
        <div className="section-container max-w-3xl">
          <div className="space-y-8">
            {/* Getting Started */}
            <div>
              <h2 className="font-heading text-2xl uppercase mb-4">Getting Started</h2>
              <div className="card-brutal p-6">
                <ol className="space-y-4">
                  <li className="flex gap-4">
                    <span className="w-8 h-8 bg-foreground text-background flex items-center justify-center font-heading flex-shrink-0">1</span>
                    <div>
                      <h3 className="font-medium">Apply to sell</h3>
                      <p className="text-sm text-muted-foreground">
                        Fill out our seller application with your business details and required documents.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="w-8 h-8 bg-foreground text-background flex items-center justify-center font-heading flex-shrink-0">2</span>
                    <div>
                      <h3 className="font-medium">Wait for approval</h3>
                      <p className="text-sm text-muted-foreground">
                        Our team reviews applications within 1-3 business days.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="w-8 h-8 bg-foreground text-background flex items-center justify-center font-heading flex-shrink-0">3</span>
                    <div>
                      <h3 className="font-medium">Set up your store</h3>
                      <p className="text-sm text-muted-foreground">
                        Add your brand details, logo, and start listing products.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="w-8 h-8 bg-foreground text-background flex items-center justify-center font-heading flex-shrink-0">4</span>
                    <div>
                      <h3 className="font-medium">Start selling</h3>
                      <p className="text-sm text-muted-foreground">
                        Your products go live and customers can start ordering!
                      </p>
                    </div>
                  </li>
                </ol>
              </div>
            </div>

            {/* Seller Types */}
            <div>
              <h2 className="font-heading text-2xl uppercase mb-4">Seller Types</h2>
              <div className="grid gap-4">
                <div className="card-brutal p-6">
                  <div className="flex items-start gap-4">
                    <Store className="w-8 h-8 flex-shrink-0" />
                    <div>
                      <h3 className="font-heading uppercase mb-1">Established Business</h3>
                      <p className="text-sm text-muted-foreground">
                        For registered businesses with permits. You'll need to provide business permits 
                        and valid IDs during application.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="card-brutal p-6">
                  <div className="flex items-start gap-4">
                    <BadgeCheck className="w-8 h-8 flex-shrink-0" />
                    <div>
                      <h3 className="font-heading uppercase mb-1">Aspiring Seller</h3>
                      <p className="text-sm text-muted-foreground">
                        Just starting out? We welcome new entrepreneurs! You'll only need a valid ID 
                        and photos of your products.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div>
              <h2 className="font-heading text-2xl uppercase mb-4">What We Expect</h2>
              <div className="grid gap-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Quality products</h4>
                    <p className="text-xs text-muted-foreground">Sell genuine, quality items that match your descriptions</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Accurate listings</h4>
                    <p className="text-xs text-muted-foreground">Provide clear photos and honest descriptions</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Timely fulfillment</h4>
                    <p className="text-xs text-muted-foreground">Process and ship orders within 3 business days</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Good communication</h4>
                    <p className="text-xs text-muted-foreground">Respond to customer inquiries promptly</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Not Allowed */}
            <div>
              <h2 className="font-heading text-2xl uppercase mb-4">What's Not Allowed</h2>
              <div className="grid gap-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Counterfeit or replica items</span>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Misleading product descriptions or photos</span>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Items that violate Philippine laws</span>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Price manipulation or fake reviews</span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="card-brutal p-6 md:p-8 bg-secondary text-center">
              <h2 className="font-heading text-xl uppercase mb-2">Ready to start selling?</h2>
              <p className="text-muted-foreground text-sm mb-4">
                Join the Bicollective community and reach customers across Bicol
              </p>
              <Link to="/vendor/register" className="btn-brutal">
                Apply Now
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default SellerGuidelines;
