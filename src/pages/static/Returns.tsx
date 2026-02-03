import PageLayout from "@/components/layout/PageLayout";
import { Link } from "react-router-dom";

const Returns = () => {
  return (
    <PageLayout>
      <section className="py-8 md:py-12 border-b-2 border-foreground">
        <div className="section-container">
          <h1 className="font-heading text-3xl md:text-5xl uppercase">Return Policy</h1>
          <p className="text-muted-foreground mt-2">Understanding returns on Bicollective</p>
        </div>
      </section>

      <section className="py-8 md:py-12">
        <div className="section-container max-w-3xl prose prose-sm">
          <div className="space-y-8">
            <div className="card-brutal p-6 bg-secondary">
              <h3 className="font-heading uppercase mb-2">Important Note</h3>
              <p className="text-sm text-muted-foreground">
                Bicollective is a marketplace connecting you with independent vendors. 
                Each vendor sets their own return policy. Always check the vendor's specific 
                return terms before making a purchase.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-xl uppercase mb-4">General Guidelines</h2>
              <p className="text-muted-foreground">
                While policies vary by vendor, most follow these general guidelines:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-2">
                <li>Returns are typically accepted within 7-14 days of delivery</li>
                <li>Items must be unused and in original packaging</li>
                <li>Buyer usually pays return shipping unless item is defective</li>
                <li>Custom or personalized items may not be returnable</li>
              </ul>
            </div>

            <div>
              <h2 className="font-heading text-xl uppercase mb-4">How to Request a Return</h2>
              <ol className="list-decimal list-inside text-muted-foreground space-y-2">
                <li>Go to your order history and find the relevant order</li>
                <li>Contact the vendor through the order details page</li>
                <li>Explain the reason for your return request</li>
                <li>Wait for the vendor to approve and provide return instructions</li>
                <li>Ship the item back as instructed</li>
              </ol>
            </div>

            <div>
              <h2 className="font-heading text-xl uppercase mb-4">Defective or Wrong Items</h2>
              <p className="text-muted-foreground">
                If you receive a defective or incorrect item, contact the vendor immediately. 
                Most vendors will cover return shipping costs and provide a full refund or 
                replacement for defective items.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-xl uppercase mb-4">Refund Processing</h2>
              <p className="text-muted-foreground">
                Refunds are processed by individual vendors. Timing varies but typically 
                takes 5-10 business days after the vendor receives and inspects the returned item.
              </p>
            </div>

            <div>
              <h2 className="font-heading text-xl uppercase mb-4">Need Help?</h2>
              <p className="text-muted-foreground">
                If you're having trouble with a return or refund, our support team can help 
                mediate. <Link to="/contact" className="underline">Contact us</Link> with your 
                order details.
              </p>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Returns;
