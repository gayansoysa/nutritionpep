import { NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

// This is a direct implementation that bypasses the RPC function
// to avoid the function conflict issue
export async function DELETE(request: Request) {
	const { searchParams } = new URL(request.url);
	const entry = searchParams.get("entry");
	const item = searchParams.get("item");
	const indexStr = searchParams.get("index");
	const index = indexStr ? parseInt(indexStr, 10) : undefined;
	
	console.log("DELETE /api/diary/item/direct", { entry, item, index });
	
	if (!entry || (!item && index === undefined)) {
		console.error("Missing required parameters", { entry, item, index });
		return NextResponse.json({ error: "entry and (item or index) required" }, { status: 400 });
	}
	
	try {
		const supabase = await createSupabaseRouteHandlerClient();
		
		// First check if the entry exists and what's in it
		const { data: entryData, error: entryError } = await supabase
			.from("diary_entries")
			.select("id, items, totals")
			.eq("id", entry)
			.single();
			
		if (entryError) {
			console.error("Error fetching entry", entryError);
			return NextResponse.json({ error: "Entry not found" }, { status: 404 });
		}
		
		const items = entryData.items || [];
		console.log("Entry found", { 
			id: entryData.id, 
			itemsCount: items.length
		});
		
		// Dump all items for debugging
		console.log("All items in entry:", JSON.stringify(items, null, 2));
		
		let itemIndex = -1;
		
		// If index is provided directly, use it
		if (index !== undefined) {
			if (index >= 0 && index < items.length) {
				itemIndex = index;
				console.log(`Using provided index ${index}`);
			} else {
				console.error("Invalid index", { index, itemCount: items.length });
				return NextResponse.json({ error: "Invalid index" }, { status: 400 });
			}
		} 
		// Otherwise try to find by item_id
		else if (item) {
			itemIndex = items.findIndex((it: any) => it.item_id === item);
			
			// If not found by ID and there's only one item, use that
			if (itemIndex === -1 && items.length === 1) {
				itemIndex = 0;
				console.log("Using first item as fallback since there's only one item");
			}
		}
		
		if (itemIndex === -1) {
			console.error("Item not found in entry", { item, entryId: entry });
			return NextResponse.json({ error: "Item not found in entry" }, { status: 404 });
		}
		
		const removedItem = items[itemIndex];
		console.log("Found item to remove:", removedItem);
		
		// Remove the item from the array
		const newItems = [...items.slice(0, itemIndex), ...items.slice(itemIndex + 1)];
		
		// Update the totals
		const oldTotals = entryData.totals || {};
		const itemNutrients = removedItem.nutrients_snapshot || {};
		
		const newTotals = {
			calories_kcal: Math.max(0, (oldTotals.calories_kcal || 0) - (itemNutrients.calories_kcal || 0)),
			protein_g: Math.max(0, (oldTotals.protein_g || 0) - (itemNutrients.protein_g || 0)),
			carbs_g: Math.max(0, (oldTotals.carbs_g || 0) - (itemNutrients.carbs_g || 0)),
			fat_g: Math.max(0, (oldTotals.fat_g || 0) - (itemNutrients.fat_g || 0)),
			fiber_g: Math.max(0, (oldTotals.fiber_g || 0) - (itemNutrients.fiber_g || 0))
		};
		
		// Update the entry
		const { data: updateResult, error: updateError } = await supabase
			.from("diary_entries")
			.update({
				items: newItems,
				totals: newTotals,
				updated_at: new Date().toISOString()
			})
			.eq("id", entry)
			.select();
			
		if (updateError) {
			console.error("Error updating entry", updateError);
			return NextResponse.json({ error: updateError.message }, { status: 500 });
		}
		
		console.log("Entry updated successfully", { 
			newItemsCount: newItems.length,
			removedItem: removedItem.name
		});
		
		return NextResponse.json({ 
			ok: true, 
			removed: removedItem,
			newItemsCount: newItems.length
		});
	} catch (err) {
		console.error("Unexpected error in DELETE /api/diary/item/direct", err);
		return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
	}
}