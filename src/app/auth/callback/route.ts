import { NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
	const { searchParams, origin } = new URL(request.url);
	const code = searchParams.get('code');
	const next = searchParams.get('next') ?? '/';

	if (code) {
		const supabase = await createSupabaseRouteHandlerClient();
		try {
			const { error } = await supabase.auth.exchangeCodeForSession(code);
			if (!error) {
				return NextResponse.redirect(new URL(next, origin));
			}
		} catch (e) {
			console.error('Error exchanging code for session:', e);
		}
	}

	// Return the user to an error page with instructions
	return NextResponse.redirect(new URL('/auth/error', origin));
}