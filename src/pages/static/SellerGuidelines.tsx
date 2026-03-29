import PageLayout from "@/components/layout/PageLayout";
import { Link } from "react-router-dom";
import { CheckCircle, AlertCircle, BadgeCheck, Store, ShieldAlert, ZapOff } from "lucide-react";

const SellerGuidelines = () => {
  const prohibitedItems = [
    "Illegal drugs and drug paraphernalia",
    "Weapons, firearms, and explosives",
    "Counterfeit, replica, or non-authentic goods",
    "Expired or unsafe food and beauty products",
    "Stolen goods or digital accounts",
    "Prescription medicines",
    "Items violating copyright/trademark"
  ];

  return (
    <PageLayout>
      <section className="py-8 md:py-12 border-b-2 border-foreground">
        <div className="section-container">
          <h1 className="font-heading text-3xl md:text-5xl uppercase italic tracking-tighter">Seller Guidelines</h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">
            Essential rules for building trust on Bicollective
          </p>
        </div>
      </section>

      <section className="py-8 md:py-12">
        <div className="section-container max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-12">
              {/* Getting Started */}
              <div>
                <h2 className="font-heading text-2xl uppercase mb-6">Workflow</h2>
                <div className="space-y-4">
                  {[
                    { step: 1, title: "Apply", desc: "Submit business details and valid ID." },
                    { step: 2, title: "Approve", desc: "Admin reviews within 48 hours." },
                    { step: 3, title: "Setup", desc: "List products and set shop details." },
                    { step: 4, title: "Sell", desc: "Go live and support customers." }
                  ].map((s) => (
                    <div key={s.step} className="flex gap-4 p-5 card-brutal items-center">
                      <span className="w-10 h-10 bg-foreground text-background flex items-center justify-center font-heading text-2xl flex-shrink-0">
                        {s.step}
                      </span>
                      <div>
                        <h3 className="font-heading uppercase text-sm">{s.title}</h3>
                        <p className="text-xs text-muted-foreground">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expectations */}
              <div>
                <h2 className="font-heading text-2xl uppercase mb-6 flex items-center gap-2">
                  <BadgeCheck className="w-6 h-6" /> Our Expectations
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[
                    { icon: CheckCircle, title: "Fulfillment", desc: "Ship within 3 business days of payment." },
                    { icon: CheckCircle, title: "Accuracy", desc: "Honest photos and detailed descriptions." },
                    { icon: CheckCircle, title: "Authenticity", desc: "Zero tolerance for counterfeit items." },
                    { icon: CheckCircle, title: "Trust", desc: "Respond to customers within 24 hours." }
                  ].map((exp, i) => (
                    <div key={i} className="flex gap-3">
                      <exp.icon className="w-5 h-5 text-success flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-heading text-xs uppercase mb-1">{exp.title}</h4>
                        <p className="text-xs text-muted-foreground font-medium leading-relaxed">{exp.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prohibited Items */}
              <div className="p-8 border-4 border-destructive bg-destructive/5">
                <h2 className="font-heading text-2xl uppercase mb-6 flex items-center gap-2 text-destructive">
                  <ShieldAlert className="w-7 h-7" /> Prohibited Items
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {prohibitedItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
                      <AlertCircle className="w-4 h-4 text-destructive" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className="space-y-8">
              <div className="p-6 bg-secondary border-2 border-foreground">
                <ZapOff className="w-8 h-8 mb-4 text-destructive" />
                <h3 className="font-heading text-lg uppercase mb-2">Anti-Bypass Policy</h3>
                <p className="text-xs text-muted-foreground leading-relaxed italic mb-4">
                  Taking transactions off Bicollective (bypass) to avoid commissions is strictly prohibited. Sellers found redirecting customers will be permanently banned.
                </p>
                <div className="p-3 bg-background border border-foreground text-[10px] font-bold uppercase">
                  Protect your store status. Keep it on Bicollective.
                </div>
              </div>

              <div className="card-brutal p-6 bg-accent">
                <Store className="w-10 h-10 mb-4" />
                <h3 className="font-heading text-xl uppercase mb-2">Seller Support</h3>
                <p className="text-sm opacity-80 mb-6">
                  Need help with listing or application? Contact our Merchant Support team.
                </p>
                <Link to="/contact" className="block text-center py-3 bg-foreground text-background font-heading uppercase text-sm hover:invert transition-all">
                  Contact Us
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 mb-12">
        <div className="section-container text-center">
          <div className="max-w-xl mx-auto space-y-4">
            <h2 className="font-heading text-3xl md:text-5xl uppercase tracking-tighter">Ready to Scale?</h2>
            <p className="text-muted-foreground text-sm">Join the Bicolano community and start your entrepreneur journey.</p>
            <div className="pt-4">
              <Link to="/vendor/register" className="btn-brutal text-lg">
                Apply as a Vendor
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default SellerGuidelines;
