import { SignUp } from "@clerk/clerk-react";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-primary">
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" forceRedirectUrl="/dashboard" appearance={{ variables: { colorBackground: "#131316", colorText: "#ededef", colorPrimary: "#6366f1", colorInputBackground: "#1a1a1f", colorInputText: "#ededef" } }} />
    </div>
  );
}
