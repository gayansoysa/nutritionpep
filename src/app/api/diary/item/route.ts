import { NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

export async function DELETE(request: Request) {
	const { searchParams } = new URL(request.url);
	const entry = searchParams.get("entry");
	const item = searchParams.get("item");
	
	console.log("DELETE /api/diary/item", { entry, item });
	
	if (!entry || !item) {
		console.error("Missing entry or item ID", { entry, item });
		return NextResponse.json({ error: "entry and item required" }, { status: 400 });
	}
	
	try {
		const supabase = await createSupabaseRouteHandlerClient();
		
		// First check if the entry exists and what's in it
		const { data: entryData, error: entryError } = await supabase
			.from("diary_entries")
			.select("id, items")
			.eq("id", entry)
			.single();
			
		if (entryError) {
			console.error("Error fetching entry", entryError);
			return NextResponse.json({ error: "Entry not found" }, { status: 404 });
		}
		
		console.log("Entry found", { 
			id: entryData.id, 
			itemsCount: (entryData.items || []).length,
			items: entryData.items
		});
		
		// Now try to remove the item
		const { data: removed, error: removeError } = await supabase.rpc(
			"remove_diary_item", 
			{ p_entry_id: entry, p_item_id: item }
		);
		
		if (removeError) {
			console.error("Error removing item", removeError);
			return NextResponse.json({ error: removeError.message }, { status: 500 });
		}
		
		console.log("Item removal result", { removed });
		
		return NextResponse.json({ ok: true, removed });
	} catch (err) {
		console.error("Unexpected error in DELETE /api/diary/item", err);
		return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
	}
}

export async function POST(request: Request) {
	const body = await request.json();
	const { date, meal, item, totals } = body || {};
	if (!date || !meal || !item || !totals) return NextResponse.json({ error: "missing fields" }, { status: 400 });
	
	console.log("POST /api/diary/item", { date, meal, itemId: item.item_id });
	
	try {
		const supabase = await createSupabaseRouteHandlerClient();
		const result = await supabase.rpc("add_diary_item", { 
			p_date: date, 
			p_meal: meal, 
			p_item: item, 
			p_totals: totals 
		});
		
		if (result.error) {
			console.error("Error adding item", result.error);
			return NextResponse.json({ error: result.error.message }, { status: 500 });
		}
		
		return NextResponse.json({ ok: true, id: result.data?.[0]?.id });
	} catch (err) {
		console.error("Unexpected error in POST /api/diary/item", err);
		return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
	}
}