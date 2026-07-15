import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { useAuth } from "@/hooks/use-auth";
import logo from "@/assets/logo.svg";
import { ArrowRight, Loader2, Mail, Lock, User } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useMutation } from "@/hooks/use-convex-auth";
import { api } from "@/convex/_generated/api";

interface AuthProps {
  redirectAfterAuth?: string;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginMutation = useMutation(api.authActions.login);
  const registerMutation = useMutation(api.authActions.register);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const redirect = redirectAfterAuth || "/";
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirectAfterAuth]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      const name = formData.get("name") as string;

      let result;
      if (isRegistering) {
        result = await registerMutation({ email, password, name });
      } else {
        result = await loginMutation({ email, password });
      }

      // Automatically sign in the user
      signIn(result.token);

      const redirect = redirectAfterAuth || "/";
      navigate(redirect);
    } catch (error: any) {
      console.error("Auth error:", error);
      setError(error.message || "An error occurred during authentication.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Video (Only on Login Page) */}
      <video id="bg-video" autoPlay loop muted playsInline>
        <source src="/bg.mp4" type="video/mp4" />
      </video>
      <div className="bg-overlay"></div>

      {/* Dynamic Moving Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] bg-primary/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[30vw] h-[30vw] bg-destructive/20 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s', animationDuration: '4s' }}></div>
        <div className="absolute top-[40%] right-[30%] w-[20vw] h-[20vw] bg-accent/20 rounded-full blur-[60px] animate-pulse" style={{ animationDelay: '1s', animationDuration: '5s' }}></div>
      </div>

      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className="flex items-center justify-center h-full flex-col w-full px-4">
        <Card className="w-full max-w-sm pb-0 border shadow-md">
          <CardHeader className="text-center">
            <div className="flex justify-center">
              <img
                src={logo}
                alt="Logo"
                width={64}
                height={64}
                className="rounded-lg mb-4 mt-4 cursor-pointer"
                onClick={() => navigate("/")}
              />
            </div>
            <CardTitle className="text-xl">{isRegistering ? "Create an Account" : "Welcome Back"}</CardTitle>
            <CardDescription>
              {isRegistering ? "Enter your details to register" : "Enter your email and password to log in"}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              
              {isRegistering && (
                <div className="relative flex-1">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    name="name"
                    placeholder="Full Name"
                    type="text"
                    className="pl-9"
                    disabled={isLoading}
                    required={isRegistering}
                  />
                </div>
              )}

              <div className="relative flex-1">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  name="email"
                  placeholder="name@example.com"
                  type="email"
                  className="pl-9"
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="relative flex-1">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  name="password"
                  placeholder="Password"
                  type="password"
                  className="pl-9"
                  disabled={isLoading}
                  required
                />
              </div>

              {error && (
                <p className="mt-2 text-sm text-red-500 text-center">{error}</p>
              )}
              
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <>{isRegistering ? "Register" : "Login"} <ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError(null);
                }}
                disabled={isLoading}
                className="w-full"
              >
                {isRegistering ? "Already have an account? Login" : "Need an account? Register"}
              </Button>
            </CardFooter>
          </form>

          <div className="py-4 px-6 text-xs text-center text-muted-foreground bg-muted border-t rounded-b-lg">
            Secured by Custom Native Auth
          </div>
        </Card>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
