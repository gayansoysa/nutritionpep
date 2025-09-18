"use client";

import { useState, useEffect } from "react";
import { BookOpen, Plus, Trash2, Copy, Loader2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { FoodImage } from "@/components/ui/food-image";
import { DeleteConfirmationDialog, useDeleteConfirmation } from "@/components/ui/delete-confirmation-dialog";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "@/lib/utils/toast";
import { cn } from "@/lib/utils";

interface MealTemplate {
  id: string;
  name: string;
  description?: string;
  items: any[];
  totals: {
    calories_kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
  };
  created_at: string;
}

interface MealTemplatesDialogProps {
  targetMeal: string;
  targetDate?: string;
  onTemplateApplied?: () => void;
  children?: React.ReactNode;
}

export function MealTemplatesDialog({ 
  targetMeal, 
  targetDate = new Date().toISOString().split('T')[0],
  onTemplateApplied,
  children 
}: MealTemplatesDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [templates, setTemplates] = useState<MealTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<MealTemplate | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDescription, setNewTemplateDescription] = useState("");

  const supabase = createSupabaseBrowserClient();
  const deleteConfirmation = useDeleteConfirmation();

  // Load templates when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from('meal_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTemplates(data || []);
    } catch (error: any) {
      console.error("Error loading templates:", error);
      toast.error("Failed to load meal templates");
    } finally {
      setIsLoading(false);
    }
  };

  const createTemplate = async () => {
    if (!newTemplateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get current meal items to create template from
      const { data: currentMeal, error: fetchError } = await supabase
        .from('diary_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', targetDate)
        .eq('meal_type', targetMeal)
        .single();

      if (fetchError || !currentMeal || !currentMeal.items?.length) {
        toast.error("No items found in current meal to create template from");
        return;
      }

      const { error } = await supabase
        .from('meal_templates')
        .insert({
          user_id: user.id,
          name: newTemplateName.trim(),
          description: newTemplateDescription.trim() || null,
          items: currentMeal.items,
          totals: currentMeal.totals
        });

      if (error) throw error;

      toast.success("Meal template created successfully");
      setNewTemplateName("");
      setNewTemplateDescription("");
      setShowCreateForm(false);
      loadTemplates();
      
    } catch (error: any) {
      console.error("Error creating template:", error);
      toast.error("Failed to create meal template");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('meal_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      toast.success("Template deleted successfully");
      loadTemplates();
      if (selectedTemplate?.id === templateId) {
        setSelectedTemplate(null);
      }
    } catch (error: any) {
      console.error("Error deleting template:", error);
      toast.error("Failed to delete template");
    }
  };

  const applyTemplate = async () => {
    if (!selectedTemplate) {
      toast.error("Please select a template to apply");
      return;
    }

    setIsApplying(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Apply each item from the template
      for (const item of selectedTemplate.items) {
        const { error } = await supabase.rpc("add_diary_item", {
          p_date: targetDate,
          p_meal: targetMeal,
          p_item: item,
          p_totals: {
            calories_kcal: item.nutrients_snapshot?.calories_kcal || 0,
            protein_g: item.nutrients_snapshot?.protein_g || 0,
            carbs_g: item.nutrients_snapshot?.carbs_g || 0,
            fat_g: item.nutrients_snapshot?.fat_g || 0,
            fiber_g: item.nutrients_snapshot?.fiber_g || 0,
          }
        });

        if (error) throw error;
      }

      toast.success(`Applied template "${selectedTemplate.name}" to ${targetMeal}`);
      setIsOpen(false);
      onTemplateApplied?.();
      
    } catch (error: any) {
      console.error("Error applying template:", error);
      toast.error("Failed to apply template");
    } finally {
      setIsApplying(false);
    }
  };

  const getMealTypeLabel = (mealType: string) => {
    return mealType.charAt(0).toUpperCase() + mealType.slice(1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <BookOpen className="h-4 w-4 mr-2" />
            Use Template
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Meal Templates</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create Template Section */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Create New Template</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateForm(!showCreateForm)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              </div>
            </CardHeader>
            {showCreateForm && (
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="e.g., Protein Breakfast, Quick Lunch..."
                  />
                </div>
                <div>
                  <Label htmlFor="template-description">Description (Optional)</Label>
                  <Textarea
                    id="template-description"
                    value={newTemplateDescription}
                    onChange={(e) => setNewTemplateDescription(e.target.value)}
                    placeholder="Brief description of this meal template..."
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={createTemplate} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create from Current {getMealTypeLabel(targetMeal)}
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Templates List */}
          <div>
            <h3 className="text-lg font-medium mb-3">Your Templates</h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : templates.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No meal templates yet. Create your first template from a meal you've logged!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <Card 
                    key={template.id}
                    className={cn(
                      "cursor-pointer transition-colors",
                      selectedTemplate?.id === template.id 
                        ? "ring-2 ring-primary bg-primary/5" 
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">
                            {template.name}
                          </CardTitle>
                          {template.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {template.description}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 ml-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConfirmation.confirm(() => deleteTemplate(template.id));
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary">
                          {template.items.length} item{template.items.length !== 1 ? 's' : ''}
                        </Badge>
                        <Badge variant="outline">
                          {Math.round(template.totals?.calories_kcal || 0)} kcal
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-1">
                        {template.items.slice(0, 3).map((item, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <FoodImage
                              src={item.image_url}
                              alt={item.name}
                              width={20}
                              height={20}
                              className="rounded"
                            />
                            <span className="truncate">
                              {item.name} {item.brand && `(${item.brand})`}
                            </span>
                            <span className="text-muted-foreground">
                              {item.quantity}g
                            </span>
                          </div>
                        ))}
                        {template.items.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{template.items.length - 3} more items
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={applyTemplate}
              disabled={!selectedTemplate || isApplying}
            >
              {isApplying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Apply to {getMealTypeLabel(targetMeal)}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
      
      <DeleteConfirmationDialog
        open={deleteConfirmation.isOpen}
        onOpenChange={deleteConfirmation.setIsOpen}
        onConfirm={deleteConfirmation.handleConfirm}
        isLoading={deleteConfirmation.isLoading}
        title="Delete Meal Template"
        description="This will permanently delete this meal template. This action cannot be undone."
      />
    </Dialog>
  );
}