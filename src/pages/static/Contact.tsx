import { useState } from "react";
import { Mail, MapPin, Phone, Send, Loader2 } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Simulate submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: "Message sent!",
      description: "We'll get back to you within 24 hours.",
    });

    setFormData({ name: "", email: "", subject: "", message: "" });
    setSubmitting(false);
  };

  return (
    <PageLayout>
      <section className="py-8 md:py-12 border-b-2 border-foreground">
        <div className="section-container">
          <h1 className="font-heading text-3xl md:text-5xl uppercase">Contact Us</h1>
          <p className="text-muted-foreground mt-2">
            Have questions? We're here to help.
          </p>
        </div>
      </section>

      <section className="py-8 md:py-12">
        <div className="section-container max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card-brutal p-6 text-center">
              <Mail className="w-8 h-8 mx-auto mb-3" />
              <h3 className="font-heading uppercase mb-1">Email</h3>
              <p className="text-sm text-muted-foreground">support@bicollective.com</p>
            </div>
            <div className="card-brutal p-6 text-center">
              <Phone className="w-8 h-8 mx-auto mb-3" />
              <h3 className="font-heading uppercase mb-1">Phone</h3>
              <p className="text-sm text-muted-foreground">+63 912 345 6789</p>
            </div>
            <div className="card-brutal p-6 text-center">
              <MapPin className="w-8 h-8 mx-auto mb-3" />
              <h3 className="font-heading uppercase mb-1">Location</h3>
              <p className="text-sm text-muted-foreground">Legazpi City, Albay</p>
            </div>
          </div>

          <div className="card-brutal p-6 md:p-8">
            <h2 className="font-heading text-xl uppercase mb-6">Send us a message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-heading text-sm uppercase mb-2">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-brutal w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block font-heading text-sm uppercase mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-brutal w-full"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block font-heading text-sm uppercase mb-2">Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="input-brutal w-full"
                  required
                />
              </div>
              <div>
                <label className="block font-heading text-sm uppercase mb-2">Message</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="input-brutal w-full h-32 resize-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="btn-brutal flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Contact;
