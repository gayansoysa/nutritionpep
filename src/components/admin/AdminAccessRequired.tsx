"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Shield, Copy, CheckCircle, AlertTriangle, User } from "lucide-react";
import { toast } from 'sonner';

interface AdminAccessRequiredProps {
  userEmail?: string;
  currentRole?: string;
}

export default function AdminAccessRequired({ userEmail, currentRole }: AdminAccessRequiredProps) {
  const [email, setEmail] = useState(userEmail || "");
  const [role, setRole] = useState(currentRole || "");
  const [isLoading, setIsLoading] = useState(!userEmail);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    if (!userEmail) {
      fetchUserInfo();
    }
  }, [userEmail]);

  const fetchUserInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
      }

      if (user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        
        setRole(profile?.role || "user");
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("SQL command copied to clipboard!");
  };

  const sqlCommand = `-- Promote ${email} to admin
UPDATE public.profiles 
SET role = 'admin'::public.user_role,
    updated_at = NOW()
WHERE id = (
    SELECT au.id 
    FROM auth.users au 
    WHERE au.email = '${email}'
);

-- Verify the update worked
SELECT 
    au.email,
    p.id,
    p.full_name,
    p.role,
    p.updated_at
FROM auth.users au
JOIN public.profiles p ON au.id = p.id
WHERE au.email = '${email}';`;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <Shield className="h-8 w-8 text-orange-500" />
            <h1 className="text-3xl font-bold">Admin Access Required</h1>
          </div>
          <p className="text-muted-foreground">
            You need administrator privileges to access this section
          </p>
        </div>

        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Current Account Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Email:</span>
              <span className="text-muted-foreground">{email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Current Role:</span>
              <Badge variant={role === "admin" ? "default" : role === "moderator" ? "secondary" : "outline"}>
                {role || "user"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Admin Access:</span>
              <div className="flex items-center space-x-2">
                {role === "admin" || role === "moderator" ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-600">Granted</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="text-orange-600">Denied</span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Admin Access</CardTitle>
            <CardDescription>
              Follow these steps to promote your account to administrator
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <p className="font-medium">Go to your Supabase Dashboard</p>
                  <p className="text-sm text-muted-foreground">
                    Navigate to your project's Supabase dashboard
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium">Open SQL Editor</p>
                  <p className="text-sm text-muted-foreground">
                    Click on "SQL Editor" in the left sidebar
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-medium">Run the SQL Command</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Copy and paste this SQL command, then click "Run"
                  </p>
                  
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                      <code>{sqlCommand}</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(sqlCommand)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                  4
                </div>
                <div>
                  <p className="font-medium">Refresh this page</p>
                  <p className="text-sm text-muted-foreground">
                    After running the SQL command, refresh this page to access the admin panel
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> Only run this SQL command if you are the application owner. 
            Admin privileges grant full access to user data and system settings.
          </AlertDescription>
        </Alert>

        {/* Refresh Button */}
        <div className="text-center">
          <Button onClick={() => window.location.reload()} size="lg">
            <CheckCircle className="h-4 w-4 mr-2" />
            I've Run the SQL Command - Refresh Page
          </Button>
        </div>
      </div>
    </div>
  );
}