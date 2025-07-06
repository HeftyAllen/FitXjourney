// Nutrition API Integration
// Enhanced API with better error handling and improved food database

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

// Enhanced Food Database with accurate nutrition data and common variations
const ENHANCED_FOOD_DATABASE = {
  // Poultry
  "chicken breast": { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 },
  "chicken breast cooked": { calories: 185, protein: 35, carbs: 0, fat: 4, fiber: 0 },
  "chicken breast grilled": { calories: 185, protein: 35, carbs: 0, fat: 4, fiber: 0 },
  "chicken breast baked": { calories: 185, protein: 35, carbs: 0, fat: 4, fiber: 0 },
  "chicken breast raw": { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 },
  "chicken breast skinless": { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 },
  "chicken thigh": { calories: 209, protein: 26, carbs: 0, fat: 11, fiber: 0 },
  "chicken thigh skinless": { calories: 179, protein: 25, carbs: 0, fat: 8, fiber: 0 },
  "chicken wing": { calories: 203, protein: 30, carbs: 0, fat: 8, fiber: 0 },
  "rotisserie chicken": { calories: 190, protein: 29, carbs: 0, fat: 7, fiber: 0 },
  "fried chicken": { calories: 320, protein: 19, carbs: 8, fat: 20, fiber: 0 },
  "fried chicken breast": { calories: 280, protein: 22, carbs: 6, fat: 18, fiber: 0 },
  "grilled chicken": { calories: 185, protein: 35, carbs: 0, fat: 4, fiber: 0 },
  "turkey breast": { calories: 135, protein: 30, carbs: 0, fat: 1, fiber: 0 },
  "ground turkey": { calories: 200, protein: 27, carbs: 0, fat: 9, fiber: 0 },

  // Fish & Seafood
  "salmon": { calories: 208, protein: 22, carbs: 0, fat: 12, fiber: 0 },
  "salmon fillet": { calories: 206, protein: 22, carbs: 0, fat: 12, fiber: 0 },
  "grilled salmon": { calories: 231, protein: 25, carbs: 0, fat: 14, fiber: 0 },
  "baked salmon": { calories: 231, protein: 25, carbs: 0, fat: 14, fiber: 0 },
  "salmon cooked": { calories: 231, protein: 25, carbs: 0, fat: 14, fiber: 0 },
  "tuna": { calories: 144, protein: 30, carbs: 0, fat: 1, fiber: 0 },
  "canned tuna": { calories: 154, protein: 25, carbs: 0, fat: 6, fiber: 0 },
  "tuna in water": { calories: 109, protein: 25, carbs: 0, fat: 1, fiber: 0 },
  "cod": { calories: 105, protein: 23, carbs: 0, fat: 1, fiber: 0 },
  "shrimp": { calories: 85, protein: 20, carbs: 0, fat: 1, fiber: 0 },
  "tilapia": { calories: 96, protein: 20, carbs: 0, fat: 2, fiber: 0 },

  // Meat
  "beef": { calories: 250, protein: 26, carbs: 0, fat: 15, fiber: 0 },
  "ground beef": { calories: 332, protein: 25, carbs: 0, fat: 25, fiber: 0 },
  "lean beef": { calories: 201, protein: 26, carbs: 0, fat: 10, fiber: 0 },
  "beef sirloin": { calories: 158, protein: 26, carbs: 0, fat: 5, fiber: 0 },
  "pork": { calories: 242, protein: 27, carbs: 0, fat: 14, fiber: 0 },
  "pork chop": { calories: 231, protein: 23, carbs: 0, fat: 15, fiber: 0 },
  "pork tenderloin": { calories: 147, protein: 26, carbs: 0, fat: 4, fiber: 0 },
  "bacon": { calories: 541, protein: 37, carbs: 1, fat: 42, fiber: 0 },

  // Eggs & Dairy
  "eggs": { calories: 155, protein: 13, carbs: 1, fat: 11, fiber: 0 },
  "egg": { calories: 78, protein: 6, carbs: 1, fat: 5, fiber: 0 },
  "whole egg": { calories: 78, protein: 6, carbs: 1, fat: 5, fiber: 0 },
  "egg white": { calories: 17, protein: 4, carbs: 0, fat: 0, fiber: 0 },
  "egg yolk": { calories: 55, protein: 3, carbs: 1, fat: 4, fiber: 0 },
  "milk": { calories: 42, protein: 3.4, carbs: 5, fat: 1, fiber: 0 },
  "whole milk": { calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, fiber: 0 },
  "skim milk": { calories: 34, protein: 3.4, carbs: 5, fat: 0.2, fiber: 0 },
  "2% milk": { calories: 50, protein: 3.3, carbs: 5, fat: 2, fiber: 0 },
  "yogurt": { calories: 59, protein: 10, carbs: 3.6, fat: 0.4, fiber: 0 },
  "greek yogurt": { calories: 100, protein: 17, carbs: 6, fat: 0.4, fiber: 0 },
  "plain greek yogurt": { calories: 100, protein: 17, carbs: 6, fat: 0.4, fiber: 0 },
  "cheese": { calories: 113, protein: 7, carbs: 1, fat: 9, fiber: 0 },
  "cheddar cheese": { calories: 403, protein: 25, carbs: 1, fat: 33, fiber: 0 },
  "cottage cheese": { calories: 98, protein: 11, carbs: 3, fat: 4, fiber: 0 },

  // Grains & Carbs
  "rice": { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4 },
  "brown rice": { calories: 112, protein: 2.6, carbs: 23, fat: 0.9, fiber: 1.8 },
  "white rice": { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4 },
  "rice cooked": { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4 },
  "basmati rice": { calories: 121, protein: 3, carbs: 25, fat: 0.4, fiber: 0.7 },
  "pasta": { calories: 131, protein: 5, carbs: 25, fat: 1.1, fiber: 1.8 },
  "whole wheat pasta": { calories: 124, protein: 5, carbs: 26, fat: 0.5, fiber: 3.2 },
  "spaghetti": { calories: 131, protein: 5, carbs: 25, fat: 1.1, fiber: 1.8 },
  "bread": { calories: 265, protein: 9, carbs: 49, fat: 3.2, fiber: 2.7 },
  "whole wheat bread": { calories: 247, protein: 13, carbs: 41, fat: 4, fiber: 6 },
  "white bread": { calories: 265, protein: 9, carbs: 49, fat: 3.2, fiber: 2.7 },
  "quinoa": { calories: 120, protein: 4.4, carbs: 22, fat: 1.9, fiber: 2.8 },
  "oats": { calories: 389, protein: 17, carbs: 66, fat: 7, fiber: 10 },
  "oatmeal": { calories: 68, protein: 2.4, carbs: 12, fat: 1.4, fiber: 1.7 },

  // Vegetables
  "potato": { calories: 77, protein: 2, carbs: 17, fat: 0.1, fiber: 2.2 },
  "sweet potato": { calories: 86, protein: 1.6, carbs: 20, fat: 0.1, fiber: 3 },
  "baked potato": { calories: 93, protein: 2.1, carbs: 21, fat: 0.1, fiber: 2.2 },
  "broccoli": { calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6 },
  "spinach": { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2 },
  "carrots": { calories: 41, protein: 0.9, carbs: 10, fat: 0.2, fiber: 2.8 },
  "tomato": { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2 },
  "lettuce": { calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2, fiber: 1.3 },
  "cucumber": { calories: 16, protein: 0.7, carbs: 4, fat: 0.1, fiber: 0.5 },
  "bell pepper": { calories: 31, protein: 1, carbs: 7, fat: 0.3, fiber: 2.5 },
  "onion": { calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7 },

  // Fruits
  "banana": { calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6 },
  "apple": { calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4 },
  "orange": { calories: 47, protein: 0.9, carbs: 12, fat: 0.1, fiber: 2.4 },
  "grapes": { calories: 62, protein: 0.6, carbs: 16, fat: 0.2, fiber: 0.9 },
  "strawberries": { calories: 32, protein: 0.7, carbs: 8, fat: 0.3, fiber: 2 },
  "blueberries": { calories: 57, protein: 0.7, carbs: 14, fat: 0.3, fiber: 2.4 },
  "avocado": { calories: 160, protein: 2, carbs: 9, fat: 15, fiber: 7 },

  // Nuts & Seeds
  "almonds": { calories: 579, protein: 21, carbs: 22, fat: 50, fiber: 12 },
  "walnuts": { calories: 654, protein: 15, carbs: 14, fat: 65, fiber: 7 },
  "peanuts": { calories: 567, protein: 26, carbs: 16, fat: 49, fiber: 8 },
  "cashews": { calories: 553, protein: 18, carbs: 30, fat: 44, fiber: 3 },
  "peanut butter": { calories: 588, protein: 25, carbs: 20, fat: 50, fiber: 6 },
  "almond butter": { calories: 614, protein: 21, carbs: 19, fat: 56, fiber: 12 },

  // Legumes
  "beans": { calories: 127, protein: 8, carbs: 23, fat: 0.5, fiber: 6 },
  "black beans": { calories: 132, protein: 8.9, carbs: 24, fat: 0.5, fiber: 8.7 },
  "kidney beans": { calories: 127, protein: 8.7, carbs: 23, fat: 0.5, fiber: 6.4 },
  "chickpeas": { calories: 164, protein: 8.9, carbs: 27, fat: 2.6, fiber: 7.6 },
  "lentils": { calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 7.9 },

  // Common recipes/prepared foods
  "chicken salad": { calories: 200, protein: 18, carbs: 6, fat: 12, fiber: 2 },
  "tuna salad": { calories: 187, protein: 16, carbs: 9, fat: 10, fiber: 1 },
  "grilled chicken salad": { calories: 150, protein: 25, carbs: 8, fat: 3, fiber: 3 },
  "caesar salad": { calories: 170, protein: 3, carbs: 13, fat: 13, fiber: 3 },
  "chicken caesar salad": { calories: 350, protein: 30, carbs: 15, fat: 20, fiber: 3 },
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

  // Search for ingredients with enhanced autocomplete
  async searchIngredients(query, number = 10, metaInformation = true) {
    // First check local database for instant results
    const localResults = this.searchLocalFoodDatabase(query, number);
    
    if (localResults.length > 0) {
      return { results: localResults };
    }

    // Fall back to API if no local results
    try {
      const params = {
        query,
        number,
        metaInformation,
      };

      return this.makeRequest(this.endpoints.ingredientInformation, params);
    } catch (error) {
      console.warn("API search failed, using local database only:", error);
      return { results: [] };
    }
  }

  // Enhanced local food database search
  searchLocalFoodDatabase(query, limit = 10) {
    const normalizedQuery = query.toLowerCase().trim();
    const results = [];

    for (const [foodName, nutrition] of Object.entries(ENHANCED_FOOD_DATABASE)) {
      let score = 0;

      // Exact match gets highest score
      if (foodName === normalizedQuery) {
        score = 100;
      }
      // Food name starts with query
      else if (foodName.startsWith(normalizedQuery)) {
        score = 90;
      }
      // Food name contains query
      else if (foodName.includes(normalizedQuery)) {
        score = 80;
      }
      // Query contains food name (reverse match)
      else if (normalizedQuery.includes(foodName)) {
        score = 70;
      }
      // Check individual words
      else {
        const queryWords = normalizedQuery.split(" ");
        const foodWords = foodName.split(" ");

        for (const queryWord of queryWords) {
          for (const foodWord of foodWords) {
            if (queryWord === foodWord) {
              score += 30;
            } else if (queryWord.includes(foodWord) || foodWord.includes(queryWord)) {
              score += 15;
            }
          }
        }
      }

      if (score > 0) {
        results.push({
          id: foodName.replace(/\s+/g, '_'),
          name: foodName,
          score,
          nutrition: {
            calories: nutrition.calories,
            protein: nutrition.protein,
            carbs: nutrition.carbs,
            fat: nutrition.fat,
            fiber: nutrition.fiber || 0
          }
        });
      }
    }

    // Sort by score and return top results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Autocomplete ingredient search
  async autocompleteIngredient(query, number = 10) {
    // Use local database for instant autocomplete
    const localResults = this.searchLocalFoodDatabase(query, number);
    
    if (localResults.length > 0) {
      return localResults.map(result => ({
        name: result.name,
        image: `https://spoonacular.com/ingredientImages/${result.id}-100x100.jpg`
      }));
    }

    // Fall back to API
    try {
      const params = {
        query,
        number,
      };

      return this.makeRequest(this.endpoints.autocompleteIngredient, params);
    } catch (error) {
      console.warn("Autocomplete API failed:", error);
      return [];
    }
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
  ENHANCED_FOOD_DATABASE,
  calculateBMR,
  calculateTDEE,
  calculateCalorieGoal,
  calculateMacronutrients
};