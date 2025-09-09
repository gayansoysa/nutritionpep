/**
 * Local storage utilities for caching user preferences and app state
 */

// Storage keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'nutritionpep_user_preferences',
  SEARCH_HISTORY: 'nutritionpep_search_history',
  RECENT_FOODS: 'nutritionpep_recent_foods',
  DASHBOARD_LAYOUT: 'nutritionpep_dashboard_layout',
  ONBOARDING_STATE: 'nutritionpep_onboarding_state',
  THEME_PREFERENCE: 'nutritionpep_theme',
  UNITS_PREFERENCE: 'nutritionpep_units',
} as const;

// Type definitions
export interface UserPreferences {
  units: 'metric' | 'imperial';
  locale: string;
  timezone: string;
  defaultMealTimes: {
    breakfast: string;
    lunch: string;
    dinner: string;
    snacks: string;
  };
  dashboardLayout: {
    showQuickAdd: boolean;
    showRecentFoods: boolean;
    showSuggestions: boolean;
    compactView: boolean;
  };
  notifications: {
    mealReminders: boolean;
    goalAchievements: boolean;
    weeklyReports: boolean;
  };
}

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
  resultCount: number;
}

export interface RecentFoodItem {
  foodId: string;
  name: string;
  brand?: string;
  lastUsed: number;
  frequency: number;
}

// Generic storage functions
function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function safeJsonStringify(value: any): string {
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
}

// User preferences
export const userPreferences = {
  get(): UserPreferences {
    const defaultPreferences: UserPreferences = {
      units: 'metric',
      locale: 'en-US',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      defaultMealTimes: {
        breakfast: '08:00',
        lunch: '12:00',
        dinner: '18:00',
        snacks: '15:00',
      },
      dashboardLayout: {
        showQuickAdd: true,
        showRecentFoods: true,
        showSuggestions: true,
        compactView: false,
      },
      notifications: {
        mealReminders: true,
        goalAchievements: true,
        weeklyReports: false,
      },
    };

    if (typeof window === 'undefined') return defaultPreferences;
    
    const stored = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    return safeJsonParse(stored, defaultPreferences);
  },

  set(preferences: Partial<UserPreferences>): void {
    if (typeof window === 'undefined') return;
    
    const current = this.get();
    const updated = { ...current, ...preferences };
    localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, safeJsonStringify(updated));
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.USER_PREFERENCES);
  },
};

// Search history
export const searchHistory = {
  get(): SearchHistoryItem[] {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
    return safeJsonParse(stored, []);
  },

  add(query: string, resultCount: number): void {
    if (typeof window === 'undefined') return;
    
    const history = this.get();
    const existing = history.findIndex(item => item.query.toLowerCase() === query.toLowerCase());
    
    const newItem: SearchHistoryItem = {
      query,
      timestamp: Date.now(),
      resultCount,
    };

    if (existing >= 0) {
      history[existing] = newItem;
    } else {
      history.unshift(newItem);
    }

    // Keep only last 50 searches
    const trimmed = history.slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, safeJsonStringify(trimmed));
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.SEARCH_HISTORY);
  },

  getPopular(limit = 10): string[] {
    const history = this.get();
    const queryCount = new Map<string, number>();

    history.forEach(item => {
      const query = item.query.toLowerCase();
      queryCount.set(query, (queryCount.get(query) || 0) + 1);
    });

    return Array.from(queryCount.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([query]) => query);
  },
};

// Recent foods cache
export const recentFoodsCache = {
  get(): RecentFoodItem[] {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem(STORAGE_KEYS.RECENT_FOODS);
    return safeJsonParse(stored, []);
  },

  add(food: Omit<RecentFoodItem, 'lastUsed' | 'frequency'>): void {
    if (typeof window === 'undefined') return;
    
    const recent = this.get();
    const existing = recent.findIndex(item => item.foodId === food.foodId);
    
    if (existing >= 0) {
      recent[existing] = {
        ...recent[existing],
        lastUsed: Date.now(),
        frequency: recent[existing].frequency + 1,
      };
    } else {
      recent.unshift({
        ...food,
        lastUsed: Date.now(),
        frequency: 1,
      });
    }

    // Keep only last 100 foods
    const trimmed = recent.slice(0, 100);
    localStorage.setItem(STORAGE_KEYS.RECENT_FOODS, safeJsonStringify(trimmed));
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.RECENT_FOODS);
  },

  getMostFrequent(limit = 20): RecentFoodItem[] {
    return this.get()
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit);
  },

  getMostRecent(limit = 20): RecentFoodItem[] {
    return this.get()
      .sort((a, b) => b.lastUsed - a.lastUsed)
      .slice(0, limit);
  },
};

// Dashboard layout preferences
export const dashboardLayout = {
  get() {
    if (typeof window === 'undefined') return userPreferences.get().dashboardLayout;
    
    const stored = localStorage.getItem(STORAGE_KEYS.DASHBOARD_LAYOUT);
    return safeJsonParse(stored, userPreferences.get().dashboardLayout);
  },

  set(layout: Partial<UserPreferences['dashboardLayout']>): void {
    if (typeof window === 'undefined') return;
    
    const current = this.get();
    const updated = { ...current, ...layout };
    localStorage.setItem(STORAGE_KEYS.DASHBOARD_LAYOUT, safeJsonStringify(updated));
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.DASHBOARD_LAYOUT);
  },
};

// Clear all app data
export function clearAllLocalData(): void {
  if (typeof window === 'undefined') return;
  
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}

// Get storage usage info
export function getStorageInfo() {
  if (typeof window === 'undefined') return null;
  
  const usage = Object.entries(STORAGE_KEYS).map(([name, key]) => {
    const value = localStorage.getItem(key);
    return {
      name,
      key,
      size: value ? new Blob([value]).size : 0,
      exists: !!value,
    };
  });

  const totalSize = usage.reduce((sum, item) => sum + item.size, 0);
  
  return {
    items: usage,
    totalSize,
    totalSizeFormatted: `${(totalSize / 1024).toFixed(2)} KB`,
  };
}