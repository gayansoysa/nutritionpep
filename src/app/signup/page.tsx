"use client";

import * as React from "react";
import { LoginForm } from "@/components/login-form";

export default function SignupPage() {
  const [mode, setMode] = React.useState<"signin" | "signup">("signup");

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <LoginForm mode={mode} onModeChange={setMode} />
      </div>
    </div>
  );
}