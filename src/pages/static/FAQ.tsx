import PageLayout from "@/components/layout/PageLayout";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const faqs = [
  {
    category: "Shopping",
    id: "shopping",
    questions: [
      {
        q: "How do I place an order?",
        a: "Browse products, select your size and quantity, add to cart, then proceed to checkout. Fill in your shipping details and submit your order.",
      },
      {
        q: "Can I cancel my order?",
        a: "You can request cancellation before the vendor processes your order. Contact the vendor through your order details page.",
      },
      {
        q: "How do I track my order?",
        a: "Go to My Orders in your account. Once shipped, tracking numbers will appear on your order details.",
      },
    ],
  },
  {
    category: "Shipping",
    id: "shipping",
    questions: [
      {
        q: "Where do you ship?",
        a: "We currently ship within the Philippines. Most vendors are based in Bicol region.",
      },
      {
        q: "How long does shipping take?",
        a: "Shipping times vary by vendor and location. Typically 3-7 business days within Luzon, 7-14 days for Visayas and Mindanao.",
      },
      {
        q: "How much is shipping?",
        a: "Shipping fees are calculated per vendor and displayed at checkout. Some vendors offer free shipping on orders above a certain amount.",
      },
    ],
  },
  {
    category: "Payments",
    id: "payments",
    questions: [
      {
        q: "What payment methods do you accept?",
        a: "We accept bank transfers, GCash, Maya, and other e-wallet payments. Payment details are provided after checkout.",
      },
      {
        q: "How do I upload payment proof?",
        a: "After placing your order, go to your order details and click 'Upload Payment Proof'. Take a screenshot of your payment confirmation and upload it.",
      },
      {
        q: "When will my payment be verified?",
        a: "Vendors typically verify payments within 24-48 hours during business days.",
      },
    ],
  },
  {
    category: "Returns & Refunds",
    id: "returns",
    questions: [
      {
        q: "What is your return policy?",
        a: "Each vendor has their own return policy. Check the product page or contact the vendor for details.",
      },
      {
        q: "How do I request a refund?",
        a: "Contact the vendor through your order details page. Refunds are processed according to each vendor's policy.",
      },
    ],
  },
];

const FAQ = () => {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (key: string) => {
    const newOpen = new Set(openItems);
    if (newOpen.has(key)) {
      newOpen.delete(key);
    } else {
      newOpen.add(key);
    }
    setOpenItems(newOpen);
  };

  return (
    <PageLayout>
      <section className="py-8 md:py-12 border-b-2 border-foreground">
        <div className="section-container">
          <h1 className="font-heading text-3xl md:text-5xl uppercase">
            Frequently Asked Questions
          </h1>
          <p className="text-muted-foreground mt-2">Quick answers to common questions</p>
        </div>
      </section>

      <section className="py-8 md:py-12">
        <div className="section-container max-w-3xl">
          {faqs.map((category) => (
            <div key={category.id} id={category.id} className="mb-8">
              <h2 className="font-heading text-xl uppercase mb-4">{category.category}</h2>
              <div className="space-y-2">
                {category.questions.map((item, idx) => {
                  const key = `${category.id}-${idx}`;
                  const isOpen = openItems.has(key);
                  return (
                    <div key={key} className="card-brutal">
                      <button
                        onClick={() => toggleItem(key)}
                        className="w-full p-4 flex items-center justify-between text-left"
                      >
                        <span className="font-medium text-sm">{item.q}</span>
                        <ChevronDown
                          className={`w-5 h-5 flex-shrink-0 transition-transform ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 text-sm text-muted-foreground">{item.a}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </PageLayout>
  );
};

export default FAQ;
