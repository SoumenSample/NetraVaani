import { SignIn } from "@clerk/clerk-react";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();

  // Check if user is already signed in
  useEffect(() => {
    // If using Clerk, the SignedIn component will handle redirects
    // This is just a fallback
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="w-full max-w-md px-4">
        {/* Logo and Branding */}
        <div className="mb-8 text-center">
          <img 
            src="/netravaani-logo.png" 
            alt="NetraVaani Logo" 
            className="h-24 w-auto mx-auto mb-4 object-contain"
          />
          <p className="text-lg text-muted-foreground">
            Your voice, through your eyes
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Blink Communication System
          </p>
        </div>

        {/* Clerk Sign In Component */}
        <div className="rounded-lg bg-card/50 p-6 shadow-xl backdrop-blur-sm">
          <SignIn 
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            afterSignInUrl="/dashboard"
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "bg-transparent shadow-none",
              },
            }}
          />
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Empowering communication through eye-tracking technology
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
