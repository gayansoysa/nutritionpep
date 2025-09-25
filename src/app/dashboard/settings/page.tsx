import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import ProfileSettings from "./ProfileSettings";
import GoalsSettings from "./GoalsSettings";
import PrivacySettings from "./PrivacySettings";
import ThemeSettings from "./ThemeSettings";

export default async function SettingsPage() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get latest biometrics
  const { data: biometrics } = await supabase
    .from("biometrics")
    .select("*")
    .eq("user_id", user.id)
    .order("ts", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Get current goals
  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileSettings 
              profile={profile} 
              biometrics={biometrics}
              userEmail={user.email}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Goals & Targets</CardTitle>
          </CardHeader>
          <CardContent>
            <GoalsSettings goals={goals} />
          </CardContent>
        </Card>

        <ThemeSettings />

        <Card>
          <CardHeader>
            <CardTitle>Privacy & Data</CardTitle>
          </CardHeader>
          <CardContent>
            <PrivacySettings profile={profile} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}