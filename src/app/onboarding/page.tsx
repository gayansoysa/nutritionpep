import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  PersonIcon, 
  RulerHorizontalIcon, 
  TargetIcon 
} from "@radix-ui/react-icons";

export default function OnboardingPage() {
  // Redirect to first step
  redirect("/onboarding/profile");
  
  // This code won't run due to the redirect, but it's here for completeness
  const steps = [
    {
      id: "profile",
      title: "Profile",
      description: "Set your preferences and units",
      icon: <PersonIcon className="h-5 w-5" />,
      href: "/onboarding/profile",
    },
    {
      id: "biometrics",
      title: "Biometrics",
      description: "Enter your height, weight, and other measurements",
      icon: <RulerHorizontalIcon className="h-5 w-5" />,
      href: "/onboarding/biometrics",
    },
    {
      id: "goals",
      title: "Goals",
      description: "Define your nutrition and fitness goals",
      icon: <TargetIcon className="h-5 w-5" />,
      href: "/onboarding/goals",
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Complete Your Profile</h2>
      <p className="text-muted-foreground">
        Please complete these steps to personalize your experience
      </p>
      
      <div className="space-y-4">
        {steps.map((step) => (
          <Card key={step.id}>
            <CardContent className="p-4 flex items-center">
              <div className="bg-primary/10 p-2 rounded-full mr-4">
                {step.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
              <Button asChild>
                <a href={step.href}>Start</a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}