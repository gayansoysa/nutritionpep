'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestNavigationPage() {
  const testFoods = [
    {
      food_id: "3c344b9a-b41f-413a-ada3-f3255eeb1244", // This might not exist, but we'll test the flow
      name: "Eggs, Grade A, Large, egg whole"
    },
    {
      food_id: "test-food-id",
      name: "Test Food"
    }
  ]

  const handleTestNavigation = (food: { food_id: string; name: string }) => {
    const params = new URLSearchParams({
      food_id: food.food_id,
      name: food.name
    })
    window.location.href = `/dashboard/search?${params}`
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Food Navigation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Click the buttons below to test navigation to the search page with food_id parameter.
            This simulates what happens when you click on Smart Suggestions or Recent Foods.
          </p>
          
          {testFoods.map((food) => (
            <div key={food.food_id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">{food.name}</p>
                <p className="text-sm text-muted-foreground">ID: {food.food_id}</p>
              </div>
              <Button onClick={() => handleTestNavigation(food)}>
                Test Navigation
              </Button>
            </div>
          ))}
          
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="font-medium mb-2">Expected Behavior:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>1. Click a "Test Navigation" button</li>
              <li>2. You should be redirected to /dashboard/search with food_id and name parameters</li>
              <li>3. The search page should automatically fetch and display the food details</li>
              <li>4. The food should be auto-selected for adding to diary</li>
              <li>5. The search input should be populated with the food name</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}