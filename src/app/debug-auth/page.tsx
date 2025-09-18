"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "@/lib/utils/toast";

export default function DebugAuthPage() {
  const [authState, setAuthState] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createSupabaseBrowserClient();

  const checkAuth = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("🔍 Starting authentication check...");
      
      // Check 1: Get User
      const { data: userData, error: userError } = await supabase.auth.getUser();
      console.log("👤 getUser result:", { userData, userError });
      
      // Check 2: Get Session (for comparison - this is the deprecated method)
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log("🔐 getSession result (deprecated):", { sessionData, sessionError });
      
      // Check 3: Get Profile (if user exists)
      let profileData = null;
      let profileError = null;
      
      if (userData.user) {
        const result = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userData.user.id)
          .single();
        
        profileData = result.data;
        profileError = result.error;
        console.log("📝 Profile result:", { profileData, profileError });
        
        // If profile doesn't exist, try to create it automatically
        if (profileError?.code === 'PGRST116') {
          console.log("🔧 Profile not found, attempting to create...");
          const { error: createError } = await supabase
            .from("profiles")
            .insert({
              id: userData.user.id,
              full_name: userData.user.user_metadata?.full_name || 
                        userData.user.user_metadata?.name || 
                        userData.user.email?.split('@')[0] || 'User',
              role: 'user'
            });
          
          if (!createError) {
            // Refetch the profile
            const retryResult = await supabase
              .from("profiles")
              .select("*")
              .eq("id", userData.user.id)
              .single();
            
            profileData = retryResult.data;
            profileError = retryResult.error;
            console.log("✅ Profile created successfully:", { profileData });
          } else {
            console.error("❌ Failed to create profile:", createError);
          }
        }
      }
      
      setAuthState({
        user: userData.user,
        userError,
        session: sessionData.session,
        sessionError,
        profile: profileData,
        profileError,
        timestamp: new Date().toISOString()
      });
      
    } catch (err: any) {
      console.error("❌ Auth check failed:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth/signin";
  };

  const refreshAuth = async () => {
    await supabase.auth.refreshSession();
    checkAuth();
  };

  const syncAuthUsers = async () => {
    try {
      const { error } = await supabase.rpc('sync_existing_auth_users');
      if (error) throw error;
      toast.success("Successfully synced auth users with profiles");
      checkAuth();
    } catch (error: any) {
      console.error("Error syncing users:", error);
      toast.error(`Failed to sync users: ${error.message}`);
    }
  };

  const promoteToAdmin = async () => {
    if (!authState?.user?.email) {
      toast.error("No user email found");
      return;
    }
    
    try {
      const { error } = await supabase.rpc('promote_user_to_admin', {
        user_email: authState.user.email
      });
      if (error) throw error;
      toast.success("Successfully promoted to admin");
      checkAuth();
    } catch (error: any) {
      console.error("Error promoting user:", error);
      toast.error(`Failed to promote user: ${error.message}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Authentication Debug</h1>
        <p className="text-muted-foreground">
          Debug authentication state and session information
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Authentication Status
            </CardTitle>
            <CardDescription>
              Current authentication state and session information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={checkAuth} disabled={isLoading}>
                  {isLoading ? "Checking..." : "Refresh Check"}
                </Button>
                <Button onClick={refreshAuth} variant="outline">
                  Refresh Session
                </Button>
                <Button onClick={syncAuthUsers} variant="secondary">
                  Sync Auth Users
                </Button>
                <Button onClick={signOut} variant="destructive">
                  Sign Out & Redirect
                </Button>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center gap-2 text-red-800">
                    <XCircle className="h-4 w-4" />
                    <span className="font-medium">Error</span>
                  </div>
                  <p className="text-red-700 mt-1">{error}</p>
                </div>
              )}

              {authState && (
                <div className="space-y-4">
                  {/* User Status */}
                  <div className="p-4 border rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      {authState.user ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="font-medium">User Authentication</span>
                    </div>
                    
                    {authState.user ? (
                      <div className="space-y-1 text-sm">
                        <p><strong>Email:</strong> {authState.user.email}</p>
                        <p><strong>ID:</strong> {authState.user.id}</p>
                        <p><strong>Created:</strong> {new Date(authState.user.created_at).toLocaleString()}</p>
                        <p><strong>Last Sign In:</strong> {authState.user.last_sign_in_at ? new Date(authState.user.last_sign_in_at).toLocaleString() : 'Never'}</p>
                        <p><strong>Email Confirmed:</strong> {authState.user.email_confirmed_at ? 'Yes' : 'No'}</p>
                      </div>
                    ) : (
                      <div className="text-sm text-red-600">
                        <p>No user found</p>
                        {authState.userError && (
                          <p><strong>Error:</strong> {authState.userError.message}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Session Status */}
                  <div className="p-4 border rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      {authState.session ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="font-medium">Session</span>
                    </div>
                    
                    {authState.session ? (
                      <div className="space-y-1 text-sm">
                        <p><strong>Access Token:</strong> {authState.session.access_token ? 'Present' : 'Missing'}</p>
                        <p><strong>Refresh Token:</strong> {authState.session.refresh_token ? 'Present' : 'Missing'}</p>
                        <p><strong>Expires At:</strong> {authState.session.expires_at ? new Date(authState.session.expires_at * 1000).toLocaleString() : 'Unknown'}</p>
                        <p><strong>Token Type:</strong> {authState.session.token_type}</p>
                      </div>
                    ) : (
                      <div className="text-sm text-red-600">
                        <p>No active session</p>
                        {authState.sessionError && (
                          <p><strong>Error:</strong> {authState.sessionError.message}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Profile Status */}
                  <div className="p-4 border rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      {authState.profile ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="font-medium">User Profile</span>
                    </div>
                    
                    {authState.profile ? (
                      <div className="space-y-1 text-sm">
                        <p><strong>Name:</strong> {authState.profile.full_name || 'Not set'}</p>
                        <p><strong>Role:</strong> 
                          <Badge className={`ml-2 ${
                            authState.profile.role === 'admin' ? 'bg-red-600' :
                            authState.profile.role === 'moderator' ? 'bg-amber-600' : 
                            'bg-gray-600'
                          }`}>
                            {authState.profile.role || 'user'}
                          </Badge>
                        </p>
                        <p><strong>Created:</strong> {new Date(authState.profile.created_at).toLocaleString()}</p>
                        <p><strong>Updated:</strong> {new Date(authState.profile.updated_at).toLocaleString()}</p>
                      </div>
                    ) : (
                      <div className="text-sm text-red-600">
                        <p>No profile found</p>
                        {authState.profileError && (
                          <p><strong>Error:</strong> {authState.profileError.message}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Admin Access Check */}
                  <div className="p-4 border rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      {authState.user && authState.profile && (authState.profile.role === 'admin' || authState.profile.role === 'moderator') ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                      )}
                      <span className="font-medium">Admin Access</span>
                    </div>
                    
                    {authState.user && authState.profile && (authState.profile.role === 'admin' || authState.profile.role === 'moderator') ? (
                      <div className="text-sm text-green-600">
                        <p>✅ You have admin access!</p>
                        <Button 
                          className="mt-2" 
                          onClick={() => window.location.href = '/admin/users'}
                        >
                          Go to Admin Panel
                        </Button>
                      </div>
                    ) : (
                      <div className="text-sm text-amber-600">
                        <p>⚠️ Admin access not available</p>
                        <p>Current role: {authState.profile?.role || 'none'}</p>
                        {authState.user && (
                          <Button 
                            className="mt-2" 
                            size="sm"
                            onClick={promoteToAdmin}
                          >
                            Promote to Admin
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Last checked: {authState.timestamp}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}