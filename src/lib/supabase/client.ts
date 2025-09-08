"use client";

import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
	const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;

	if (!url || !anon) {
		throw new Error(
			"Supabase configuration missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
		);
	}

	try {
		const parsed = new URL(url);
		if (!parsed.protocol.startsWith("http")) {
			throw new Error("Invalid protocol");
		}
	} catch {
		throw new Error(
			`Invalid NEXT_PUBLIC_SUPABASE_URL: "${url}". Expected format: https://<ref>.supabase.co`
		);
	}

	return createBrowserClient(url, anon);
}