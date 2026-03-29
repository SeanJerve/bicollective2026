import PageLayout from "@/components/layout/PageLayout";

const Terms = () => {
  const sections = [
    {
      title: "1. Introduction",
      content: "Welcome to Bicollective. These Terms of Service govern your use of our platform. By accessing or using Bicollective, you agree to comply with these terms. This is a community-driven marketplace project designed to support Bicolano entrepreneurs."
    },
    {
      title: "2. User Accounts",
      content: "You are responsible for maintaining the confidentiality of your account and password. You agree to provide accurate, current, and complete information during the registration process. High-trust interaction is the core of our community."
    },
    {
      title: "3. Buying and Selling",
      content: "Bicollective provides a platform for vendors to list products and customers to purchase them. We are not a party to the actual contract of sale between buyers and sellers. Sellers are responsible for the quality and delivery of their goods."
    },
    {
      title: "4. Intellectual Property",
      content: "Users must respect the intellectual property rights of others. Do not upload photos, logos, or descriptions that you do not have the rights to use. Reported violations may lead to account suspension."
    },
    {
      title: "5. Platform Fees",
      content: "Bicollective may charge a nominal commission fee on successful transactions to support platform maintenance. Current rates are displayed in the Vendor Portal. All fees are non-refundable unless otherwise stated."
    },
    {
      title: "6. Vouchers and Promotions",
      content: "Mega Discount Vouchers and other platform-wide promos are subject to specific availability and expiration dates. Vouchers cannot be exchanged for cash and are valid for one-time use per customer unless specified."
    },
    {
      title: "7. Prohibited Conduct",
      content: "Users may not engage in fraudulent activities, price manipulation, or off-platform transactions that circumvent Bicollective's ecosystem. Respectful communication is required at all times."
    }
  ];

  return (
    <PageLayout>
      <section className="py-8 md:py-12 border-b-2 border-foreground">
        <div className="section-container">
          <h1 className="font-heading text-3xl md:text-5xl uppercase">Terms of Service</h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">
            Last updated: March 29, 2026
          </p>
        </div>
      </section>

      <section className="py-8 md:py-12">
        <div className="section-container max-w-3xl">
          <div className="space-y-8">
            {sections.map((section, index) => (
              <div key={index}>
                <h2 className="font-heading text-xl uppercase mb-3">{section.title}</h2>
                <div className="card-brutal p-6 bg-card">
                  <p className="text-sm md:text-base leading-relaxed text-muted-foreground">
                    {section.content}
                  </p>
                </div>
              </div>
            ))}
            
            <div className="p-6 bg-secondary border-2 border-foreground mt-12">
              <p className="text-xs text-center uppercase font-heading tracking-widest">
                Thank you for being part of the Bicollective community.
              </p>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Terms;
