'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, Users, Star, Heart, Share2, Edit, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RecipeWithIngredients, RecipeRating } from '@/lib/types/recipes';
import { toast } from 'sonner';

interface RecipePageProps {
  params: { id: string };
}

export default function RecipePage({ params }: RecipePageProps) {
  const router = useRouter();
  const [recipe, setRecipe] = useState<RecipeWithIngredients | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [userRating, setUserRating] = useState<RecipeRating | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    fetchRecipe();
    fetchUserRating();
  }, [params.id]);

  const fetchRecipe = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/recipes/${params.id}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Recipe not found');
          router.push('/recipes');
          return;
        }
        throw new Error('Failed to fetch recipe');
      }
      
      const data = await response.json();
      setRecipe(data.recipe);
      setIsFavorited(data.recipe.is_favorited || false);
      
      // Check if current user is the owner (this would need session info)
      // For now, we'll assume it's handled by the API
      setIsOwner(false); // TODO: Implement proper ownership check
    } catch (error) {
      console.error('Error fetching recipe:', error);
      toast.error('Failed to load recipe');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRating = async () => {
    try {
      const response = await fetch(`/api/recipes/${params.id}/rating`);
      if (response.ok) {
        const data = await response.json();
        setUserRating(data.rating);
      }
    } catch (error) {
      console.error('Error fetching user rating:', error);
    }
  };

  const toggleFavorite = async () => {
    try {
      const response = await fetch(`/api/recipes/${params.id}/favorite`, {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to toggle favorite');
      
      const data = await response.json();
      setIsFavorited(data.is_favorited);
      toast.success(data.message);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite');
    }
  };

  const rateRecipe = async (rating: number, review?: string) => {
    try {
      const response = await fetch(`/api/recipes/${params.id}/rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating, review }),
      });
      
      if (!response.ok) throw new Error('Failed to rate recipe');
      
      const data = await response.json();
      setUserRating(data.rating);
      toast.success(data.message);
      
      // Refresh recipe to get updated average rating
      fetchRecipe();
    } catch (error) {
      console.error('Error rating recipe:', error);
      toast.error('Failed to rate recipe');
    }
  };

  const deleteRecipe = async () => {
    if (!confirm('Are you sure you want to delete this recipe? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/recipes/${params.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete recipe');
      
      toast.success('Recipe deleted successfully');
      router.push('/recipes');
    } catch (error) {
      console.error('Error deleting recipe:', error);
      toast.error('Failed to delete recipe');
    }
  };

  const shareRecipe = async () => {
    try {
      await navigator.share({
        title: recipe?.name,
        text: recipe?.description,
        url: window.location.href,
      });
    } catch (error) {
      // Fallback to copying URL
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Recipe URL copied to clipboard');
    }
  };

  const formatTime = (minutes?: number) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const calculateNutrition = () => {
    if (!recipe?.ingredients) return null;
    
    // This is a simplified calculation - in a real app, you'd use the food database
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    
    recipe.ingredients.forEach(ingredient => {
      if (ingredient.foods?.nutrients_per_100g) {
        const nutrients = ingredient.foods.nutrients_per_100g;
        const factor = ingredient.grams / 100;
        
        totalCalories += (nutrients.calories || 0) * factor;
        totalProtein += (nutrients.protein || 0) * factor;
        totalCarbs += (nutrients.carbs || 0) * factor;
        totalFat += (nutrients.fat || 0) * factor;
      }
    });

    return {
      calories: Math.round(totalCalories / recipe.servings),
      protein: Math.round(totalProtein / recipe.servings),
      carbs: Math.round(totalCarbs / recipe.servings),
      fat: Math.round(totalFat / recipe.servings),
    };
  };

  const StarRating = ({ rating, onRate, readonly = false }: { 
    rating: number; 
    onRate?: (rating: number) => void; 
    readonly?: boolean;
  }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-5 h-5 ${
            star <= rating 
              ? 'fill-yellow-400 text-yellow-400' 
              : 'text-gray-300'
          } ${!readonly && onRate ? 'cursor-pointer hover:text-yellow-400' : ''}`}
          onClick={() => !readonly && onRate && onRate(star)}
        />
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
          <div className="space-y-4">
            <div className="h-6 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="container mx-auto px-4 py-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Recipe not found</h1>
        <Button onClick={() => router.push('/recipes')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Recipes
        </Button>
      </div>
    );
  }

  const nutrition = calculateNutrition();

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{recipe.name}</h1>
          <p className="text-muted-foreground">By {recipe.user_name || 'Anonymous'}</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={toggleFavorite}>
            <Heart className={`w-4 h-4 mr-2 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
            {isFavorited ? 'Favorited' : 'Favorite'}
          </Button>
          
          <Button variant="outline" size="sm" onClick={shareRecipe}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>

          {isOwner && (
            <>
              <Button variant="outline" size="sm" onClick={() => router.push(`/recipes/${recipe.id}/edit`)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={deleteRecipe}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Recipe Image */}
      {recipe.image_url && (
        <div className="aspect-video relative overflow-hidden rounded-lg mb-6">
          <img 
            src={recipe.image_url} 
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Recipe Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <div className="text-2xl font-bold">{recipe.servings}</div>
            <div className="text-sm text-muted-foreground">Servings</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <div className="text-2xl font-bold">{formatTime(recipe.prep_time_minutes)}</div>
            <div className="text-sm text-muted-foreground">Prep Time</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <div className="text-2xl font-bold">{formatTime(recipe.cook_time_minutes)}</div>
            <div className="text-sm text-muted-foreground">Cook Time</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Star className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <div className="text-2xl font-bold">{recipe.average_rating.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">Rating ({recipe.rating_count})</div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {recipe.description && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <p className="text-lg">{recipe.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Tags and Categories */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Badge variant="secondary">{recipe.difficulty}</Badge>
        {recipe.category && <Badge variant="outline">{recipe.category}</Badge>}
        {recipe.cuisine && <Badge variant="outline">{recipe.cuisine}</Badge>}
        {recipe.tags.map(tag => (
          <Badge key={tag} variant="outline">{tag}</Badge>
        ))}
      </div>

      <Tabs defaultValue="ingredients" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
          <TabsTrigger value="instructions">Instructions</TabsTrigger>
          <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="ingredients">
          <Card>
            <CardHeader>
              <CardTitle>Ingredients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recipe.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{ingredient.name}</span>
                        {ingredient.optional && (
                          <Badge variant="outline" className="text-xs">optional</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {ingredient.amount} {ingredient.unit} ({ingredient.grams}g)
                        {ingredient.preparation && ` - ${ingredient.preparation}`}
                      </div>
                      {ingredient.notes && (
                        <div className="text-xs text-muted-foreground italic">
                          {ingredient.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="instructions">
          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              {recipe.instructions ? (
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap font-sans">{recipe.instructions}</pre>
                </div>
              ) : (
                <p className="text-muted-foreground">No instructions provided.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nutrition">
          <Card>
            <CardHeader>
              <CardTitle>Nutrition Information</CardTitle>
              <p className="text-sm text-muted-foreground">Per serving (estimated)</p>
            </CardHeader>
            <CardContent>
              {nutrition ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{nutrition.calories}</div>
                    <div className="text-sm text-muted-foreground">Calories</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{nutrition.protein}g</div>
                    <div className="text-sm text-muted-foreground">Protein</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{nutrition.carbs}g</div>
                    <div className="text-sm text-muted-foreground">Carbs</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{nutrition.fat}g</div>
                    <div className="text-sm text-muted-foreground">Fat</div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Nutrition information not available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle>Reviews & Ratings</CardTitle>
            </CardHeader>
            <CardContent>
              {!isOwner && (
                <div className="mb-6 p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Rate this recipe</h4>
                  <StarRating 
                    rating={userRating?.rating || 0}
                    onRate={(rating) => rateRecipe(rating)}
                  />
                  {userRating && (
                    <p className="text-sm text-muted-foreground mt-2">
                      You rated this recipe {userRating.rating} stars
                    </p>
                  )}
                </div>
              )}
              
              <div className="text-center py-8 text-muted-foreground">
                <p>Reviews feature coming soon!</p>
                <p className="text-sm">Users will be able to leave detailed reviews and ratings.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Additional Info */}
      {(recipe.source_url || recipe.notes) && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recipe.source_url && (
              <div>
                <h4 className="font-medium mb-1">Source</h4>
                <a 
                  href={recipe.source_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {recipe.source_url}
                </a>
              </div>
            )}
            
            {recipe.notes && (
              <div>
                <h4 className="font-medium mb-1">Notes</h4>
                <p className="text-muted-foreground">{recipe.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}