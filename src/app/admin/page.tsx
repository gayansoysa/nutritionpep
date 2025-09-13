import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@radix-ui/react-icons";
import FoodsList from "./components/FoodsList";
import UsersList from "./components/UsersList";
import AnalyticsDashboard from "./components/AnalyticsDashboard";

export default async function AdminPage() {
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

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (!profile || (profile.role !== "admin" && profile.role !== "moderator")) {
    redirect("/dashboard");
  }

  // Get counts for dashboard
  const { count: foodsCount } = await supabase
    .from("foods")
    .select("*", { count: "exact", head: true });

  const { count: usersCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const { count: entriesCount } = await supabase
    .from("diary_entries")
    .select("*", { count: "exact", head: true });

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Overview</h1>
          <p className="text-gray-600 mt-1">Monitor your nutrition app's performance and data</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href="/admin/external-apis">
              External APIs
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/admin/import">
              Import from OFF
            </a>
          </Button>
          <Button asChild>
            <a href="/admin/foods/new">
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Food
            </a>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Foods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{foodsCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Diary Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{entriesCount || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="foods">
        <TabsList>
          <TabsTrigger value="foods">Foods</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="foods" className="mt-4">
          <FoodsList />
        </TabsContent>
        <TabsContent value="users" className="mt-4">
          <UsersList />
        </TabsContent>
        <TabsContent value="analytics" className="mt-4">
          <AnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}