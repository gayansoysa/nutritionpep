import { NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
	const supabase = await createSupabaseRouteHandlerClient();
	try {
		await supabase.auth.exchangeCodeForSession(request.url);
	} catch (e) {
		// no-op: allow idempotent redirects if already exchanged
	}
	return NextResponse.redirect(new URL("/", request.url));
}