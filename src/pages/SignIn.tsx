// import { useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { Card } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Zap } from "lucide-react";

// const SignIn = () => {
//   const navigate = useNavigate();

//   useEffect(() => {
//     // Check if Clerk key is configured
//     const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
//     if (!clerkKey) {
//       console.warn("VITE_CLERK_PUBLISHABLE_KEY not configured");
//     }
//   }, []);

//   const handleSignIn = () => {
//     // Simulate sign in - replace with actual Clerk sign in
//     console.log("Sign in clicked - Clerk integration pending");
//     // For now, redirect to dashboard to show the UI
//     navigate("/dashboard");
//   };

//   const handleSignUp = () => {
//     navigate("/signup");
//   };

//   return (
//     <div className="flex min-h-screen items-center justify-center p-4">
//       <Card className="w-full max-w-md space-y-8 p-8 shadow-xl">
//         <div className="text-center">
//           <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
//             <Zap className="h-8 w-8" />
//           </div>
//           <h1 className="text-3xl font-bold text-foreground">Welcome Back</h1>
//           <p className="mt-2 text-muted-foreground">
//             Sign in to Blink Communication System
//           </p>
//         </div>

//         <div className="space-y-4">
//           <div className="rounded-lg border border-border/50 bg-muted/30 p-4 text-center">
//             <p className="text-sm text-muted-foreground">
//               Clerk authentication will be configured with your API key
//             </p>
//           </div>

//           <Button
//             onClick={handleSignIn}
//             className="w-full"
//             size="lg"
//           >
//             Continue to Dashboard (Demo)
//           </Button>

//           <div className="text-center">
//             <button
//               onClick={handleSignUp}
//               className="text-sm text-primary hover:underline"
//             >
//               Don't have an account? Sign up
//             </button>
//           </div>
//         </div>

//         <div className="text-center text-xs text-muted-foreground">
//           Set <code className="rounded bg-muted px-1 py-0.5">VITE_CLERK_PUBLISHABLE_KEY</code> to enable authentication
//         </div>
//       </Card>
//     </div>
//   );
// };

// export default SignIn;
import React from "react";
import { SignIn } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Eye, LogIn, Mail, Lock, Sparkles } from "lucide-react";

const SignInPage: React.FC = () => {
  const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  const navigate = useNavigate();

  if (clerkKey) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-cyan-50">
        <div className="w-full max-w-md px-4">
          {/* Logo and Branding */}
          <div className="mb-8 text-center">
            <img 
              src="/netravaani-logo.png" 
              alt="NetraVaani Logo" 
              className="h-24 w-auto mx-auto mb-4 object-contain"
            />
            <p className="text-lg text-gray-600 font-semibold">
              Your voice, through your eyes
            </p>
            <p className="mt-2 text-sm text-gray-500 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              Welcome Back!
            </p>
          </div>

          {/* Clerk Sign In Component */}
          <div className="rounded-3xl bg-white/60 backdrop-blur-xl p-6 shadow-2xl border border-white/50">
            <SignIn
              path="/signin"
              routing="path"
              signUpUrl="/signup"
              appearance={{
                elements: {
                  rootBox: "mx-auto",
                  card: "bg-transparent shadow-none",
                  formButtonPrimary: "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg transition-all duration-300",
                },
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Fallback local signin (demo mode)
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-cyan-50 overflow-hidden relative">
      {/* Animated Background Orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-40 right-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-40 w-72 h-72 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className="relative w-full max-w-md px-4 z-10">
        {/* Logo and Branding */}
        <div className="mb-8 text-center">
          <img 
            src="/netravaani-logo.png" 
            alt="NetraVaani Logo" 
            className="h-24 w-auto mx-auto mb-4 object-contain"
          />
          <p className="text-lg text-gray-600 font-semibold">
            Your voice, through your eyes
          </p>
          <p className="mt-2 text-sm text-gray-500 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            Blink Communication System
          </p>
        </div>

        {/* SignIn Card */}
        <div className="rounded-3xl bg-white/60 backdrop-blur-xl p-8 shadow-2xl border border-white/50 transition-all duration-500 hover:shadow-purple-500/20">
          <div className="mb-6 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 mb-3 shadow-lg">
              <LogIn className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800">Welcome Back</h2>
            <p className="text-gray-500 mt-1">Sign in to continue</p>
          </div>

          <form className="space-y-5">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="your.email@example.com"
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 bg-white/80 backdrop-blur-sm font-medium"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 bg-white/80 backdrop-blur-sm font-medium"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-[1.02]"
            >
              <span className="flex items-center justify-center gap-2">
                <LogIn className="w-5 h-5" />
                Sign In (Demo)
              </span>
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/signup')}
                className="font-bold text-purple-600 hover:text-blue-600 transition-colors duration-300 hover:underline"
              >
                Sign Up
              </button>
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Empowering communication through eye-tracking technology 👁️
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
