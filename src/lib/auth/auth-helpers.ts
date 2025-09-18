import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export async function getCurrentUser() {
  const supabase = createSupabaseBrowserClient();
  
  try {
    // First try to get user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error("Auth error:", userError);
      return { user: null, profile: null, error: userError };
    }
    
    if (!userData.user) {
      return { user: null, profile: null, error: new Error("No authenticated user found") };
    }
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userData.user.id)
      .single();
    
    if (profileError) {
      console.error("Profile error:", profileError);
      
      // If profile doesn't exist, try to create it
      if (profileError.code === 'PGRST116') {
        const { error: createError } = await supabase
          .from("profiles")
          .insert({
            id: userData.user.id,
            full_name: userData.user.user_metadata?.full_name || 
                      userData.user.user_metadata?.name || 
                      userData.user.email?.split('@')[0] || 'User',
            role: 'user'
          });
        
        if (createError) {
          console.error("Failed to create profile:", createError);
          return { user: userData.user, profile: null, error: createError };
        }
        
        // Fetch the newly created profile
        const { data: newProfile, error: newProfileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userData.user.id)
          .single();
        
        return { user: userData.user, profile: newProfile, error: newProfileError };
      }
      
      return { user: userData.user, profile: null, error: profileError };
    }
    
    return { user: userData.user, profile, error: null };
  } catch (error) {
    console.error("Unexpected auth error:", error);
    return { user: null, profile: null, error: error as Error };
  }
}

export async function requireAuth() {
  const { user, profile, error } = await getCurrentUser();
  
  if (error || !user) {
    throw new Error("Authentication required");
  }
  
  return { user, profile };
}

export async function requireAdmin() {
  const { user, profile } = await requireAuth();
  
  if (!profile || (profile.role !== 'admin' && profile.role !== 'moderator')) {
    throw new Error(`Admin access required. Current role: ${profile?.role || 'none'}`);
  }
  
  return { user, profile };
}