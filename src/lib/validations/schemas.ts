/**
 * Centralized Zod validation schemas with enhanced error messages
 * This file contains all form validation schemas used throughout the app
 */

import * as z from "zod";

// Common validation patterns
const requiredString = (fieldName: string, minLength = 1) =>
  z.string()
    .min(minLength, `${fieldName} is required and must be at least ${minLength} character${minLength > 1 ? 's' : ''}`)
    .trim();

const optionalString = z.string().trim().optional();

const positiveNumber = (fieldName: string) =>
  z.number()
    .positive(`${fieldName} must be a positive number`)
    .finite(`${fieldName} must be a valid number`);

const nonNegativeNumber = (fieldName: string) =>
  z.number()
    .min(0, `${fieldName} cannot be negative`)
    .finite(`${fieldName} must be a valid number`);

// Profile validation schema
export const profileSchema = z.object({
  full_name: requiredString("Full name", 2)
    .max(100, "Full name cannot exceed 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Full name can only contain letters, spaces, hyphens, and apostrophes"),
  
  units: z.enum(["metric", "imperial"])
    .refine(val => ["metric", "imperial"].includes(val), {
      message: "Please select either Metric or Imperial units"
    }),
  
  locale: requiredString("Language/Locale")
    .regex(/^[a-z]{2}(-[A-Z]{2})?$/, "Invalid locale format"),
  
  timezone: requiredString("Timezone")
    .min(3, "Please select a valid timezone"),
  
  accepted_privacy: z.boolean()
    .refine(val => val === true, {
      message: "You must accept the privacy policy to continue"
    })
});

// Biometrics validation schema
export const biometricsSchema = z.object({
  age: z.number()
    .int("Age must be a whole number")
    .min(13, "You must be at least 13 years old")
    .max(120, "Please enter a valid age"),
  
  gender: z.enum(["male", "female", "other"])
    .refine(val => ["male", "female", "other"].includes(val), {
      message: "Please select your gender"
    }),
  
  height: positiveNumber("Height")
    .min(50, "Height must be at least 50cm")
    .max(300, "Height cannot exceed 300cm"),
  
  weight: positiveNumber("Weight")
    .min(20, "Weight must be at least 20kg")
    .max(500, "Weight cannot exceed 500kg"),
  
  activity_level: z.enum(["sedentary", "lightly_active", "moderately_active", "very_active", "extra_active"])
    .refine(val => ["sedentary", "lightly_active", "moderately_active", "very_active", "extra_active"].includes(val), {
      message: "Please select your activity level"
    })
});

// Goals validation schema
export const goalsSchema = z.object({
  goal_type: z.enum(["lose_weight", "maintain_weight", "gain_weight"])
    .refine(val => ["lose_weight", "maintain_weight", "gain_weight"].includes(val), {
      message: "Please select your primary goal"
    }),
  
  target_weight: positiveNumber("Target weight")
    .min(20, "Target weight must be at least 20kg")
    .max(500, "Target weight cannot exceed 500kg"),
  
  weekly_goal: z.number()
    .min(-2, "Weekly goal cannot exceed -2kg per week")
    .max(2, "Weekly goal cannot exceed +2kg per week")
    .refine(val => Math.abs(val) <= 1 || Math.abs(val) <= 2, {
      message: "For safety, we recommend a maximum of 1kg per week"
    }),
  
  calories_goal: z.number()
    .int("Calorie goal must be a whole number")
    .min(800, "Calorie goal must be at least 800 calories for safety")
    .max(5000, "Calorie goal cannot exceed 5000 calories"),
  
  protein_goal: nonNegativeNumber("Protein goal")
    .max(500, "Protein goal cannot exceed 500g"),
  
  carbs_goal: nonNegativeNumber("Carbohydrates goal")
    .max(1000, "Carbohydrates goal cannot exceed 1000g"),
  
  fat_goal: nonNegativeNumber("Fat goal")
    .max(300, "Fat goal cannot exceed 300g")
});

// Food creation/editing schema
export const foodSchema = z.object({
  name: requiredString("Food name", 2)
    .max(200, "Food name cannot exceed 200 characters"),
  
  brand: z.string().trim().max(100, "Brand name cannot exceed 100 characters").optional(),
  
  category: z.string().trim().max(50, "Category cannot exceed 50 characters").optional(),
  
  barcode: z.string().trim().regex(/^\d{8,14}$/, "Barcode must be 8-14 digits").optional().or(z.literal("")),
  
  serving_size: positiveNumber("Serving size")
    .max(10000, "Serving size cannot exceed 10000g"),
  
  serving_unit: requiredString("Serving unit")
    .max(20, "Serving unit cannot exceed 20 characters"),
  
  // Nutritional information per 100g
  calories_per_100g: nonNegativeNumber("Calories")
    .max(900, "Calories cannot exceed 900 per 100g"),
  
  protein_per_100g: nonNegativeNumber("Protein")
    .max(100, "Protein cannot exceed 100g per 100g"),
  
  carbs_per_100g: nonNegativeNumber("Carbohydrates")
    .max(100, "Carbohydrates cannot exceed 100g per 100g"),
  
  fat_per_100g: nonNegativeNumber("Fat")
    .max(100, "Fat cannot exceed 100g per 100g"),
  
  fiber_per_100g: nonNegativeNumber("Fiber")
    .max(100, "Fiber cannot exceed 100g per 100g"),
  
  sugar_per_100g: nonNegativeNumber("Sugar")
    .max(100, "Sugar cannot exceed 100g per 100g"),
  
  sodium_per_100g: nonNegativeNumber("Sodium")
    .max(10000, "Sodium cannot exceed 10000mg per 100g")
});

// Add food to diary schema
export const addFoodSchema = z.object({
  food_id: z.string().uuid("Invalid food ID"),
  
  quantity: positiveNumber("Quantity")
    .max(10000, "Quantity cannot exceed 10000"),
  
  unit: requiredString("Unit")
    .max(20, "Unit cannot exceed 20 characters"),
  
  meal_type: z.enum(["breakfast", "lunch", "dinner", "snacks"])
    .refine(val => ["breakfast", "lunch", "dinner", "snacks"].includes(val), {
      message: "Please select a valid meal type"
    })
});

// Search schema
export const searchSchema = z.object({
  query: requiredString("Search query", 2)
    .max(100, "Search query cannot exceed 100 characters")
    .regex(/^[a-zA-Z0-9\s\-_'".]+$/, "Search query contains invalid characters"),
  
  category: optionalString,
  
  verified_only: z.boolean().optional(),
  
  limit: z.number()
    .int("Limit must be a whole number")
    .min(1, "Limit must be at least 1")
    .max(100, "Limit cannot exceed 100")
    .optional()
    .default(20)
});

// Barcode schema
export const barcodeSchema = z.object({
  barcode: z.string()
    .regex(/^\d{8,14}$/, "Barcode must be 8-14 digits")
    .min(8, "Barcode must be at least 8 digits")
    .max(14, "Barcode cannot exceed 14 digits")
});

// API Configuration schema (for admin)
export const apiConfigSchema = z.object({
  api_name: z.enum(["USDA", "FatSecret", "OpenFoodFacts"])
    .refine(val => ["USDA", "FatSecret", "OpenFoodFacts"].includes(val), {
      message: "Please select a valid API"
    }),
  
  is_enabled: z.boolean(),
  
  api_key: z.string().trim().min(10, "API key must be at least 10 characters").max(200, "API key cannot exceed 200 characters").optional(),
  
  rate_limit_per_hour: z.number()
    .int("Rate limit must be a whole number")
    .min(1, "Rate limit must be at least 1")
    .max(10000, "Rate limit cannot exceed 10000")
    .optional(),
  
  rate_limit_per_day: z.number()
    .int("Rate limit must be a whole number")
    .min(1, "Rate limit must be at least 1")
    .max(100000, "Rate limit cannot exceed 100000")
    .optional(),
  
  rate_limit_per_month: z.number()
    .int("Rate limit must be a whole number")
    .min(1, "Rate limit must be at least 1")
    .max(1000000, "Rate limit cannot exceed 1000000")
    .optional()
});

// Export types
export type ProfileFormData = z.infer<typeof profileSchema>;
export type BiometricsFormData = z.infer<typeof biometricsSchema>;
export type GoalsFormData = z.infer<typeof goalsSchema>;
export type FoodFormData = z.infer<typeof foodSchema>;
export type AddFoodFormData = z.infer<typeof addFoodSchema>;
export type SearchFormData = z.infer<typeof searchSchema>;
export type BarcodeFormData = z.infer<typeof barcodeSchema>;
export type ApiConfigFormData = z.infer<typeof apiConfigSchema>;

// Validation helper functions
export const validateEmail = (email: string) => {
  const emailSchema = z.string().email("Please enter a valid email address");
  return emailSchema.safeParse(email);
};

export const validatePassword = (password: string) => {
  const passwordSchema = z.string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password cannot exceed 128 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
      "Password must contain at least one lowercase letter, one uppercase letter, and one number");
  return passwordSchema.safeParse(password);
};

export const validateConfirmPassword = (password: string, confirmPassword: string) => {
  if (password !== confirmPassword) {
    return { success: false, error: { message: "Passwords do not match" } };
  }
  return { success: true };
};