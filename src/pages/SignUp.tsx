// import { useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { Card } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Zap } from "lucide-react";

// const SignUp = () => {
//   const navigate = useNavigate();

//   useEffect(() => {
//     // Check if Clerk key is configured
//     const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
//     if (!clerkKey) {
//       console.warn("VITE_CLERK_PUBLISHABLE_KEY not configured");
//     }
//   }, []);

//   const handleSignUp = () => {
//     // Simulate sign up - replace with actual Clerk sign up
//     console.log("Sign up clicked - Clerk integration pending");
//     // For now, redirect to dashboard to show the UI
//     navigate("/dashboard");
//   };

//   const handleSignIn = () => {
//     navigate("/signin");
//   };

//   return (
//     <div className="flex min-h-screen items-center justify-center p-4">
//       <Card className="w-full max-w-md space-y-8 p-8 shadow-xl">
//         <div className="text-center">
//           <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
//             <Zap className="h-8 w-8" />
//           </div>
//           <h1 className="text-3xl font-bold text-foreground">Get Started</h1>
//           <p className="mt-2 text-muted-foreground">
//             Create your Blink Communication account
//           </p>
//         </div>

//         <div className="space-y-4">
//           <div className="rounded-lg border border-border/50 bg-muted/30 p-4 text-center">
//             <p className="text-sm text-muted-foreground">
//               Clerk authentication will be configured with your API key
//             </p>
//           </div>

//           <Button
//             onClick={handleSignUp}
//             className="w-full"
//             size="lg"
//           >
//             Create Account (Demo)
//           </Button>

//           <div className="text-center">
//             <button
//               onClick={handleSignIn}
//               className="text-sm text-primary hover:underline"
//             >
//               Already have an account? Sign in
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

// export default SignUp;

import React, { useState } from "react";
import { SignUp } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Eye, UserPlus, Mail, Lock, User, Sparkles } from "lucide-react";

const SignUpPage: React.FC = () => {
  const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';
  const navigate = useNavigate();

  // Local signup form state (used when Clerk is not configured)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleLocalSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!email || !password) {
      setMessage({ type: 'error', text: 'Email and password are required' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data?.error || 'Signup failed' });
      } else {
        setMessage({ type: 'success', text: '✓ Account created successfully!' });
        setTimeout(() => {
          navigate('/signin');
        }, 2000);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error - please try again' });
    } finally {
      setLoading(false);
    }
  };

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
            <p className="mt-2 text-sm text-gray-500 font-semibold">
              🗣️ Create Your Account
            </p>
          </div>

          {/* Clerk Sign Up Component */}
          <div className="rounded-3xl bg-white/60 backdrop-blur-xl p-6 shadow-2xl border border-white/50">
            <SignUp
              path="/signup"
              routing="path"
              signInUrl="/signin"
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

  // Fallback local signup form (useful for testing without Clerk)
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

        {/* Signup Card */}
        <div className="rounded-3xl bg-white/60 backdrop-blur-xl p-8 shadow-2xl border border-white/50 transition-all duration-500 hover:shadow-purple-500/20">
          <div className="mb-6 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 mb-3 shadow-lg">
              <UserPlus className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800">Get Started</h2>
            <p className="text-gray-500 mt-1">Create your account today</p>
          </div>

          {/* Message Alert */}
          {message && (
            <div className={`mb-4 p-4 rounded-xl font-semibold text-sm transition-all duration-500 ${
              message.type === 'success' 
                ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-2 border-green-300' 
                : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border-2 border-red-300'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleLocalSignup} className="space-y-5">
            {/* Name Input */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  type="text"
                  placeholder="Enter your name"
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 bg-white/80 backdrop-blur-sm font-medium"
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="your.email@example.com"
                  required
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="Create a strong password"
                  required
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 bg-white/80 backdrop-blur-sm font-medium"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Account...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Create Account
                </span>
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/signin')}
                className="font-bold text-purple-600 hover:text-blue-600 transition-colors duration-300 hover:underline"
              >
                Sign In
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

export default SignUpPage;
