"use client";

import { MigrationWizard } from "@/components/onboarding/migration-wizard";
import { useRouter } from "next/navigation";

export default function MigrationPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <MigrationWizard 
        onBack={() => router.push("/onboarding")} 
        onNext={() => console.log("Next")}
        onSkip={() => router.push("/")}
      />
    </div>
  );
}
