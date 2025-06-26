// Nutrition Configuration File
// Contains API keys, endpoints, and configuration settings

const NUTRITION_CONFIG = {
  // Spoonacular API Configuration
  spoonacular: {
    apiKey: "e65fd7fb2e8c41e8aacabf4b6da43a1e", // Replace with your actual API key
    baseUrl: "https://api.spoonacular.com",
    endpoints: {
      searchRecipes: "/recipes/complexSearch",
      recipeInformation: "/recipes/information",
      recipeNutrition: "/recipes/nutritionWidget.json",
      ingredientInformation: "/food/ingredients/search",
      analyzeRecipe: "/recipes/analyze",
      generateMealPlan: "/mealplanner/generate",
      quickAnswer: "/recipes/quickAnswer",
      parseIngredients: "/recipes/parseIngredients",
      autocompleteIngredient: "/food/ingredients/autocomplete",
      autocompleteRecipe: "/recipes/autocomplete",
      visualizeNutrition: "/recipes/visualizeNutrition",
      convertAmounts: "/recipes/convert",
      guessNutrition: "/recipes/guessNutrition",
      summarizeRecipe: "/recipes/summarize",
      equipmentByID: "/recipes/{id}/equipmentWidget.json",
      priceBreakdownByID: "/recipes/{id}/priceBreakdownWidget.json",
      similarRecipes: "/recipes/{id}/similar",
      wineRecommendation: "/food/wine/recommendation",
      winePairing: "/food/wine/pairing",
      foodVideos: "/food/videos/search",
    },
    // Default parameters for API requests
    defaultParams: {
      addRecipeInformation: true,
      addRecipeNutrition: true,
      fillIngredients: true,
      instructionsRequired: true,
      number: 12,
    },
    // Rate limiting settings
    rateLimit: {
      maxRequestsPerDay: 150,
      requestsRemaining: 150,
      resetTime: null,
    },
  },

  // Nutrition tracking defaults
  nutrition: {
    // Default daily goals
    defaultGoals: {
      calories: 2000,
      protein: 150, // grams
      carbs: 200, // grams
      fat: 67, // grams
      fiber: 30, // grams
      sugar: 25, // grams
      water: 2000, // ml
    },

    // Macronutrient ratios (percentage of total calories)
    macroRatios: {
      protein: 0.3, // 30%
      carbs: 0.4, // 40%
      fat: 0.3, // 30%
    },

    // Calories per gram of macronutrients
    caloriesPerGram: {
      protein: 4,
      carbs: 4,
      fat: 9,
      alcohol: 7,
    },
  },

  // User preferences (will be overridden by user settings)
  preferences: {
    theme: "dark", // "dark" or "light"
    measurementSystem: "metric", // "metric" or "imperial"
    language: "en", // ISO language code
    currency: "USD", // ISO currency code
    dietType: "", // vegetarian, vegan, etc.
    allergies: [], // List of allergies
    excludeIngredients: [], // List of ingredients to exclude
  },

  // Local storage keys
  storage: {
    userProfile: "nutrition_user_profile",
    nutritionGoals: "nutrition_goals",
    foodLog: "nutrition_food_log",
    mealPlan: "nutrition_meal_plan",
    favoriteRecipes: "nutrition_favorite_recipes",
    groceryList: "nutrition_grocery_list",
    userPreferences: "nutrition_preferences",
    searchHistory: "nutrition_search_history",
    apiUsage: "nutrition_api_usage",
  },

  // Chart colors and styling
  charts: {
    colors: {
      protein: "#3498db", // Blue
      carbs: "#e74c3c", // Red
      fat: "#f1c40f", // Yellow
      fiber: "#2ecc71", // Green
      sugar: "#9b59b6", // Purple
      water: "#1abc9c", // Teal
      calories: "#e67e22", // Orange
      remaining: "#95a5a6", // Gray
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding: 20,
            boxWidth: 12,
            usePointStyle: true,
          },
        },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          padding: 12,
          titleFont: {
            size: 14,
          },
          bodyFont: {
            size: 13,
          },
        },
      },
    },
  },
}

// Export the configuration
if (typeof module !== "undefined" && module.exports) {
  module.exports = NUTRITION_CONFIG
}
