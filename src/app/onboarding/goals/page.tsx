"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const goalsFormSchema = z.object({
  activity_level: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
  goal_type: z.enum(["lose", "maintain", "gain"]),
  pace: z.enum(["slow", "moderate", "fast"]).optional(),
  protein_g_per_kg: z.coerce.number().min(0.5).max(3).default(1.6),
  fat_g_per_kg: z.coerce.number().min(0.5).max(2).default(0.8),
});

type GoalsFormValues = z.infer<typeof goalsFormSchema>;

export default function GoalsPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<any>({
    // resolver: zodResolver(goalsFormSchema),
    defaultValues: {
      activity_level: "moderate",
      goal_type: "maintain",
      protein_g_per_kg: 1.6,
      fat_g_per_kg: 0.8,
    },
  });

  const watchGoalType = form.watch("goal_type");

  async function onSubmit(data: GoalsFormValues) {
    setIsSubmitting(true);
    
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      // Insert goals
      const { error: goalsError } = await supabase.from("goals").insert({
        user_id: userId,
        activity_level: data.activity_level,
        goal_type: data.goal_type,
        pace: data.pace || "moderate",
        protein_strategy: "g_per_kg",
        protein_g_per_kg: data.protein_g_per_kg,
        fat_g_per_kg: data.fat_g_per_kg,
        carb_strategy: "remainder",
      });

      if (goalsError) {
        throw goalsError;
      }

      // Calculate targets using edge function
      const { data: targetsResult, error: targetsError } = await supabase.functions.invoke('calc-targets', {
        body: { user_id: userId }
      });

      if (targetsError) {
        throw new Error(`Failed to calculate targets: ${targetsError.message}`);
      }

      // Mark onboarding as completed
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", userId);

      if (profileError) {
        throw profileError;
      }

      toast.success("Goals saved successfully");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error("Failed to save goals: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Goals</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="activity_level"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Activity Level</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="sedentary" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Sedentary (little to no exercise)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="light" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Light (light exercise 1-3 days/week)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="moderate" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Moderate (moderate exercise 3-5 days/week)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="active" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Active (hard exercise 6-7 days/week)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="very_active" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Very Active (hard daily exercise & physical job)
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="goal_type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Goal</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="lose" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Lose Weight
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="maintain" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Maintain Weight
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="gain" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Gain Weight
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {watchGoalType !== "maintain" && (
              <FormField
                control={form.control}
                name="pace"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Pace</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="slow" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Slow ({watchGoalType === "lose" ? "0.25kg/week" : "0.25kg/week"})
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="moderate" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Moderate ({watchGoalType === "lose" ? "0.5kg/week" : "0.5kg/week"})
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="fast" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Fast ({watchGoalType === "lose" ? "1kg/week" : "0.75kg/week"})
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="protein_g_per_kg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Protein (g/kg)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} />
                    </FormControl>
                    <FormDescription>
                      Recommended: 1.6-2.2 g/kg
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="fat_g_per_kg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fat (g/kg)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} />
                    </FormControl>
                    <FormDescription>
                      Recommended: 0.8-1.2 g/kg
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" type="button" onClick={() => router.back()}>
                Back
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Complete Setup"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}