import PageLayout from "@/components/layout/PageLayout";

const Privacy = () => {
  return (
    <PageLayout>
      <section className="py-8 md:py-12 border-b-2 border-foreground">
        <div className="section-container">
          <h1 className="font-heading text-3xl md:text-5xl uppercase">Privacy Policy</h1>
          <p className="text-muted-foreground mt-2">Last updated: February 2026</p>
        </div>
      </section>

      <section className="py-8 md:py-12">
        <div className="section-container max-w-3xl prose prose-sm">
          <div className="space-y-8">
            <div>
              <h2 className="font-heading text-xl uppercase mb-4">Information We Collect</h2>
              <p className="text-muted-foreground">
                We collect information you provide directly to us, such as when you create an
                account, make a purchase, or contact us for support. This includes your name, email
                address, phone number, shipping address, and payment information.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-xl uppercase mb-4">How We Use Your Information</h2>
              <p className="text-muted-foreground">
                We use the information we collect to process transactions, send order updates,
                improve our services, and communicate with you about products and promotions. We
                never sell your personal information to third parties.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-xl uppercase mb-4">Data Security</h2>
              <p className="text-muted-foreground">
                We implement appropriate security measures to protect your personal information
                against unauthorized access, alteration, disclosure, or destruction. All sensitive
                data is encrypted in transit and at rest.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-xl uppercase mb-4">Cookies</h2>
              <p className="text-muted-foreground">
                We use cookies and similar technologies to maintain your session, remember your
                preferences, and improve your experience on our platform.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-xl uppercase mb-4">Your Rights</h2>
              <p className="text-muted-foreground">
                You have the right to access, correct, or delete your personal information. Contact
                us at privacy@bicollective.com for any privacy-related requests.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-xl uppercase mb-4">Contact Us</h2>
              <p className="text-muted-foreground">
                If you have questions about this Privacy Policy, please contact us at
                privacy@bicollective.com or through our Contact page.
              </p>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Privacy;
