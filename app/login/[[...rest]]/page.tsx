import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <SignIn
        signUpUrl="/register"
        fallbackRedirectUrl="/dashboard"
        appearance={{
          variables: {
            colorPrimary: "#7b2fff",
            colorBackground: "#0a0a12",
            colorText: "#f0f0ff",
            colorInputBackground: "#0f0f1a",
            fontFamily: "Satoshi, sans-serif",
          },
        }}
      />
    </div>
  );
}
