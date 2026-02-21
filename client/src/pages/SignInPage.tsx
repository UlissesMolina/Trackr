import { SignIn } from "@clerk/clerk-react";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-primary">
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" forceRedirectUrl="/dashboard" appearance={{ variables: { colorBackground: "#131316", colorText: "#ededef", colorPrimary: "#6366f1", colorInputBackground: "#1a1a1f", colorInputText: "#ededef" } }} />
    </div>
  );
}
