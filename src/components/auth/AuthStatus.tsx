"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, LogOut, Settings } from "lucide-react";

interface AuthStatusProps {
  showDetails?: boolean;
}

export default function AuthStatus({ showDetails = false }: AuthStatusProps) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    checkAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        checkAuth();
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        setProfile(profile);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error("Auth check error:", error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (loading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Not signed in</span>
        <Button size="sm" onClick={() => window.location.href = "/login"}>
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        <User className="h-4 w-4" />
        <span className="text-sm">
          {profile?.full_name || user.email?.split('@')[0] || 'User'}
        </span>
        {profile?.role && (
          <Badge variant={profile.role === 'admin' ? 'destructive' : 'secondary'}>
            {profile.role}
          </Badge>
        )}
      </div>
      
      {showDetails && (
        <div className="text-xs text-muted-foreground">
          {user.email}
        </div>
      )}
      
      <div className="flex items-center gap-1">
        <Button size="sm" variant="ghost" onClick={() => window.location.href = "/debug-auth"}>
          <Settings className="h-3 w-3" />
        </Button>
        <Button size="sm" variant="ghost" onClick={signOut}>
          <LogOut className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}