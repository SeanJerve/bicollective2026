import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import { supabase } from "@/integrations/supabase/client";
import AuthHeader from "@/components/layout/AuthHeader";
import { useToast } from "@/hooks/use-toast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSent(true);
      toast({
        title: "Email sent!",
        description: "Check your inbox for the password reset link",
      });
    } catch (error: any) {
      toast({
        title: "Failed to send email",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <PageLayout header={<AuthHeader />} hideSaleBanner>
        <section className="py-12 md:py-24">
          <div className="section-container max-w-md text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-6 text-success" />
            <h1 className="font-heading text-3xl md:text-4xl uppercase mb-4">Check Your Email</h1>
            <p className="text-muted-foreground mb-8">
              We've sent a password reset link to <strong>{email}</strong>. Click the link in the
              email to reset your password.
            </p>
            <Link to="/login" className="btn-brutal inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </section>
      </PageLayout>
    );
  }

  return (
    <PageLayout header={<AuthHeader />} hideSaleBanner>
      <section className="py-12 md:py-24">
        <div className="section-container max-w-md">
          <div className="text-center mb-6 md:mb-8">
            <h1 className="font-heading text-3xl md:text-5xl uppercase mb-3 md:mb-4">
              Forgot Password
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Enter your email and we'll send you a reset link
            </p>
          </div>

          <div className="card-brutal p-5 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
              <div>
                <label className="font-heading text-xs md:text-sm uppercase tracking-wide mb-2 block">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-brutal pl-10 md:pl-12 text-sm md:text-base"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-brutal w-full text-sm md:text-base"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>

            <p className="text-center text-xs md:text-sm text-muted-foreground mt-5 md:mt-6">
              Remember your password?{" "}
              <Link to="/login" className="text-foreground hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default ForgotPassword;
