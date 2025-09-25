"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  CheckCircledIcon,
  CrossCircledIcon,
  ReloadIcon,
  ImageIcon
} from "@radix-ui/react-icons";
import { toast } from 'sonner';
import { NormalizedFood } from "@/lib/services/external-apis-enhanced";

interface ExternalFoodSearchProps {
  onFoodsImported?: () => void;
}

export default function ExternalFoodSearch({ onFoodsImported }: ExternalFoodSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [searchResults, setSearchResults] = useState<NormalizedFood[]>([]);
  const [selectedFoods, setSelectedFoods] = useState<Set<string>>(new Set());
  const [searchMetadata, setSearchMetadata] = useState<{
    source?: string;
    responseTime?: number;
    cached?: boolean;
  }>({});

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    setIsSearching(true);
    setSearchResults([]);
    setSelectedFoods(new Set());

    try {
      const params = new URLSearchParams({
        q: searchQuery.trim(),
        limit: "20",
        offset: "0"
      });

      const response = await fetch(`/api/foods/search-external?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Search failed");
      }

      setSearchResults(data.foods || []);
      setSearchMetadata(data.metadata || {});

      if (data.foods?.length === 0) {
        toast.info("No foods found for your search query");
      } else {
        toast.success(`Found ${data.foods.length} foods from ${data.metadata?.source || 'external APIs'}`);
      }

    } catch (error: any) {
      console.error("Search error:", error);
      toast.error("Search failed: " + error.message);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleFoodSelection = (foodId: string) => {
    const newSelected = new Set(selectedFoods);
    if (newSelected.has(foodId)) {
      newSelected.delete(foodId);
    } else {
      newSelected.add(foodId);
    }
    setSelectedFoods(newSelected);
  };

  const selectAllFoods = () => {
    if (selectedFoods.size === searchResults.length) {
      setSelectedFoods(new Set());
    } else {
      setSelectedFoods(new Set(searchResults.map(food => food.id)));
    }
  };

  const handleImport = async () => {
    if (selectedFoods.size === 0) {
      toast.error("Please select at least one food to import");
      return;
    }

    setIsImporting(true);

    try {
      const foodsToImport = searchResults.filter(food => selectedFoods.has(food.id));
      
      const response = await fetch("/api/admin/foods/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ foods: foodsToImport }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Import failed");
      }

      const { results } = data;
      
      // Show detailed results
      if (results.imported > 0) {
        toast.success(`Successfully imported ${results.imported} foods`);
      }
      
      if (results.skipped > 0) {
        toast.info(`Skipped ${results.skipped} foods (already exist)`);
      }
      
      if (results.errors > 0) {
        toast.error(`Failed to import ${results.errors} foods`);
      }

      // Clear selection and optionally refresh the parent component
      setSelectedFoods(new Set());
      if (onFoodsImported) {
        onFoodsImported();
      }

    } catch (error: any) {
      console.error("Import error:", error);
      toast.error("Import failed: " + error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const formatNutrients = (nutrients: NormalizedFood['nutrients_per_100g']) => {
    return `${nutrients.calories_kcal}kcal, ${nutrients.protein_g}g protein, ${nutrients.carbs_g}g carbs, ${nutrients.fat_g}g fat`;
  };

  // Component for displaying food images
  const FoodImage = ({ food }: { food: NormalizedFood }) => {
    const [imageError, setImageError] = useState(false);
    
    if (!food.image_url || imageError) {
      return (
        <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center">
          <ImageIcon className="h-5 w-5 text-gray-400" />
        </div>
      );
    }

    return (
      <div className="w-12 h-12 relative rounded-md overflow-hidden bg-gray-100">
        <Image
          src={food.image_url}
          alt={food.name}
          fill
          className="object-cover"
          onError={() => setImageError(true)}
          sizes="48px"
        />
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MagnifyingGlassIcon className="h-5 w-5" />
          Import Foods from External APIs
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Search and import foods from USDA, Open Food Facts, and other nutrition databases
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="text"
            placeholder="Search for foods (e.g., 'chicken breast', 'apple')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
            disabled={isSearching}
          />
          <Button type="submit" disabled={isSearching}>
            {isSearching ? (
              <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MagnifyingGlassIcon className="mr-2 h-4 w-4" />
            )}
            Search
          </Button>
        </form>

        {/* Search Metadata */}
        {searchMetadata.source && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{searchMetadata.source}</Badge>
            {searchMetadata.responseTime && (
              <span>{searchMetadata.responseTime}ms</span>
            )}
            {searchMetadata.cached && (
              <Badge variant="secondary">Cached</Badge>
            )}
          </div>
        )}

        {/* Results */}
        {searchResults.length > 0 && (
          <div className="space-y-4">
            {/* Selection Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedFoods.size === searchResults.length && searchResults.length > 0}
                  onCheckedChange={selectAllFoods}
                />
                <span className="text-sm">
                  Select All ({selectedFoods.size} of {searchResults.length} selected)
                </span>
              </div>
              <Button
                onClick={handleImport}
                disabled={selectedFoods.size === 0 || isImporting}
                size="sm"
              >
                {isImporting ? (
                  <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PlusIcon className="mr-2 h-4 w-4" />
                )}
                Import Selected ({selectedFoods.size})
              </Button>
            </div>

            {/* Results Table */}
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Select</TableHead>
                    <TableHead className="w-16">Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Nutrition (per 100g)</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.map((food) => (
                    <TableRow key={food.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedFoods.has(food.id)}
                          onCheckedChange={() => toggleFoodSelection(food.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <FoodImage food={food} />
                      </TableCell>
                      <TableCell className="font-medium">
                        {food.name}
                        {food.barcode && (
                          <div className="text-xs text-muted-foreground">
                            Barcode: {food.barcode}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{food.brand || "-"}</TableCell>
                      <TableCell>{food.category || "-"}</TableCell>
                      <TableCell className="text-sm">
                        {formatNutrients(food.nutrients_per_100g)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{food.source}</Badge>
                      </TableCell>
                      <TableCell>
                        {food.verified ? (
                          <div className="flex items-center text-green-600">
                            <CheckCircledIcon className="mr-1 h-4 w-4" />
                            <span className="text-xs">Verified</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-amber-600">
                            <CrossCircledIcon className="mr-1 h-4 w-4" />
                            <span className="text-xs">Unverified</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isSearching && searchResults.length === 0 && searchQuery && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No results found. Try a different search term.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}