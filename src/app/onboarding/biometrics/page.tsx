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
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const biometricsFormSchema = z.object({
  weight_kg: z.coerce.number().positive({
    message: "Weight must be a positive number.",
  }),
  height_cm: z.coerce.number().positive({
    message: "Height must be a positive number.",
  }),
  body_fat_pct: z.coerce.number().min(0).max(100).optional(),
  age: z.coerce.number().int().min(18).max(120),
  gender: z.enum(["male", "female", "other"]),
});

type BiometricsFormValues = z.infer<typeof biometricsFormSchema>;

export default function BiometricsPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<any>({
    // resolver: zodResolver(biometricsFormSchema),
    defaultValues: {
      weight_kg: 70,
      height_cm: 170,
      age: 30,
      gender: "male",
    },
  });

  async function onSubmit(data: BiometricsFormValues) {
    setIsSubmitting(true);
    
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      const { error } = await supabase.from("biometrics").insert({
        user_id: userId,
        weight_kg: data.weight_kg,
        height_cm: data.height_cm,
        body_fat_pct: data.body_fat_pct,
        measurements: {
          age: data.age,
          gender: data.gender,
        },
      });

      if (error) {
        throw error;
      }

      toast.success("Biometrics saved successfully");
      router.push("/onboarding/goals");
    } catch (error: any) {
      toast.error("Failed to save biometrics: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Biometrics</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="weight_kg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="height_cm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Height (cm)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="body_fat_pct"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Body Fat % (optional)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" {...field} />
                  </FormControl>
                  <FormDescription>
                    If known, this helps calculate more accurate targets
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-between">
              <Button variant="outline" type="button" onClick={() => router.back()}>
                Back
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Continue"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}