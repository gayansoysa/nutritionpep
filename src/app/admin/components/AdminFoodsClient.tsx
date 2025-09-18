"use client";

import { useState } from "react";
import FoodsList from "./FoodsList";
import ExternalFoodSearch from "./ExternalFoodSearch";

export default function AdminFoodsClient() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFoodsImported = () => {
    // Trigger a refresh of the FoodsList component
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <ExternalFoodSearch onFoodsImported={handleFoodsImported} />
      <FoodsList key={refreshKey} />
    </div>
  );
}