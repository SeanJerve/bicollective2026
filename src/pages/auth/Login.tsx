import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import AuthHeader from "@/components/layout/AuthHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { lovable } from "@/integrations/lovable";
import TestAccountsBox from "@/components/auth/TestAccountsBox";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as any)?.from || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in",
      });
      navigate(redirectTo);
    }
  };

  const handleGoogleSignIn = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });

    if (result.redirected) {
      return;
    }

    if (result.error) {
      toast({
        title: "Sign in failed",
        description: result.error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome!",
        description: "You have successfully signed in with Google",
      });
      navigate(redirectTo);
    }
  };

  const handleSelectAccount = (accountEmail: string, accountPassword: string) => {
    setEmail(accountEmail);
    setPassword(accountPassword);
  };

  return (
    <PageLayout header={<AuthHeader />} hideSaleBanner minimalHeader>
      <div className="flex-1 relative flex items-center justify-center min-h-[calc(100vh-80px)] overflow-hidden">
        {/* Background Image Container - Ready for future image */}
        <div
          className="absolute inset-0 z-0 bg-secondary/30"
          style={{
            backgroundImage: "none", // User will add image here
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        <section className="relative z-10 w-full py-8 md:py-12">
          <div className="section-container max-w-md">
            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="font-heading text-3xl md:text-4xl uppercase mb-3">
                Sign in to bicollective
              </h1>
              <p className="text-muted-foreground text-sm">
                Enter your credentials to access your account
              </p>
            </div>

            {/* Login Form */}
            <div className="card-brutal p-6 md:p-8 bg-background">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="font-heading text-xs uppercase tracking-wide mb-1.5 block">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-brutal pl-10 text-sm"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="font-heading text-xs uppercase tracking-wide mb-1.5 block">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-brutal pl-10 pr-10 text-sm"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <Link
                    to="/forgot-password"
                    className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <button type="submit" disabled={loading} className="btn-brutal w-full text-sm">
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border-subtle" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-background px-4 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <button
                onClick={handleGoogleSignIn}
                className="btn-brutal-secondary w-full flex items-center justify-center gap-2 text-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>

              <div className="mt-6 text-center">
                <p className="text-[10px] md:text-xs text-muted-foreground leading-relaxed">
                  By signing up, you agree to Bicollective's{" "}
                  <Link to="/terms" className="text-foreground font-medium hover:underline">
                    Terms of Service
                  </Link>{" "}
                  &{" "}
                  <Link to="/privacy" className="text-foreground font-medium hover:underline">
                    Privacy Policy
                  </Link>
                </p>
              </div>

              <p className="text-center text-xs text-muted-foreground mt-6 pt-6 border-t border-border-subtle">
                Don't have an account?{" "}
                <Link to="/register" className="text-foreground hover:underline font-bold">
                  Create account
                </Link>
              </p>
            </div>

            {/* Subtle Test Accounts Toggle or Link */}
            <div className="mt-8 text-center opacity-50 hover:opacity-100 transition-opacity">
              <button
                onClick={() => {
                  const el = document.getElementById("test-accounts");
                  if (el) el.classList.toggle("hidden");
                }}
                className="text-[10px] uppercase tracking-widest hover:underline"
              >
                Developer: Test Accounts
              </button>
              <div id="test-accounts" className="hidden mt-4">
                <TestAccountsBox onSelectAccount={handleSelectAccount} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  );
};

export default Login;
