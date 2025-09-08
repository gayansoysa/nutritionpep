import { NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
	const supabase = await createSupabaseRouteHandlerClient();
	const { id } = await params;
	// If id corresponds to an entry id, delete the whole entry (fallback)
	await supabase.from("diary_entries").delete().eq("id", id);
	return NextResponse.json({ ok: true });
}

