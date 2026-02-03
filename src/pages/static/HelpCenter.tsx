import PageLayout from "@/components/layout/PageLayout";
import { HelpCircle, MessageSquare, ShoppingBag, Truck, CreditCard, Store } from "lucide-react";
import { Link } from "react-router-dom";

const helpTopics = [
  {
    icon: ShoppingBag,
    title: "Shopping",
    description: "Browse products, add to cart, and checkout",
    link: "/faq#shopping",
  },
  {
    icon: Truck,
    title: "Shipping & Delivery",
    description: "Track orders and delivery information",
    link: "/faq#shipping",
  },
  {
    icon: CreditCard,
    title: "Payments",
    description: "Payment methods and proof uploads",
    link: "/faq#payments",
  },
  {
    icon: Store,
    title: "Selling on Bicollective",
    description: "Become a vendor and grow your business",
    link: "/vendor/guidelines",
  },
];

const HelpCenter = () => {
  return (
    <PageLayout>
      <section className="py-8 md:py-12 border-b-2 border-foreground">
        <div className="section-container text-center">
          <HelpCircle className="w-12 h-12 mx-auto mb-4" />
          <h1 className="font-heading text-3xl md:text-5xl uppercase">Help Center</h1>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Find answers to common questions or contact our support team
          </p>
        </div>
      </section>

      <section className="py-8 md:py-12">
        <div className="section-container max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {helpTopics.map((topic) => (
              <Link
                key={topic.title}
                to={topic.link}
                className="card-brutal p-6 hover:bg-secondary transition-colors"
              >
                <topic.icon className="w-8 h-8 mb-4" />
                <h3 className="font-heading uppercase mb-2">{topic.title}</h3>
                <p className="text-sm text-muted-foreground">{topic.description}</p>
              </Link>
            ))}
          </div>

          <div className="card-brutal p-6 md:p-8 mt-8 text-center bg-secondary">
            <MessageSquare className="w-10 h-10 mx-auto mb-4" />
            <h2 className="font-heading text-xl uppercase mb-2">Still need help?</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Contact our support team and we'll get back to you within 24 hours
            </p>
            <Link to="/contact" className="btn-brutal">
              Contact Support
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default HelpCenter;
