// Nutrition API Integration
// This file handles Spoonacular API integration and nutrition tracking functions

// Spoonacular API Configuration
const NUTRITION_CONFIG = {
  // Spoonacular API Configuration
  spoonacular: {
    apiKey: "e65fd7fb2e8c41e8aacabf4b6da43a1e", // Your Spoonacular API key
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
  }
};

class NutritionAPI {
  constructor(config) {
    this.config = config;
    this.baseUrl = config.spoonacular.baseUrl;
    this.apiKey = config.spoonacular.apiKey;
    this.endpoints = config.spoonacular.endpoints;
    this.defaultParams = config.spoonacular.defaultParams;
    this.rateLimit = config.spoonacular.rateLimit;
  }

  // Build URL with query parameters
  buildUrl(endpoint, params = {}) {
    const url = new URL(this.baseUrl + endpoint);

    // Add API key
    url.searchParams.append("apiKey", this.apiKey);

    // Add default parameters
    for (const [key, value] of Object.entries(this.defaultParams)) {
      if (!params[key]) {
        url.searchParams.append(key, value);
      }
    }

    // Add custom parameters
    for (const [key, value] of Object.entries(params)) {
      if (Array.isArray(value)) {
        value.forEach((item) => url.searchParams.append(key, item));
      } else {
        url.searchParams.append(key, value);
      }
    }

    return url.toString();
  }

  // Make API request with error handling
  async makeRequest(endpoint, params = {}, options = {}) {
    try {
      // Build URL
      const url = this.buildUrl(endpoint, params);

      // Make request
      const response = await fetch(url, options);

      // Check for errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API request failed with status ${response.status}`);
      }

      // Parse response
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API Request Error:", error);
      throw error;
    }
  }

  // Search recipes with various filters
  async searchRecipes(query, filters = {}) {
    const params = {
      query,
      ...filters,
    };

    return this.makeRequest(this.endpoints.searchRecipes, params);
  }

  // Get detailed recipe information by ID
  async getRecipeInformation(id, includeNutrition = true) {
    const params = {
      includeNutrition,
    };

    return this.makeRequest(`/recipes/${id}/information`, params);
  }

  // Get recipe nutrition information by ID
  async getRecipeNutrition(id) {
    return this.makeRequest(`/recipes/${id}/nutritionWidget.json`);
  }

  // Get similar recipes
  async getSimilarRecipes(id, number = 5) {
    const params = {
      number,
    };

    return this.makeRequest(`/recipes/${id}/similar`, params);
  }

  // Generate a meal plan
  async generateMealPlan(timeFrame = "day", targetCalories = 2000, diet = "", exclude = "") {
    const params = {
      timeFrame,
      targetCalories,
      diet,
      exclude,
    };

    return this.makeRequest(this.endpoints.generateMealPlan, params);
  }

  // Search for ingredients
  async searchIngredients(query, number = 10, metaInformation = true) {
    const params = {
      query,
      number,
      metaInformation,
    };

    return this.makeRequest(this.endpoints.ingredientInformation, params);
  }

  // Autocomplete ingredient search
  async autocompleteIngredient(query, number = 10) {
    const params = {
      query,
      number,
    };

    return this.makeRequest(this.endpoints.autocompleteIngredient, params);
  }

  // Get random recipes
  async getRandomRecipes(number = 10, tags = []) {
    const params = {
      number,
      tags: tags.join(","),
    };

    return this.makeRequest("/recipes/random", params);
  }

  // Search recipes by ingredients
  async searchRecipesByIngredients(ingredients, number = 10, ranking = 1, ignorePantry = true) {
    const params = {
      ingredients: ingredients.join(","),
      number,
      ranking,
      ignorePantry,
    };

    return this.makeRequest("/recipes/findByIngredients", params);
  }
}

// Create and export the API service instance
const nutritionAPI = new NutritionAPI(NUTRITION_CONFIG);

// Nutrition tracking helper functions
function calculateBMR(gender, weight, height, age) {
  // Mifflin-St Jeor Equation
  if (gender === "male") {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
}

function calculateTDEE(bmr, activityLevel) {
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    "very-active": 1.9,
  };

  return Math.round(bmr * activityMultipliers[activityLevel]);
}

function calculateCalorieGoal(tdee, goal) {
  const goalAdjustments = {
    maintain: 0,
    "lose-0.5": -500,
    "lose-1": -1000,
    "gain-0.5": 500,
    "gain-1": 1000,
  };

  return tdee + goalAdjustments[goal];
}

function calculateMacronutrients(calorieGoal, macroRatios) {
  const { protein, carbs, fat } = macroRatios;
  const caloriesPerGram = NUTRITION_CONFIG.nutrition.caloriesPerGram;

  return {
    protein: Math.round((calorieGoal * protein) / caloriesPerGram.protein),
    carbs: Math.round((calorieGoal * carbs) / caloriesPerGram.carbs),
    fat: Math.round((calorieGoal * fat) / caloriesPerGram.fat),
  };
}

// Export functions and objects
export {
  nutritionAPI,
  NUTRITION_CONFIG,
  calculateBMR,
  calculateTDEE,
  calculateCalorieGoal,
  calculateMacronutrients
};