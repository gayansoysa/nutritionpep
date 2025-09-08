"use client";

import { useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const profileFormSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
  units: z.enum(["metric", "imperial"]),
  locale: z.string().min(1, "Locale is required"),
  timezone: z.string().min(1, "Timezone is required"),
});

const biometricsFormSchema = z.object({
  weight_kg: z.coerce.number().min(30).max(300),
  height_cm: z.coerce.number().min(100).max(250),
  body_fat_pct: z.coerce.number().min(0).max(50).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type BiometricsFormValues = z.infer<typeof biometricsFormSchema>;

interface ProfileSettingsProps {
  profile: any;
  biometrics: any;
  userEmail?: string;
}

export default function ProfileSettings({ profile, biometrics, userEmail }: ProfileSettingsProps) {
  const supabase = createClientComponentClient();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingBiometrics, setIsUpdatingBiometrics] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      full_name: profile?.full_name || "",
      units: profile?.units || "metric",
      locale: profile?.locale || "en-US",
      timezone: profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });

  const biometricsForm = useForm<any>({
    // resolver: zodResolver(biometricsFormSchema),
    defaultValues: {
      weight_kg: biometrics?.weight_kg || 70,
      height_cm: biometrics?.height_cm || 170,
      body_fat_pct: biometrics?.body_fat_pct || undefined,
    },
  });

  async function onUpdateProfile(data: ProfileFormValues) {
    setIsUpdatingProfile(true);
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update(data)
        .eq("id", profile.id);

      if (error) {
        throw error;
      }

      toast.success("Profile updated successfully");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile: " + error.message);
    } finally {
      setIsUpdatingProfile(false);
    }
  }

  async function onUpdateBiometrics(data: BiometricsFormValues) {
    setIsUpdatingBiometrics(true);
    
    try {
      const { error } = await supabase.from("biometrics").insert({
        user_id: profile.id,
        ts: new Date().toISOString(),
        ...data,
      });

      if (error) {
        throw error;
      }

      // Recalculate targets with new biometrics
      await supabase.functions.invoke('calc-targets', {
        body: { user_id: profile.id }
      });

      toast.success("Biometrics updated successfully");
    } catch (error: any) {
      console.error("Error updating biometrics:", error);
      toast.error("Failed to update biometrics: " + error.message);
    } finally {
      setIsUpdatingBiometrics(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Account Info */}
      <div>
        <h3 className="text-lg font-medium">Account Information</h3>
        <div className="mt-2 space-y-2">
          <div className="text-sm">
            <span className="font-medium">Email:</span> {userEmail}
          </div>
          <div className="text-sm">
            <span className="font-medium">Account ID:</span> {profile?.id}
          </div>
        </div>
      </div>

      <Separator />

      {/* Profile Form */}
      <div>
        <h3 className="text-lg font-medium">Profile Settings</h3>
        <Form {...profileForm}>
          <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="mt-4 space-y-4">
            <FormField
              control={profileForm.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={profileForm.control}
                name="units"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Units</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="metric">Metric (kg, cm)</SelectItem>
                        <SelectItem value="imperial">Imperial (lbs, ft/in)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={profileForm.control}
                name="locale"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="en-US">English (US)</SelectItem>
                        <SelectItem value="en-GB">English (UK)</SelectItem>
                        <SelectItem value="es-ES">Español</SelectItem>
                        <SelectItem value="fr-FR">Français</SelectItem>
                        <SelectItem value="de-DE">Deutsch</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={profileForm.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timezone</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    Your current timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isUpdatingProfile}>
              {isUpdatingProfile ? "Updating..." : "Update Profile"}
            </Button>
          </form>
        </Form>
      </div>

      <Separator />

      {/* Biometrics Form */}
      <div>
        <h3 className="text-lg font-medium">Current Measurements</h3>
        <Form {...biometricsForm}>
          <form onSubmit={biometricsForm.handleSubmit(onUpdateBiometrics)} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={biometricsForm.control}
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
                control={biometricsForm.control}
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

            <FormField
              control={biometricsForm.control}
              name="body_fat_pct"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Body Fat % (optional)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" {...field} />
                  </FormControl>
                  <FormDescription>
                    If provided, we'll use a more accurate formula for calculating your targets
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isUpdatingBiometrics}>
              {isUpdatingBiometrics ? "Updating..." : "Update Measurements"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}