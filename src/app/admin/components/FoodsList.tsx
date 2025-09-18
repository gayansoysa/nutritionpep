"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Pencil1Icon, 
  TrashIcon, 
  CheckCircledIcon, 
  CrossCircledIcon,
  MagnifyingGlassIcon
} from "@radix-ui/react-icons";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { PaginationWithInfo } from "@/components/ui/pagination";
import { DeleteConfirmationDialog, useDeleteConfirmation } from "@/components/ui/delete-confirmation-dialog";
import { toast } from "@/lib/utils/toast";

type Food = {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  barcode?: string;
  verified: boolean;
  source: string;
};

export default function FoodsList() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [foodToDelete, setFoodToDelete] = useState<Food | null>(null);
  const itemsPerPage = 20;
  
  const supabase = createClientComponentClient();
  const deleteConfirmation = useDeleteConfirmation();
  
  useEffect(() => {
    fetchFoods();
  }, [currentPage]);
  
  const fetchFoods = async () => {
    setIsLoading(true);
    
    try {
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      // Get total count
      const { count } = await supabase
        .from("foods")
        .select("*", { count: "exact", head: true });
      
      // Get paginated data
      const { data, error } = await supabase
        .from("foods")
        .select("id, name, brand, category, barcode, verified, source")
        .order("name")
        .range(from, to);
        
      if (error) {
        throw error;
      }
      
      setFoods(data || []);
      setTotalCount(count || 0);
    } catch (error: any) {
      console.error("Error fetching foods:", error);
      toast.error("Failed to load foods");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on search
    
    if (!searchQuery.trim()) {
      fetchFoods();
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.rpc("search_foods", {
        q: searchQuery,
        max_results: itemsPerPage
      });
      
      if (error) {
        throw error;
      }
      
      setFoods(data || []);
      setTotalCount(data?.length || 0); // For search, we don't have exact count
    } catch (error: any) {
      console.error("Search error:", error);
      toast.error("Search failed");
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleVerified = async (id: string, currentValue: boolean) => {
    try {
      console.log("Attempting to update food:", id, "from", currentValue, "to", !currentValue);
      
      const { data, error } = await supabase
        .from("foods")
        .update({ verified: !currentValue })
        .eq("id", id)
        .select();
        
      console.log("Supabase response:", { data, error });
      console.log("Error details:", {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      });
        
      if (error) {
        throw error;
      }
      
      setFoods(foods.map(food => 
        food.id === id ? { ...food, verified: !currentValue } : food
      ));
      
      toast.success(`Food ${!currentValue ? "verified" : "unverified"}`);
    } catch (error: any) {
      console.error("Error updating food:", error);
      console.error("Error properties:", Object.getOwnPropertyNames(error));
      console.error("Error JSON:", JSON.stringify(error));
      toast.error("Failed to update food");
    }
  };
  
  const deleteFood = async (food: Food) => {
    try {
      const { error } = await supabase
        .from("foods")
        .delete()
        .eq("id", food.id);
        
      if (error) {
        throw error;
      }
      
      setFoods(foods.filter(f => f.id !== food.id));
      toast.success("Food deleted");
    } catch (error: any) {
      console.error("Error deleting food:", error);
      toast.error("Failed to delete food");
    }
  };
  
  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          type="text"
          placeholder="Search foods..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit">
          <MagnifyingGlassIcon className="mr-2 h-4 w-4" />
          Search
        </Button>
      </form>
      
      {isLoading ? (
        <TableSkeleton 
          columns={["Name", "Brand", "Category", "Barcode", "Source", "Status", "Actions"]}
          rows={8}
        />
      ) : foods.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No foods found</p>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {foods.map((food) => (
                <TableRow key={food.id}>
                  <TableCell className="font-medium">{food.name}</TableCell>
                  <TableCell>{food.brand || "-"}</TableCell>
                  <TableCell>{food.category || "-"}</TableCell>
                  <TableCell>{food.barcode || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{food.source}</Badge>
                  </TableCell>
                  <TableCell>
                    {food.verified ? (
                      <div className="flex items-center text-green-600">
                        <CheckCircledIcon className="mr-1 h-4 w-4" />
                        <span>Verified</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-amber-600">
                        <CrossCircledIcon className="mr-1 h-4 w-4" />
                        <span>Unverified</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => toggleVerified(food.id, food.verified)}
                      >
                        {food.verified ? (
                          <CrossCircledIcon className="h-4 w-4" />
                        ) : (
                          <CheckCircledIcon className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        asChild
                      >
                        <a href={`/admin/foods/${food.id}`}>
                          <Pencil1Icon className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setFoodToDelete(food);
                          deleteConfirmation.confirm(() => deleteFood(food));
                        }}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {!isLoading && totalCount > itemsPerPage && (
        <PaginationWithInfo
          currentPage={currentPage}
          totalPages={Math.ceil(totalCount / itemsPerPage)}
          totalItems={totalCount}
          itemsPerPage={itemsPerPage}
          onPageChange={(page) => {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="mt-4"
        />
      )}
      
      <DeleteConfirmationDialog
        open={deleteConfirmation.isOpen}
        onOpenChange={deleteConfirmation.setIsOpen}
        onConfirm={deleteConfirmation.handleConfirm}
        title="Delete food?"
        description={foodToDelete ? `This will permanently delete "${foodToDelete.name}" from the food database. This action cannot be undone.` : undefined}
        itemName={foodToDelete?.name}
        isLoading={deleteConfirmation.isLoading}
      />
    </div>
  );
}