"use client";

import * as React from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton() {
	const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
	const [loading, setLoading] = React.useState(false);

	const signOut = async () => {
		setLoading(true);
		try {
			await supabase.auth.signOut();
			window.location.href = "/";
		} finally {
			setLoading(false);
		}
	};

	return (
		<button
			className="text-sm underline disabled:opacity-60"
			disabled={loading}
			onClick={signOut}
		>
			{loading ? "Signing out..." : "Sign out"}
		</button>
	);
}

