"use client";

import * as React from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
	const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);

	const [email, setEmail] = React.useState("");
	const [password, setPassword] = React.useState("");
	const [mode, setMode] = React.useState<"signin" | "signup">("signin");
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);

	const signInWithGoogle = async () => {
		await supabase.auth.signInWithOAuth({
			provider: "google",
			options: { redirectTo: `${window.location.origin}/auth/callback` },
		});
	};

	const submitEmailPassword = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);
		try {
			if (mode === "signin") {
				const { error: signInError } = await supabase.auth.signInWithPassword({
					email,
					password,
				});
				if (signInError) throw signInError;
			} else {
				const { error: signUpError } = await supabase.auth.signUp({
					email,
					password,
					options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
				});
				if (signUpError) throw signUpError;
			}
			window.location.href = "/";
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : "Something went wrong";
			setError(message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center p-6">
			<div className="max-w-sm w-full space-y-4 text-center">
				<h1 className="text-2xl font-semibold">Welcome to nutritionpep</h1>
				<p className="text-sm text-gray-600">Sign in to continue</p>

				{error ? (
					<div className="text-sm text-red-600" role="alert">
						{error}
					</div>
				) : null}

				<form className="space-y-3 text-left" onSubmit={submitEmailPassword}>
					<div className="space-y-1">
						<label className="text-sm" htmlFor="email">Email</label>
						<input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							className="w-full h-10 px-3 border rounded"
							placeholder="you@example.com"
						/>
					</div>
					<div className="space-y-1">
						<label className="text-sm" htmlFor="password">Password</label>
						<input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							className="w-full h-10 px-3 border rounded"
							placeholder="••••••••"
						/>
					</div>
					<button
						type="submit"
						disabled={loading}
						className="w-full h-10 rounded bg-black text-white hover:opacity-90 disabled:opacity-60"
					>
						{mode === "signin" ? (loading ? "Signing in..." : "Sign in") : (loading ? "Creating account..." : "Sign up")}
					</button>
				</form>

				<button
					className="w-full h-10 rounded border border-gray-300 hover:bg-gray-50"
					onClick={signInWithGoogle}
				>
					Continue with Google
				</button>

				<p className="text-sm text-gray-600">
					{mode === "signin" ? "Don't have an account?" : "Already have an account?"} {" "}
					<button
						className="underline"
						onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
					>
						{mode === "signin" ? "Sign up" : "Sign in"}
					</button>
				</p>
			</div>
		</div>
	);
}