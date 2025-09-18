import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Test endpoint to check authentication
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseRouteHandlerClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error("Session error:", userError);
      return NextResponse.json({ 
        authenticated: false, 
        error: userError.message 
      });
    }

    if (!user) {
      return NextResponse.json({ 
        authenticated: false, 
        message: "No user found" 
      });
    }

    return NextResponse.json({ 
      authenticated: true, 
      user: {
        id: user.id,
        email: user.email
      }
    });

  } catch (error) {
    console.error("Error in test-auth:", error);
    return NextResponse.json({ 
      authenticated: false, 
      error: "Internal server error" 
    }, { status: 500 });
  }
}