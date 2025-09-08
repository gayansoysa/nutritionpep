import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Test endpoint to check authentication
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseRouteHandlerClient();

    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session error:", sessionError);
      return NextResponse.json({ 
        authenticated: false, 
        error: sessionError.message 
      });
    }

    if (!session) {
      return NextResponse.json({ 
        authenticated: false, 
        message: "No session found" 
      });
    }

    return NextResponse.json({ 
      authenticated: true, 
      user: {
        id: session.user.id,
        email: session.user.email
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