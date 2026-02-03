import PageLayout from "@/components/layout/PageLayout";

const Terms = () => {
  return (
    <PageLayout>
      <section className="py-8 md:py-12 border-b-2 border-foreground">
        <div className="section-container">
          <h1 className="font-heading text-3xl md:text-5xl uppercase">Terms of Service</h1>
          <p className="text-muted-foreground mt-2">Last updated: February 2026</p>
        </div>
      </section>

      <section className="py-8 md:py-12">
        <div className="section-container max-w-3xl prose prose-sm">
          <div className="space-y-8">
            <div>
              <h2 className="font-heading text-xl uppercase mb-4">Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing and using Bicollective, you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use our platform.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-xl uppercase mb-4">User Accounts</h2>
              <p className="text-muted-foreground">
                You are responsible for maintaining the confidentiality of your account credentials 
                and for all activities that occur under your account. You must provide accurate and 
                complete information when creating an account.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-xl uppercase mb-4">Marketplace Rules</h2>
              <p className="text-muted-foreground">
                Bicollective is a marketplace connecting buyers with local Bicolano vendors. 
                All transactions are between buyers and individual vendors. Bicollective facilitates 
                these transactions but is not a party to the sale.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-xl uppercase mb-4">Vendor Responsibilities</h2>
              <p className="text-muted-foreground">
                Vendors are responsible for the accuracy of their product listings, order fulfillment, 
                customer service, and compliance with applicable laws. Vendors must maintain accurate 
                business information and respond to customer inquiries promptly.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-xl uppercase mb-4">Prohibited Activities</h2>
              <p className="text-muted-foreground">
                Users may not engage in fraudulent activities, sell counterfeit goods, harass other users, 
                or violate any applicable laws. We reserve the right to suspend or terminate accounts 
                that violate these terms.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-xl uppercase mb-4">Limitation of Liability</h2>
              <p className="text-muted-foreground">
                Bicollective is not liable for any disputes between buyers and vendors, product quality issues, 
                shipping delays, or other matters arising from transactions on the platform. We provide the 
                platform "as is" without warranties of any kind.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-xl uppercase mb-4">Changes to Terms</h2>
              <p className="text-muted-foreground">
                We may modify these terms at any time. Continued use of the platform after changes 
                constitutes acceptance of the modified terms.
              </p>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Terms;
