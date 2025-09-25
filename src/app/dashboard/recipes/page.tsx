'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RecipeWithUser, RecipeSearchParams, RECIPE_CATEGORIES, RECIPE_CUISINES } from '@/lib/types/recipes';
import { toast } from 'sonner';

export default function RecipesPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<RecipeWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState<RecipeSearchParams>({
    search: '',
    limit: 20,
    offset: 0
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'all' | 'my-recipes' | 'favorites'>('all');

  useEffect(() => {
    fetchRecipes();
  }, [searchParams, activeTab]);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (searchParams.search) params.append('search', searchParams.search);
      if (searchParams.category) params.append('category', searchParams.category);
      if (searchParams.cuisine) params.append('cuisine', searchParams.cuisine);
      if (searchParams.difficulty) params.append('difficulty', searchParams.difficulty);
      if (searchParams.maxTime) params.append('maxTime', searchParams.maxTime.toString());
      if (searchParams.minRating) params.append('minRating', searchParams.minRating.toString());
      if (searchParams.tags?.length) params.append('tags', searchParams.tags.join(','));
      if (searchParams.limit) params.append('limit', searchParams.limit.toString());
      if (searchParams.offset) params.append('offset', searchParams.offset.toString());

      // Set visibility and user filters based on active tab
      if (activeTab === 'my-recipes') {
        // Will be filtered by user_id on the backend based on session
      } else if (activeTab === 'favorites') {
        // TODO: Implement favorites endpoint
        params.append('favorites', 'true');
      } else {
        params.append('visibility', 'public');
      }

      const response = await fetch(`/api/recipes?${params}`);
      if (!response.ok) throw new Error('Failed to fetch recipes');
      
      const data = await response.json();
      setRecipes(data.recipes || []);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      toast.error('Failed to load recipes');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (search: string) => {
    setSearchParams(prev => ({ ...prev, search, offset: 0 }));
  };

  const handleFilterChange = (key: keyof RecipeSearchParams, value: any) => {
    setSearchParams(prev => ({ ...prev, [key]: value, offset: 0 }));
  };

  const clearFilters = () => {
    setSearchParams({
      search: '',
      limit: 20,
      offset: 0
    });
  };

  const formatTime = (minutes?: number) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const RecipeCard = ({ recipe }: { recipe: RecipeWithUser }) => (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => router.push(`/dashboard/recipes/${recipe.id}`)}
    >
      <div className="aspect-video relative overflow-hidden rounded-t-lg">
        {recipe.image_url ? (
          <img 
            src={recipe.image_url} 
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground">No image</span>
          </div>
        )}
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg line-clamp-2">{recipe.name}</CardTitle>
        {recipe.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {recipe.description}
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>By {recipe.user_name || 'Anonymous'}</span>
          <div className="flex items-center gap-1">
            <span>⭐</span>
            <span>{recipe.average_rating.toFixed(1)}</span>
            <span>({recipe.rating_count})</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm mb-3">
          <span>🍽️ {recipe.servings} servings</span>
          <span>⏱️ {formatTime((recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0))}</span>
          <Badge variant="secondary" className="text-xs">
            {recipe.difficulty}
          </Badge>
        </div>

        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {recipe.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {recipe.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{recipe.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const RecipeListItem = ({ recipe }: { recipe: RecipeWithUser }) => (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => router.push(`/dashboard/recipes/${recipe.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
            {recipe.image_url ? (
              <img 
                src={recipe.image_url} 
                alt={recipe.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <span className="text-xs text-muted-foreground">No image</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg line-clamp-1">{recipe.name}</h3>
            {recipe.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {recipe.description}
              </p>
            )}
            
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>By {recipe.user_name || 'Anonymous'}</span>
              <span>🍽️ {recipe.servings}</span>
              <span>⏱️ {formatTime((recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0))}</span>
              <div className="flex items-center gap-1">
                <span>⭐</span>
                <span>{recipe.average_rating.toFixed(1)}</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {recipe.difficulty}
              </Badge>
            </div>

            {recipe.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {recipe.tags.slice(0, 5).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {recipe.tags.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{recipe.tags.length - 5}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Recipes</h1>
          <p className="text-muted-foreground">Discover and create delicious recipes</p>
        </div>
        <Button onClick={() => router.push('/dashboard/recipes/create')}>
          <Plus className="w-4 h-4 mr-2" />
          Create Recipe
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Recipes</TabsTrigger>
          <TabsTrigger value="my-recipes">My Recipes</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search recipes..."
              value={searchParams.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Select value={searchParams.category || 'all'} onValueChange={(value) => handleFilterChange('category', value === 'all' ? undefined : value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {RECIPE_CATEGORIES.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={searchParams.cuisine || 'all'} onValueChange={(value) => handleFilterChange('cuisine', value === 'all' ? undefined : value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Cuisine" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cuisines</SelectItem>
              {RECIPE_CUISINES.map(cuisine => (
                <SelectItem key={cuisine} value={cuisine}>{cuisine}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={searchParams.difficulty || 'all'} onValueChange={(value) => handleFilterChange('difficulty', value === 'all' ? undefined : value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={clearFilters}>
            Clear
          </Button>

          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading recipes...</p>
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No recipes found</p>
          <Button onClick={() => router.push('/dashboard/recipes/create')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Recipe
          </Button>
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
        }>
          {recipes.map(recipe => 
            viewMode === 'grid' 
              ? <RecipeCard key={recipe.id} recipe={recipe} />
              : <RecipeListItem key={recipe.id} recipe={recipe} />
          )}
        </div>
      )}

      {/* Load More */}
      {recipes.length >= (searchParams.limit || 20) && (
        <div className="text-center mt-8">
          <Button 
            variant="outline"
            onClick={() => setSearchParams(prev => ({ 
              ...prev, 
              offset: (prev.offset || 0) + (prev.limit || 20) 
            }))}
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}