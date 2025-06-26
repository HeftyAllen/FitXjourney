// Enhanced Nutrition Dashboard JavaScript with Firebase Integration
// Implements comprehensive functionality for the nutrition tracker

import {
  nutritionAPI,
  NUTRITION_CONFIG,
  calculateBMR,
  calculateTDEE,
  calculateCalorieGoal,
  calculateMacronutrients,
} from "./nutrition-api.js"

// Import Firebase modules
import { auth, db } from "./user-auth.js"
import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js"
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js"

class NutritionTracker {
  constructor() {
    this.currentSection = "dashboard"
    this.sidebarOpen = false
    this.currentDate = new Date()
    this.dailyCalorieGoal = 2000
    this.totalCalories = 0
    this.totalProtein = 0
    this.totalCarbs = 0
    this.totalFat = 0
    this.totalWater = 0
    this.foodItems = []
    this.favoriteRecipes = []
    this.selectedMealType = "breakfast"
    this.waterIntake = 0
    this.currentUser = null
    this.userProfile = null
    this.mealPlanTemplates = []

    this.init()
  }

  async init() {
    this.setupEventListeners()
    await this.initializeFirebaseAuth()
    this.updateCurrentDate()
    this.updateCalorieProgress()
    this.loadRandomRecipes()
    this.showInitialSection()
  }

  async initializeFirebaseAuth() {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          this.currentUser = user
          await this.loadUserProfile()
          await this.loadUserData()
          this.displayLoginName()
          resolve()
        } else {
          this.currentUser = null
          this.userProfile = null
          this.loadUserData() // Load from localStorage as fallback
          this.displayLoginName()
          resolve()
        }
      })
    })
  }

  async loadUserProfile() {
    if (!this.currentUser) return

    try {
      const userDoc = await getDoc(doc(db, "users", this.currentUser.uid))
      if (userDoc.exists()) {
        this.userProfile = userDoc.data()
        this.autoFillUserInfo()
      }
    } catch (error) {
      console.error("Error loading user profile:", error)
    }
  }

  autoFillUserInfo() {
    if (!this.userProfile) return

    // Auto-fill nutrition goals form if user data exists
    const ageField = document.getElementById("age")
    const genderField = document.getElementById("gender")
    const heightField = document.getElementById("height")
    const weightField = document.getElementById("weight")
    const activityField = document.getElementById("activity")

    if (this.userProfile.dob && ageField) {
      const age = new Date().getFullYear() - new Date(this.userProfile.dob).getFullYear()
      ageField.value = age
    }

    if (this.userProfile.gender && genderField) {
      genderField.value = this.userProfile.gender
    }

    if (this.userProfile.height && heightField) {
      heightField.value = this.userProfile.height
    }

    if (this.userProfile.weight && weightField) {
      weightField.value = this.userProfile.weight
    }

    if (this.userProfile.activityLevel && activityField) {
      activityField.value = this.userProfile.activityLevel
    }

    // Auto-calculate nutrition goals if we have the data
    if (this.userProfile.weight && this.userProfile.height && this.userProfile.gender) {
      setTimeout(() => this.calculateNutritionGoals(), 1000)
    }
  }

  setupEventListeners() {
    // Sidebar toggle
    document.getElementById("sidebarToggle")?.addEventListener("click", () => {
      this.toggleSidebar()
    })

    document.getElementById("sidebarOverlay")?.addEventListener("click", () => {
      this.closeSidebar()
    })

    // User dropdown
    document.getElementById("userProfile")?.addEventListener("click", (e) => {
      e.stopPropagation()
      this.toggleUserDropdown()
    })

    document.addEventListener("click", () => {
      this.closeUserDropdown()
    })

    // Navigation
    document.querySelectorAll(".sidebar-nav-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault()
        const section = link.dataset.section
        if (section) {
          this.navigateToSection(section)
        }
      })
    })

    // Food log form
    document.getElementById("food-log-form")?.addEventListener("submit", (e) => {
      e.preventDefault()
      this.addFoodEntry()
    })

    document.getElementById("reset-food-btn")?.addEventListener("click", () => {
      this.resetFoodForm()
    })

    // Nutrition goals form
    document.getElementById("calculate-btn")?.addEventListener("click", () => {
      this.calculateNutritionGoals()
    })

    document.getElementById("edit-goals-btn")?.addEventListener("click", () => {
      this.toggleGoalsForm()
    })

    // Meal buttons
    document.querySelectorAll(".meal-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.selectMeal(btn.dataset.meal)
      })
    })

    // Quick actions
    document.getElementById("quickAddFood")?.addEventListener("click", () => {
      this.navigateToSection("food-log")
      this.showToast("Quick add food feature - redirecting to food log!", "info")
    })

    document.getElementById("scanBarcode")?.addEventListener("click", () => {
      this.showToast("Barcode scanning feature coming soon!", "info")
    })

    document.getElementById("waterTracker")?.addEventListener("click", () => {
      this.logWater()
    })

    document.getElementById("weightTracker")?.addEventListener("click", () => {
      this.logWeight()
    })

    // Chat bot
    document.getElementById("chat-toggle")?.addEventListener("click", () => {
      this.toggleChatbot()
    })

    document.getElementById("close-chat")?.addEventListener("click", () => {
      this.closeChatbot()
    })

    document.getElementById("send-chat")?.addEventListener("click", () => {
      this.sendChatMessage()
    })

    document.getElementById("chat-input")?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.sendChatMessage()
      }
    })

    // Generate meal plan
    document.getElementById("generate-meal-plan")?.addEventListener("click", () => {
      this.generateMealPlan()
    })

    // Recipe actions
    document.querySelector(".btn-random-recipe")?.addEventListener("click", () => {
      this.loadRandomRecipes()
    })

    document.getElementById("search-recipe-btn")?.addEventListener("click", () => {
      const query = document.getElementById("recipe-search")?.value.trim()
      if (query) {
        this.searchRecipes(query)
      }
    })

    document.getElementById("recipe-search")?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const query = e.target.value.trim()
        if (query) {
          this.searchRecipes(query)
        }
      }
    })

    // Food search
    document.getElementById("search-food-btn")?.addEventListener("click", () => {
      const query = document.getElementById("food-search")?.value.trim()
      if (query) {
        this.searchFoodItem(query)
      }
    })

    document.getElementById("food-search")?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const query = e.target.value.trim()
        if (query) {
          this.searchFoodItem(query)
        }
      }
    })

    // Food item input for nutrition preview
    document.getElementById("food-item")?.addEventListener("input", (e) => {
      this.searchFood(e.target.value)
    })

    // Section tabs
    document.querySelectorAll(".section-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".section-tab").forEach((t) => t.classList.remove("active"))
        tab.classList.add("active")
        const tabName = tab.getAttribute("data-tab")
        this.handleTabChange(tabName)
      })
    })

    // Date navigation
    document.getElementById("prevDay")?.addEventListener("click", () => {
      this.changeDate(-1)
    })

    document.getElementById("nextDay")?.addEventListener("click", () => {
      this.changeDate(1)
    })

    // Product search
    document.getElementById("product-search-btn")?.addEventListener("click", () => {
      this.searchProduct()
    })

    document.getElementById("product-search-input")?.addEventListener("input", (e) => {
      this.handleProductAutocomplete(e.target.value)
    })

    // Theme toggle
    document.getElementById("theme-toggle-btn")?.addEventListener("click", () => {
      this.toggleTheme()
    })
  }

  // ====================================================
  // Navigation & UI Management
  // ====================================================

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen
    const sidebar = document.getElementById("sidebar")
    const overlay = document.getElementById("sidebarOverlay")
    const mainWrapper = document.getElementById("mainWrapper")

    if (this.sidebarOpen) {
      sidebar?.classList.add("active")
      overlay?.classList.add("active")
      if (window.innerWidth > 1200) {
        mainWrapper?.classList.add("sidebar-open")
      }
    } else {
      this.closeSidebar()
    }
  }

  closeSidebar() {
    this.sidebarOpen = false
    document.getElementById("sidebar")?.classList.remove("active")
    document.getElementById("sidebarOverlay")?.classList.remove("active")
    document.getElementById("mainWrapper")?.classList.remove("sidebar-open")
  }

  toggleUserDropdown() {
    const profile = document.getElementById("userProfile")
    const dropdown = document.getElementById("userDropdown")

    profile?.classList.toggle("active")
    dropdown?.classList.toggle("active")
  }

  closeUserDropdown() {
    document.getElementById("userProfile")?.classList.remove("active")
    document.getElementById("userDropdown")?.classList.remove("active")
  }

  navigateToSection(sectionName) {
    // Hide all sections
    document.querySelectorAll(".content-section").forEach((section) => {
      section.classList.remove("active")
    })

    // Show target section
    const targetSection = document.getElementById(`${sectionName}-section`)
    if (targetSection) {
      targetSection.classList.add("active")
    }

    // Update navigation
    document.querySelectorAll(".sidebar-nav-link").forEach((link) => {
      link.classList.remove("active")
    })

    const activeLink = document.querySelector(`[data-section="${sectionName}"]`)
    if (activeLink) {
      activeLink.classList.add("active")
    }

    this.currentSection = sectionName
    this.closeSidebar()

    // Load section-specific data
    this.loadSectionData(sectionName)
  }

  loadSectionData(sectionName) {
    switch (sectionName) {
      case "recipes":
        if (document.getElementById("recipe-cards").children.length <= 1) {
          this.loadRandomRecipes()
        }
        break
      case "food-log":
        this.updateFoodLog()
        break
      case "dashboard":
        this.updateDashboard()
        break
    }
  }

  showInitialSection() {
    // Show dashboard by default
    document.querySelectorAll(".content-section").forEach((section) => {
      section.classList.remove("active")
    })
    document.getElementById("dashboard-section")?.classList.add("active")
  }

  // ====================================================
  // User Data Management
  // ====================================================

  displayLoginName() {
    const userNameElement = document.querySelector(".user-name")
    if (userNameElement) {
      if (this.currentUser && this.userProfile) {
        userNameElement.textContent = this.userProfile.fullName || this.currentUser.displayName || "User"
      } else if (this.currentUser) {
        userNameElement.textContent = this.currentUser.displayName || this.currentUser.email || "User"
      } else {
        // Fallback to localStorage for guest users
        const user = JSON.parse(localStorage.getItem("loggedInUser") || "{}")
        userNameElement.textContent = user?.name || "Guest"
      }
    }
  }

  async loadUserData() {
    if (!this.currentUser) {
      this.loadFromLocalStorage()
      return
    }

    try {
      const userDataRef = doc(db, "nutrition_data", this.currentUser.uid)
      const userDataDoc = await getDoc(userDataRef)

      if (userDataDoc.exists()) {
        const data = userDataDoc.data()

        // Load nutrition goals
        if (data.goals) {
          this.dailyCalorieGoal = data.goals.calories || 2000
          this.updateNutritionGoalDisplays(data.goals)
        }

        // Load food log entries for today
        const todayStr = this.formatDate(new Date())
        if (data.foodLog && data.foodLog[todayStr]) {
          this.foodItems = data.foodLog[todayStr]
          this.calculateTotals()
          this.updateCalorieProgress()
          this.updateFoodLog()
        }

        // Load favorite recipes
        if (data.favoriteRecipes) {
          this.favoriteRecipes = data.favoriteRecipes
        }

        // Load water intake
        if (data.waterIntake && data.waterIntake[todayStr]) {
          this.waterIntake = data.waterIntake[todayStr]
          this.updateWaterDisplay()
        }
      } else {
        // No Firebase data, try localStorage
        this.loadFromLocalStorage()
      }
    } catch (error) {
      console.error("Error loading user data from Firebase:", error)
      // Fallback to localStorage
      this.loadFromLocalStorage()
    }
  }

  loadFromLocalStorage() {
    try {
      // Load nutrition goals
      const savedGoals = localStorage.getItem("nutrition_goals")
      if (savedGoals) {
        const goals = JSON.parse(savedGoals)
        this.dailyCalorieGoal = goals.calories || 2000
        this.updateNutritionGoalDisplays(goals)
      }

      // Load food log entries for today
      const savedFoodLog = localStorage.getItem("nutrition_food_log")
      if (savedFoodLog) {
        const allEntries = JSON.parse(savedFoodLog)
        const todayStr = this.formatDate(new Date())
        const todayEntries = allEntries[todayStr] || []

        if (todayEntries.length > 0) {
          this.foodItems = todayEntries
          this.calculateTotals()
          this.updateCalorieProgress()
          this.updateFoodLog()
        }
      }

      // Load favorite recipes
      const savedFavorites = localStorage.getItem("nutrition_favorite_recipes")
      if (savedFavorites) {
        const favorites = JSON.parse(savedFavorites)
        this.favoriteRecipes = favorites
      }

      // Load water intake
      const savedWater = localStorage.getItem("water_intake_" + this.formatDate(new Date()))
      if (savedWater) {
        this.waterIntake = Number.parseInt(savedWater)
        this.updateWaterDisplay()
      }
    } catch (error) {
      console.error("Error loading saved nutrition data from localStorage:", error)
    }
  }

  async saveUserData() {
    if (!this.currentUser) {
      // Fallback to localStorage if not logged in
      this.saveToLocalStorage()
      return
    }

    try {
      const userDataRef = doc(db, "nutrition_data", this.currentUser.uid)
      const todayStr = this.formatDate(new Date())

      const nutritionData = {
        goals: {
          calories: this.dailyCalorieGoal,
          protein: document.getElementById("protein-goal")?.textContent || 150,
          carbs: document.getElementById("carbs-goal")?.textContent || 200,
          fat: document.getElementById("fat-goal")?.textContent || 67,
          calculatedOn: new Date().toISOString(),
        },
        foodLog: {
          [todayStr]: this.foodItems,
        },
        favoriteRecipes: this.favoriteRecipes,
        waterIntake: {
          [todayStr]: this.waterIntake,
        },
        lastUpdated: serverTimestamp(),
      }

      await setDoc(userDataRef, nutritionData, { merge: true })

      // Also save to localStorage as backup
      this.saveToLocalStorage()
    } catch (error) {
      console.error("Error saving user data to Firebase:", error)
      // Fallback to localStorage
      this.saveToLocalStorage()
    }
  }

  saveToLocalStorage() {
    try {
      const goals = {
        calories: this.dailyCalorieGoal,
        protein: document.getElementById("protein-goal")?.textContent || 150,
        carbs: document.getElementById("carbs-goal")?.textContent || 200,
        fat: document.getElementById("fat-goal")?.textContent || 67,
        calculatedOn: new Date().toISOString(),
      }
      localStorage.setItem("nutrition_goals", JSON.stringify(goals))

      const savedFoodLog = localStorage.getItem("nutrition_food_log")
      const allEntries = savedFoodLog ? JSON.parse(savedFoodLog) : {}
      const todayStr = this.formatDate(new Date())
      allEntries[todayStr] = this.foodItems
      localStorage.setItem("nutrition_food_log", JSON.stringify(allEntries))

      localStorage.setItem("nutrition_favorite_recipes", JSON.stringify(this.favoriteRecipes))
      localStorage.setItem("water_intake_" + this.formatDate(new Date()), this.waterIntake.toString())
    } catch (error) {
      console.error("Error saving user data to localStorage:", error)
    }
  }

  // ====================================================
  // Date Management
  // ====================================================

  updateCurrentDate() {
    const currentDateElement = document.getElementById("current-date")
    if (currentDateElement) {
      const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" }
      currentDateElement.textContent = this.currentDate.toLocaleDateString("en-US", options)
    }
  }

  formatDate(date) {
    const d = new Date(date)
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    const year = d.getFullYear()
    return `${year}-${month}-${day}`
  }

  changeDate(days) {
    this.currentDate.setDate(this.currentDate.getDate() + days)
    this.updateCurrentDate()
    this.loadFoodLogForDate()
    this.showToast(`Viewing ${days > 0 ? "next" : "previous"} day`, "info")
  }

  async loadFoodLogForDate() {
    const dateStr = this.formatDate(this.currentDate)

    if (this.currentUser) {
      try {
        const userDataRef = doc(db, "nutrition_data", this.currentUser.uid)
        const userDataDoc = await getDoc(userDataRef)

        if (userDataDoc.exists()) {
          const data = userDataDoc.data()
          if (data.foodLog && data.foodLog[dateStr]) {
            this.foodItems = data.foodLog[dateStr]
            this.calculateTotals()
            this.updateCalorieProgress()
            this.updateFoodLog()
            return
          }
        }
      } catch (error) {
        console.error("Error loading food log for date from Firebase:", error)
      }
    }

    // Fallback to localStorage
    try {
      const savedFoodLog = localStorage.getItem("nutrition_food_log")
      if (savedFoodLog) {
        const allEntries = JSON.parse(savedFoodLog)
        const dateEntries = allEntries[dateStr] || []

        this.foodItems = dateEntries
        this.calculateTotals()
        this.updateCalorieProgress()
        this.updateFoodLog()
      }
    } catch (error) {
      console.error("Error loading food log for date:", error)
    }
  }

  // ====================================================
  // Enhanced Food Database & Search
  // ====================================================

  async searchFoodItem(query) {
    try {
      const foodItemElement = document.getElementById("food-item")
      if (foodItemElement) foodItemElement.value = "Searching..."

      // Enhanced food database with more accurate nutrition data
      const foodDatabase = {
        "chicken breast": { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
        "chicken breast grilled": { calories: 185, protein: 35, carbs: 0, fat: 4 },
        "chicken breast raw": { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
        "fried chicken": { calories: 320, protein: 19, carbs: 8, fat: 20 },
        "fried chicken breast": { calories: 280, protein: 22, carbs: 6, fat: 18 },
        "grilled chicken": { calories: 185, protein: 35, carbs: 0, fat: 4 },
        "chicken thigh": { calories: 209, protein: 26, carbs: 0, fat: 11 },
        "chicken wing": { calories: 203, protein: 30, carbs: 0, fat: 8 },
        "rotisserie chicken": { calories: 190, protein: 29, carbs: 0, fat: 7 },
        salmon: { calories: 208, protein: 22, carbs: 0, fat: 12 },
        "salmon fillet": { calories: 206, protein: 22, carbs: 0, fat: 12 },
        "grilled salmon": { calories: 231, protein: 25, carbs: 0, fat: 14 },
        tuna: { calories: 144, protein: 30, carbs: 0, fat: 1 },
        "canned tuna": { calories: 154, protein: 25, carbs: 0, fat: 6 },
        beef: { calories: 250, protein: 26, carbs: 0, fat: 15 },
        "ground beef": { calories: 332, protein: 25, carbs: 0, fat: 25 },
        "lean beef": { calories: 201, protein: 26, carbs: 0, fat: 10 },
        pork: { calories: 242, protein: 27, carbs: 0, fat: 14 },
        eggs: { calories: 155, protein: 13, carbs: 1, fat: 11 },
        "egg white": { calories: 17, protein: 4, carbs: 0, fat: 0 },
        "whole egg": { calories: 78, protein: 6, carbs: 1, fat: 5 },
        rice: { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
        "brown rice": { calories: 112, protein: 2.6, carbs: 23, fat: 0.9 },
        "white rice": { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
        pasta: { calories: 131, protein: 5, carbs: 25, fat: 1.1 },
        "whole wheat pasta": { calories: 124, protein: 5, carbs: 26, fat: 0.5 },
        bread: { calories: 265, protein: 9, carbs: 49, fat: 3.2 },
        "whole wheat bread": { calories: 247, protein: 13, carbs: 41, fat: 4 },
        "white bread": { calories: 265, protein: 9, carbs: 49, fat: 3.2 },
        potato: { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
        "sweet potato": { calories: 86, protein: 1.6, carbs: 20, fat: 0.1 },
        broccoli: { calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
        spinach: { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
        banana: { calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
        apple: { calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
        orange: { calories: 47, protein: 0.9, carbs: 12, fat: 0.1 },
        avocado: { calories: 160, protein: 2, carbs: 9, fat: 15 },
        almonds: { calories: 579, protein: 21, carbs: 22, fat: 50 },
        walnuts: { calories: 654, protein: 15, carbs: 14, fat: 65 },
        peanuts: { calories: 567, protein: 26, carbs: 16, fat: 49 },
        oats: { calories: 389, protein: 17, carbs: 66, fat: 7 },
        oatmeal: { calories: 68, protein: 2.4, carbs: 12, fat: 1.4 },
        yogurt: { calories: 59, protein: 10, carbs: 3.6, fat: 0.4 },
        "greek yogurt": { calories: 100, protein: 17, carbs: 6, fat: 0.4 },
        milk: { calories: 42, protein: 3.4, carbs: 5, fat: 1 },
        "whole milk": { calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3 },
        "skim milk": { calories: 34, protein: 3.4, carbs: 5, fat: 0.2 },
        cheese: { calories: 113, protein: 7, carbs: 1, fat: 9 },
        "cheddar cheese": { calories: 403, protein: 25, carbs: 1, fat: 33 },
        quinoa: { calories: 120, protein: 4.4, carbs: 22, fat: 1.9 },
        beans: { calories: 127, protein: 8, carbs: 23, fat: 0.5 },
        "black beans": { calories: 132, protein: 8.9, carbs: 24, fat: 0.5 },
        chickpeas: { calories: 164, protein: 8.9, carbs: 27, fat: 2.6 },
      }

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Search for exact match or partial match
      const normalizedQuery = query.toLowerCase().trim()
      let nutritionData = null

      // Try exact match first
      if (foodDatabase[normalizedQuery]) {
        nutritionData = foodDatabase[normalizedQuery]
      } else {
        // Try partial match with better scoring
        let bestMatch = null
        let bestScore = 0

        for (const [food, data] of Object.entries(foodDatabase)) {
          let score = 0

          // Exact word match gets highest score
          if (food === normalizedQuery) {
            score = 100
          }
          // Food contains query
          else if (food.includes(normalizedQuery)) {
            score = 80
          }
          // Query contains food name
          else if (normalizedQuery.includes(food)) {
            score = 70
          }
          // Check individual words
          else {
            const queryWords = normalizedQuery.split(" ")
            const foodWords = food.split(" ")

            for (const queryWord of queryWords) {
              for (const foodWord of foodWords) {
                if (queryWord === foodWord) {
                  score += 30
                } else if (queryWord.includes(foodWord) || foodWord.includes(queryWord)) {
                  score += 15
                }
              }
            }
          }

          if (score > bestScore) {
            bestScore = score
            bestMatch = data
          }
        }

        if (bestScore > 20) {
          nutritionData = bestMatch
        }
      }

      // If no match found, generate reasonable estimates based on food type
      if (!nutritionData) {
        nutritionData = this.estimateNutritionData(normalizedQuery)
      }

      // Fill form fields
      if (foodItemElement) foodItemElement.value = query

      const previewElements = {
        "preview-calories": nutritionData.calories,
        "preview-protein": `${nutritionData.protein}g`,
        "preview-carbs": `${nutritionData.carbs}g`,
        "preview-fats": `${nutritionData.fat}g`,
      }

      Object.entries(previewElements).forEach(([id, value]) => {
        const element = document.getElementById(id)
        if (element) element.textContent = value
      })

      this.showToast(`Found nutrition data for "${query}"`, "success")
    } catch (error) {
      console.error("Error searching for food item:", error)
      this.showToast("Error searching for food item", "error")
      const foodItemElement = document.getElementById("food-item")
      if (foodItemElement) foodItemElement.value = query
    }
  }

  estimateNutritionData(query) {
    // Smart estimation based on food categories with better logic
    const proteinKeywords = ["chicken", "beef", "pork", "turkey", "fish", "salmon", "tuna", "meat", "egg", "protein"]
    const carbKeywords = ["rice", "pasta", "bread", "potato", "oats", "cereal", "quinoa", "grain"]
    const vegetableKeywords = ["broccoli", "spinach", "carrot", "tomato", "lettuce", "vegetable", "green"]
    const fruitKeywords = ["apple", "banana", "orange", "berry", "fruit", "grape", "melon"]
    const nutKeywords = ["almond", "walnut", "peanut", "nut", "seed"]
    const dairyKeywords = ["milk", "cheese", "yogurt", "dairy"]
    const friedKeywords = ["fried", "deep", "crispy", "battered"]

    let baseCalories = 100
    let protein = 5
    let carbs = 10
    let fat = 3

    // Adjust based on cooking method
    if (friedKeywords.some((keyword) => query.includes(keyword))) {
      baseCalories *= 1.8
      fat *= 3
      protein *= 0.8
    }

    // Adjust based on food type
    if (proteinKeywords.some((keyword) => query.includes(keyword))) {
      baseCalories = 200
      protein = 25
      carbs = 2
      fat = 8
    } else if (carbKeywords.some((keyword) => query.includes(keyword))) {
      baseCalories = 150
      protein = 4
      carbs = 30
      fat = 1
    } else if (vegetableKeywords.some((keyword) => query.includes(keyword))) {
      baseCalories = 25
      protein = 2
      carbs = 5
      fat = 0.2
    } else if (fruitKeywords.some((keyword) => query.includes(keyword))) {
      baseCalories = 60
      protein = 1
      carbs = 15
      fat = 0.2
    } else if (nutKeywords.some((keyword) => query.includes(keyword))) {
      baseCalories = 400
      protein = 15
      carbs = 10
      fat = 35
    } else if (dairyKeywords.some((keyword) => query.includes(keyword))) {
      baseCalories = 80
      protein = 8
      carbs = 6
      fat = 3
    }

    return {
      calories: Math.round(baseCalories),
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fat: Math.round(fat),
    }
  }

  searchFood(query) {
    if (query.length < 2) return

    // Debounce the search
    clearTimeout(this.searchTimeout)
    this.searchTimeout = setTimeout(() => {
      this.searchFoodItem(query)
    }, 500)
  }

  // ====================================================
  // Enhanced Meal Planning
  // ====================================================

  generateMealPlan() {
    const container = document.getElementById("meal-plan-container")
    if (!container) return

    // Show customization options first
    container.innerHTML = `
      <div class="meal-plan-customizer">
        <h3>Customize Your Meal Plan</h3>
        <div class="customizer-grid">
          <div class="customizer-option">
            <label for="plan-duration">Plan Duration:</label>
            <select id="plan-duration">
              <option value="3">3 Days</option>
              <option value="7" selected>1 Week</option>
              <option value="14">2 Weeks</option>
            </select>
          </div>
          <div class="customizer-option">
            <label for="meals-per-day">Meals per Day:</label>
            <select id="meals-per-day">
              <option value="3" selected>3 Meals</option>
              <option value="4">3 Meals + 1 Snack</option>
              <option value="5">3 Meals + 2 Snacks</option>
              <option value="6">6 Small Meals</option>
            </select>
          </div>
          <div class="customizer-option">
            <label for="diet-preference">Diet Preference:</label>
            <select id="diet-preference">
              <option value="balanced" selected>Balanced</option>
              <option value="high-protein">High Protein</option>
              <option value="low-carb">Low Carb</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="keto">Ketogenic</option>
              <option value="mediterranean">Mediterranean</option>
            </select>
          </div>
          <div class="customizer-option">
            <label for="calorie-target">Daily Calorie Target:</label>
            <input type="number" id="calorie-target" value="${this.dailyCalorieGoal}" min="1200" max="4000">
          </div>
          <div class="customizer-option">
            <label for="exclude-foods">Exclude Foods:</label>
            <input type="text" id="exclude-foods" placeholder="e.g., nuts, dairy, gluten">
          </div>
          <div class="customizer-option">
            <label for="cooking-time">Max Cooking Time:</label>
            <select id="cooking-time">
              <option value="15">15 minutes</option>
              <option value="30" selected>30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">1 hour</option>
              <option value="unlimited">No limit</option>
            </select>
          </div>
        </div>
        <div class="customizer-actions">
          <button class="btn btn-secondary" id="save-template">Save as Template</button>
          <button class="btn btn-primary" id="generate-custom-plan">Generate Meal Plan</button>
        </div>
      </div>
      <div id="generated-meal-plan" style="display: none;"></div>
    `

    // Add event listeners
    document.getElementById("generate-custom-plan")?.addEventListener("click", () => {
      this.generateCustomMealPlan()
    })

    document.getElementById("save-template")?.addEventListener("click", () => {
      this.saveMealPlanTemplate()
    })
  }

  generateCustomMealPlan() {
    const duration = Number.parseInt(document.getElementById("plan-duration")?.value || 7)
    const mealsPerDay = Number.parseInt(document.getElementById("meals-per-day")?.value || 3)
    const dietPreference = document.getElementById("diet-preference")?.value || "balanced"
    const calorieTarget = Number.parseInt(document.getElementById("calorie-target")?.value || this.dailyCalorieGoal)
    const excludeFoods = document
      .getElementById("exclude-foods")
      ?.value.split(",")
      .map((f) => f.trim().toLowerCase())
      .filter((f) => f)
    const maxCookingTime = document.getElementById("cooking-time")?.value

    const container = document.getElementById("generated-meal-plan")
    if (!container) return

    container.style.display = "block"
    container.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>Generating your personalized ${duration}-day meal plan...</p>
      </div>
    `

    setTimeout(() => {
      const mealPlan = this.createCustomMealPlan(
        duration,
        mealsPerDay,
        dietPreference,
        calorieTarget,
        excludeFoods,
        maxCookingTime,
      )
      container.innerHTML = mealPlan
      this.showToast("Custom meal plan generated successfully!", "success")
    }, 2000)
  }

  createCustomMealPlan(duration, mealsPerDay, dietPreference, calorieTarget, excludeFoods, maxCookingTime) {
    const days = []
    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    for (let i = 0; i < duration; i++) {
      days.push(dayNames[i % 7])
    }

    const mealTypes = this.getMealTypes(mealsPerDay)
    const caloriesPerMeal = Math.floor(calorieTarget / mealsPerDay)

    let html = `
      <div class="meal-plan-header">
        <h3>Your ${duration}-Day Custom Meal Plan</h3>
        <div class="plan-summary">
          <p><strong>Diet:</strong> ${dietPreference.charAt(0).toUpperCase() + dietPreference.slice(1)}</p>
          <p><strong>Daily Calories:</strong> ${calorieTarget} kcal</p>
          <p><strong>Meals per Day:</strong> ${mealsPerDay}</p>
          ${excludeFoods.length > 0 ? `<p><strong>Excluded:</strong> ${excludeFoods.join(", ")}</p>` : ""}
        </div>
        <div class="plan-actions">
          <button class="btn btn-secondary" id="export-meal-plan">Export Plan</button>
          <button class="btn btn-secondary" id="shopping-list">Generate Shopping List</button>
          <button class="btn btn-primary" id="save-meal-plan">Save Plan</button>
        </div>
      </div>
      <div class="meal-plan-grid">
    `

    days.forEach((day, dayIndex) => {
      html += `<div class="meal-plan-day">
        <h4>${day}</h4>
        <div class="day-meals">`

      mealTypes.forEach((mealType, mealIndex) => {
        const recipe = this.generateMealForPlan(dietPreference, caloriesPerMeal, excludeFoods, maxCookingTime)

        html += `
          <div class="meal-plan-meal">
            <div class="meal-header">
              <h5>${mealType}</h5>
              <span class="meal-calories">${recipe.calories} kcal</span>
            </div>
            <div class="meal-content">
              <img src="${recipe.image}" alt="${recipe.name}" />
              <div class="meal-details">
                <h6>${recipe.name}</h6>
                <p class="meal-macros">
                  P: ${recipe.protein}g | C: ${recipe.carbs}g | F: ${recipe.fat}g
                </p>
                <p class="cooking-time">
                  <i class="material-icons">timer</i> ${recipe.cookingTime} min
                </p>
                <div class="meal-actions">
                  <button class="btn-small" onclick="nutritionTracker.viewRecipeDetails('${recipe.id}')">View Recipe</button>
                  <button class="btn-small" onclick="nutritionTracker.addToFoodLog('${recipe.name}', ${recipe.calories}, ${recipe.protein}, ${recipe.carbs}, ${recipe.fat}, '${mealType.toLowerCase()}')">Add to Log</button>
                  <button class="btn-small" onclick="nutritionTracker.replaceMeal(${dayIndex}, ${mealIndex})">Replace</button>
                </div>
              </div>
            </div>
          </div>
        `
      })

      html += `</div></div>`
    })

    html += `</div>`

    // Add event listeners for plan actions
    setTimeout(() => {
      document.getElementById("save-meal-plan")?.addEventListener("click", () => {
        this.saveMealPlan(duration, mealsPerDay, dietPreference, calorieTarget)
      })

      document.getElementById("shopping-list")?.addEventListener("click", () => {
        this.generateShoppingList()
      })

      document.getElementById("export-meal-plan")?.addEventListener("click", () => {
        this.exportMealPlan()
      })
    }, 100)

    return html
  }

  getMealTypes(mealsPerDay) {
    const mealOptions = {
      3: ["Breakfast", "Lunch", "Dinner"],
      4: ["Breakfast", "Lunch", "Snack", "Dinner"],
      5: ["Breakfast", "Morning Snack", "Lunch", "Afternoon Snack", "Dinner"],
      6: ["Breakfast", "Mid-Morning", "Lunch", "Afternoon", "Dinner", "Evening"],
    }

    return mealOptions[mealsPerDay] || mealOptions[3]
  }

  generateMealForPlan(dietPreference, targetCalories, excludeFoods, maxCookingTime) {
    // Enhanced meal generation based on preferences
    const mealDatabase = {
      balanced: [
        { name: "Grilled Chicken with Quinoa", calories: 450, protein: 35, carbs: 40, fat: 12, cookingTime: 25 },
        { name: "Salmon with Sweet Potato", calories: 420, protein: 30, carbs: 35, fat: 15, cookingTime: 20 },
        { name: "Turkey and Vegetable Stir Fry", calories: 380, protein: 28, carbs: 30, fat: 14, cookingTime: 15 },
        { name: "Lean Beef with Brown Rice", calories: 460, protein: 32, carbs: 42, fat: 16, cookingTime: 30 },
        { name: "Chicken Caesar Salad", calories: 350, protein: 30, carbs: 15, fat: 20, cookingTime: 10 },
      ],
      "high-protein": [
        { name: "Protein Bowl with Chicken", calories: 500, protein: 45, carbs: 25, fat: 18, cookingTime: 20 },
        { name: "Greek Yogurt Parfait", calories: 300, protein: 25, carbs: 20, fat: 12, cookingTime: 5 },
        { name: "Egg White Omelet", calories: 250, protein: 30, carbs: 8, fat: 8, cookingTime: 10 },
        { name: "Tuna Steak with Vegetables", calories: 400, protein: 40, carbs: 15, fat: 18, cookingTime: 15 },
        { name: "Protein Smoothie Bowl", calories: 350, protein: 35, carbs: 25, fat: 12, cookingTime: 5 },
      ],
      "low-carb": [
        { name: "Zucchini Noodles with Meat Sauce", calories: 350, protein: 25, carbs: 12, fat: 22, cookingTime: 20 },
        { name: "Cauliflower Rice Bowl", calories: 300, protein: 20, carbs: 15, fat: 18, cookingTime: 15 },
        { name: "Avocado Chicken Salad", calories: 400, protein: 30, carbs: 10, fat: 28, cookingTime: 10 },
        { name: "Keto Salmon with Asparagus", calories: 450, protein: 35, carbs: 8, fat: 32, cookingTime: 20 },
        { name: "Lettuce Wrap Tacos", calories: 320, protein: 25, carbs: 12, fat: 20, cookingTime: 15 },
      ],
      vegetarian: [
        { name: "Lentil Curry with Rice", calories: 400, protein: 18, carbs: 55, fat: 8, cookingTime: 30 },
        { name: "Quinoa Buddha Bowl", calories: 450, protein: 15, carbs: 60, fat: 12, cookingTime: 20 },
        { name: "Chickpea Salad Wrap", calories: 380, protein: 16, carbs: 50, fat: 10, cookingTime: 10 },
        { name: "Vegetable Pasta Primavera", calories: 420, protein: 14, carbs: 65, fat: 12, cookingTime: 25 },
        { name: "Black Bean Burrito Bowl", calories: 390, protein: 17, carbs: 58, fat: 9, cookingTime: 15 },
      ],
      vegan: [
        { name: "Tofu Stir Fry", calories: 350, protein: 20, carbs: 35, fat: 15, cookingTime: 15 },
        { name: "Black Bean Bowl", calories: 400, protein: 18, carbs: 55, fat: 8, cookingTime: 20 },
        { name: "Smoothie Bowl", calories: 300, protein: 12, carbs: 45, fat: 10, cookingTime: 5 },
        { name: "Quinoa Stuffed Bell Peppers", calories: 380, protein: 16, carbs: 52, fat: 12, cookingTime: 35 },
        { name: "Chickpea Curry", calories: 360, protein: 15, carbs: 48, fat: 11, cookingTime: 25 },
      ],
      keto: [
        { name: "Keto Salmon with Asparagus", calories: 450, protein: 35, carbs: 8, fat: 32, cookingTime: 20 },
        { name: "Avocado Egg Bowl", calories: 400, protein: 20, carbs: 10, fat: 35, cookingTime: 10 },
        { name: "Cheese and Meat Platter", calories: 500, protein: 30, carbs: 5, fat: 40, cookingTime: 5 },
        { name: "Keto Chicken Thighs", calories: 480, protein: 32, carbs: 6, fat: 36, cookingTime: 25 },
        { name: "Bacon and Eggs", calories: 420, protein: 28, carbs: 4, fat: 32, cookingTime: 10 },
      ],
      mediterranean: [
        { name: "Mediterranean Chicken Bowl", calories: 420, protein: 28, carbs: 35, fat: 18, cookingTime: 20 },
        { name: "Greek Salad with Feta", calories: 350, protein: 15, carbs: 25, fat: 22, cookingTime: 10 },
        { name: "Grilled Fish with Vegetables", calories: 380, protein: 30, carbs: 20, fat: 20, cookingTime: 25 },
        { name: "Hummus and Veggie Wrap", calories: 340, protein: 12, carbs: 45, fat: 14, cookingTime: 5 },
        { name: "Mediterranean Quinoa Salad", calories: 390, protein: 14, carbs: 50, fat: 16, cookingTime: 15 },
      ],
    }

    const meals = mealDatabase[dietPreference] || mealDatabase.balanced
    let availableMeals = meals.filter((meal) => {
      // Filter by cooking time
      if (maxCookingTime !== "unlimited" && meal.cookingTime > Number.parseInt(maxCookingTime)) {
        return false
      }

      // Filter by excluded foods
      if (excludeFoods.length > 0) {
        return !excludeFoods.some((excluded) => meal.name.toLowerCase().includes(excluded.toLowerCase()))
      }

      return true
    })

    if (availableMeals.length === 0) {
      availableMeals = meals // Fallback to all meals if filters are too restrictive
    }

    const selectedMeal = availableMeals[Math.floor(Math.random() * availableMeals.length)]

    return {
      ...selectedMeal,
      id: Date.now() + Math.random(),
      image: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 150'%3E%3Crect fill='%23${Math.floor(Math.random() * 16777215).toString(16)}' width='200' height='150'/%3E%3Ctext x='100' y='75' text-anchor='middle' fill='white' font-size='12'%3E${selectedMeal.name}%3C/text%3E%3C/svg%3E`,
    }
  }

  addToFoodLog(name, calories, protein, carbs, fat, mealType) {
    const entry = {
      id: Date.now(),
      name,
      quantity: 1,
      unit: "serving",
      mealType,
      brand: "",
      calories,
      protein,
      carbs,
      fat,
      timestamp: new Date().toISOString(),
    }

    this.foodItems.push(entry)
    this.calculateTotals()
    this.updateCalorieProgress()
    this.updateFoodLog()
    this.saveUserData()

    this.showToast(`Added ${name} to your ${mealType}`, "success")
    this.updateFoodLogBadge()
  }

  async saveMealPlan(duration, mealsPerDay, dietPreference, calorieTarget) {
    if (this.currentUser) {
      try {
        const mealPlanRef = collection(db, "meal_plans")
        await addDoc(mealPlanRef, {
          userId: this.currentUser.uid,
          duration,
          mealsPerDay,
          dietPreference,
          calorieTarget,
          createdAt: serverTimestamp(),
        })
        this.showToast("Meal plan saved successfully!", "success")
      } catch (error) {
        console.error("Error saving meal plan:", error)
        this.showToast("Error saving meal plan", "error")
      }
    } else {
      this.showToast("Please log in to save meal plans", "info")
    }
  }

  generateShoppingList() {
    this.showToast("Shopping list feature coming soon!", "info")
  }

  exportMealPlan() {
    this.showToast("Export feature coming soon!", "info")
  }

  // ====================================================
  // Food Logging
  // ====================================================

  addFoodEntry() {
    const foodItem = document.getElementById("food-item")?.value.trim()
    const quantity = Number.parseFloat(document.getElementById("quantity")?.value || 0)
    const unit = document.getElementById("unit")?.value
    const mealType = document.getElementById("meal-type")?.value
    const brand = document.getElementById("brand")?.value

    if (!foodItem || !quantity) {
      this.showToast("Please enter a food item and quantity", "error")
      return
    }

    // Get nutrition values from preview or estimate
    const calories = Number.parseInt(document.getElementById("preview-calories")?.textContent || 0)
    const protein = Number.parseFloat(document.getElementById("preview-protein")?.textContent.replace("g", "") || 0)
    const carbs = Number.parseFloat(document.getElementById("preview-carbs")?.textContent.replace("g", "") || 0)
    const fat = Number.parseFloat(document.getElementById("preview-fats")?.textContent.replace("g", "") || 0)

    // Scale nutrition values by quantity
    const scaledCalories = Math.round(calories * quantity)
    const scaledProtein = Math.round(protein * quantity * 10) / 10
    const scaledCarbs = Math.round(carbs * quantity * 10) / 10
    const scaledFat = Math.round(fat * quantity * 10) / 10

    const entry = {
      id: Date.now(),
      name: foodItem,
      quantity,
      unit,
      mealType,
      brand: brand || "",
      calories: scaledCalories,
      protein: scaledProtein,
      carbs: scaledCarbs,
      fat: scaledFat,
      timestamp: new Date().toISOString(),
    }

    this.foodItems.push(entry)
    this.calculateTotals()
    this.updateCalorieProgress()
    this.updateFoodLog()
    this.resetFoodForm()
    this.saveUserData()

    this.showToast(`Added ${foodItem} to your ${mealType}`, "success")
    this.updateFoodLogBadge()
  }

  deleteFoodEntry(id) {
    const index = this.foodItems.findIndex((item) => item.id === id)
    if (index === -1) return

    const entry = this.foodItems[index]
    this.foodItems.splice(index, 1)

    this.calculateTotals()
    this.updateCalorieProgress()
    this.updateFoodLog()
    this.saveUserData()

    this.showToast("Food entry deleted", "info")
    this.updateFoodLogBadge()
  }

  resetFoodForm() {
    const elements = {
      "food-item": "",
      quantity: "1",
      unit: "g",
      "meal-type": "breakfast",
      brand: "",
      "food-search": "",
    }

    Object.entries(elements).forEach(([id, value]) => {
      const element = document.getElementById(id)
      if (element) element.value = value
    })

    // Reset nutrition preview
    const previewElements = {
      "preview-calories": "0",
      "preview-protein": "0g",
      "preview-carbs": "0g",
      "preview-fats": "0g",
    }

    Object.entries(previewElements).forEach(([id, value]) => {
      const element = document.getElementById(id)
      if (element) element.textContent = value
    })
  }

  updateFoodLog() {
    const container = document.getElementById("food-log-entries")
    const recentContainer = document.getElementById("recent-food-entries")

    if (!container) return

    const meals = ["breakfast", "lunch", "dinner", "snack"]

    if (this.foodItems.length === 0) {
      const emptyState = `
        <div class="empty-state">
          <i class="material-icons">restaurant</i>
          <h3>No meals logged yet</h3>
          <p>Start tracking your nutrition by adding your first meal!</p>
        </div>
      `
      container.innerHTML = emptyState
      if (recentContainer) recentContainer.innerHTML = emptyState
      return
    }

    let html = ""
    let recentHtml = ""
    let recentCount = 0

    meals.forEach((meal) => {
      const mealEntries = this.foodItems.filter((entry) => entry.mealType === meal)
      if (mealEntries.length > 0) {
        const mealIcons = {
          breakfast: "free_breakfast",
          lunch: "lunch_dining",
          dinner: "dinner_dining",
          snack: "restaurant",
        }

        html += `
          <div class="food-log-meal">
            <div class="food-log-meal-header">
              <i class="material-icons">${mealIcons[meal]}</i>
              <h4>${meal.charAt(0).toUpperCase() + meal.slice(1)}</h4>
            </div>
        `

        mealEntries.forEach((entry) => {
          const entryHtml = `
            <div class="food-log-entry">
              <div class="food-log-entry-name">
                <h5>${entry.name}</h5>
                <p>${entry.quantity} ${entry.unit}${entry.brand ? ` - ${entry.brand}` : ""}</p>
              </div>
              <div class="food-log-entry-info">
                <div class="nutrients">
                  <div class="nutrient">
                    <span class="value">${entry.calories}</span>
                    <span class="label">kcal</span>
                  </div>
                  <div class="nutrient">
                    <span class="value">${entry.protein}g</span>
                    <span class="label">protein</span>
                  </div>
                  <div class="nutrient">
                    <span class="value">${entry.carbs}g</span>
                    <span class="label">carbs</span>
                  </div>
                  <div class="nutrient">
                    <span class="value">${entry.fat}g</span>
                    <span class="label">fat</span>
                  </div>
                </div>
                <div class="actions">
                  <button class="btn-icon" onclick="nutritionTracker.deleteFoodEntry(${entry.id})">
                    <i class="material-icons">delete</i>
                  </button>
                </div>
              </div>
            </div>
          `

          html += entryHtml

          // Add to recent entries (limit to 3)
          if (recentCount < 3) {
            recentHtml += entryHtml
            recentCount++
          }
        })

        html += "</div>"
      }
    })

    container.innerHTML = html
    if (recentContainer) {
      recentContainer.innerHTML =
        recentHtml ||
        `
        <div class="empty-state">
          <i class="material-icons">restaurant</i>
          <h3>No recent activity</h3>
          <p>Your recent meals will appear here.</p>
        </div>
      `
    }
  }

  updateFoodLogBadge() {
    const badge = document.getElementById("foodLogBadge")
    if (badge) {
      badge.textContent = this.foodItems.length
    }
  }

  calculateTotals() {
    this.totalCalories = this.foodItems.reduce((sum, item) => sum + item.calories, 0)
    this.totalProtein = this.foodItems.reduce((sum, item) => sum + item.protein, 0)
    this.totalCarbs = this.foodItems.reduce((sum, item) => sum + item.carbs, 0)
    this.totalFat = this.foodItems.reduce((sum, item) => sum + item.fat, 0)

    // Update UI elements
    this.updateNutritionDisplays()
  }

  updateNutritionDisplays() {
    const elements = {
      "total-calories": `${this.totalCalories} kcal`,
      "remaining-calories": `${Math.max(0, this.dailyCalorieGoal - this.totalCalories)} kcal`,
      "calories-consumed": this.totalCalories,
      "protein-consumed": Math.round(this.totalProtein * 10) / 10,
      "carbs-consumed": Math.round(this.totalCarbs * 10) / 10,
      "fat-consumed": Math.round(this.totalFat * 10) / 10,
    }

    Object.entries(elements).forEach(([id, value]) => {
      const element = document.getElementById(id)
      if (element) element.textContent = value
    })
  }

  updateCalorieProgress() {
    const percentage = Math.min(100, Math.round((this.totalCalories / this.dailyCalorieGoal) * 100))
    const degrees = Math.min(360, (percentage / 100) * 360)

    const wheel = document.getElementById("calorie-progress-wheel")
    if (wheel) {
      wheel.style.background = `conic-gradient(
        var(--accent) ${degrees}deg, 
        var(--primary) ${degrees}deg 360deg
      )`
    }

    const percentageElement = document.getElementById("progress-percentage")
    if (percentageElement) {
      percentageElement.textContent = `${percentage}%`

      // Change color when exceeding daily goal
      if (percentage >= 100) {
        percentageElement.style.color = "#e74c3c"
      } else {
        percentageElement.style.color = "var(--accent)"
      }
    }
  }

  selectMeal(mealType) {
    document.querySelectorAll(".meal-btn").forEach((btn) => {
      btn.classList.remove("active")
    })

    const selectedBtn = document.querySelector(`[data-meal="${mealType}"]`)
    if (selectedBtn) selectedBtn.classList.add("active")

    const mealTypeSelect = document.getElementById("meal-type")
    if (mealTypeSelect) mealTypeSelect.value = mealType

    const currentMealElement = document.getElementById("current-meal")
    if (currentMealElement) {
      currentMealElement.textContent = `Add Food to ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`
    }

    this.selectedMealType = mealType
    this.navigateToSection("food-log")
  }

  // ====================================================
  // Nutrition Goals
  // ====================================================

  toggleGoalsForm() {
    const goalsForm = document.getElementById("goals-form")
    if (goalsForm) {
      goalsForm.classList.toggle("collapsed")
    }
  }

  calculateNutritionGoals() {
    const age = Number.parseInt(document.getElementById("age")?.value || 0)
    const gender = document.getElementById("gender")?.value
    const height = Number.parseInt(document.getElementById("height")?.value || 0)
    const weight = Number.parseInt(document.getElementById("weight")?.value || 0)
    const activityLevel = document.getElementById("activity")?.value
    const goal = document.getElementById("goal")?.value

    if (!age || !gender || !height || !weight || !activityLevel || !goal) {
      this.showToast("Please fill in all required fields", "error")
      return
    }

    // Calculate BMR using Mifflin-St Jeor Equation
    const bmr = calculateBMR(gender, weight, height, age)

    // Calculate TDEE
    const tdee = calculateTDEE(bmr, activityLevel)

    // Calculate daily calorie goal
    const calorieGoal = calculateCalorieGoal(tdee, goal)

    // Calculate macronutrient targets
    const macros = calculateMacronutrients(calorieGoal, NUTRITION_CONFIG.nutrition.macroRatios)

    // Update UI
    this.dailyCalorieGoal = calorieGoal

    const nutritionGoals = {
      calories: calorieGoal,
      protein: macros.protein,
      carbs: macros.carbs,
      fat: macros.fat,
      calculatedOn: new Date().toISOString(),
    }

    this.updateNutritionGoalDisplays(nutritionGoals)
    this.updateCalorieProgress()
    this.saveUserData()

    // Hide form
    const goalsForm = document.getElementById("goals-form")
    if (goalsForm) goalsForm.classList.add("collapsed")

    this.showToast("Nutrition goals calculated and saved!", "success")
  }

  updateNutritionGoalDisplays(goals) {
    const goalElements = {
      "calories-goal": goals.calories,
      "protein-goal": goals.protein,
      "carbs-goal": goals.carbs,
      "fat-goal": goals.fat,
    }

    Object.entries(goalElements).forEach(([id, value]) => {
      const elements = document.querySelectorAll(`#${id}`)
      elements.forEach((el) => {
        if (el) el.textContent = value
      })
    })
  }

  // ====================================================
  // Recipe Management
  // ====================================================

  async loadRandomRecipes() {
    try {
      const loader = document.getElementById("recipe-loader")
      const container = document.getElementById("recipe-cards")

      if (loader) loader.style.display = "flex"

      // Clear existing cards except loader
      if (container) {
        const existingCards = container.querySelectorAll(".recipe-card")
        existingCards.forEach((card) => card.remove())
      }

      try {
        const data = await nutritionAPI.getRandomRecipes(6)

        if (data && data.recipes && data.recipes.length > 0) {
          this.displayRecipes(data.recipes)
        } else {
          this.showEmptyRecipesState("No recipes found")
        }
      } catch (error) {
        console.error("API call failed, using mock data:", error)
        // Mock data for demo purposes
        const mockRecipes = this.generateMockRecipes(6)
        this.displayRecipes(mockRecipes)
      }

      if (loader) loader.style.display = "none"
    } catch (error) {
      console.error("Error loading recipes:", error)
      this.showToast("Error loading recipes. Please try again.", "error")

      const loader = document.getElementById("recipe-loader")
      if (loader) loader.style.display = "none"

      this.showEmptyRecipesState("Failed to load recipes")
    }
  }

  async searchRecipes(query) {
    try {
      const loader = document.getElementById("recipe-loader")
      const container = document.getElementById("recipe-cards")

      if (loader) loader.style.display = "flex"

      // Clear existing cards except loader
      if (container) {
        const existingCards = container.querySelectorAll(".recipe-card")
        existingCards.forEach((card) => card.remove())
      }

      try {
        const data = await nutritionAPI.searchRecipes(query)

        if (data && data.results && data.results.length > 0) {
          this.displayRecipes(data.results)
          this.showToast(`Found ${data.results.length} recipes for "${query}"`, "success")
        } else {
          this.showEmptyRecipesState(`No recipes found for "${query}"`)
          this.showToast(`No recipes found for "${query}"`, "info")
        }
      } catch (error) {
        console.error("API call failed, using mock data:", error)
        // Mock data for demo purposes
        const mockRecipes = this.generateMockRecipes(4, query)
        this.displayRecipes(mockRecipes)
        this.showToast(`Found ${mockRecipes.length} recipes for "${query}"`, "success")
      }

      if (loader) loader.style.display = "none"
    } catch (error) {
      console.error("Error searching recipes:", error)
      this.showToast("Error searching recipes. Please try again.", "error")

      const loader = document.getElementById("recipe-loader")
      if (loader) loader.style.display = "none"

      this.showEmptyRecipesState(`Failed to search for "${query}"`)
    }
  }

  displayRecipes(recipes) {
    const container = document.getElementById("recipe-cards")
    if (!container) return

    let html = ""

    recipes.forEach((recipe) => {
      const isFavorite = this.favoriteRecipes.some((fav) => fav.id === recipe.id)

      html += `
        <div class="recipe-card" data-id="${recipe.id}">
          <div class="recipe-image">
            <img src="${recipe.image || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 200'%3E%3Crect fill='%236A1B9A' width='300' height='200'/%3E%3Ctext x='150' y='100' text-anchor='middle' fill='white' font-size='16'%3E${recipe.title}%3C/text%3E%3C/svg%3E`}" alt="${recipe.title}" />
            <div class="recipe-tags">
              ${recipe.vegetarian ? '<span class="recipe-tag">Vegetarian</span>' : ""}
              ${recipe.vegan ? '<span class="recipe-tag">Vegan</span>' : ""}
              ${recipe.glutenFree ? '<span class="recipe-tag">Gluten Free</span>' : ""}
            </div>
            <div class="recipe-ready-time">
              <i class="material-icons">timer</i>
              ${recipe.readyInMinutes || Math.floor(Math.random() * 30) + 15} min
            </div>
          </div>
          <div class="recipe-content">
            <h3 class="recipe-title">${recipe.title}</h3>
            <div class="recipe-meta">
              <span class="recipe-meta-item">
                <i class="material-icons">whatshot</i>
                ${recipe.calories || Math.floor(Math.random() * 400) + 200} kcal
              </span>
              <span class="recipe-meta-item">
                <i class="material-icons">star</i>
                ${recipe.healthScore || (Math.floor(Math.random() * 50) + 50) / 10}
              </span>
            </div>
            <p class="recipe-description">${recipe.summary?.substring(0, 100).replace(/<\/?[^>]+(>|$)/g, "") || "A delicious recipe that's easy to prepare and full of flavor."}</p>
            <div class="recipe-actions">
              <button class="btn btn-secondary view-recipe" data-id="${recipe.id}">View Recipe</button>
              <button class="btn-icon toggle-favorite" data-id="${recipe.id}">
                <i class="material-icons">${isFavorite ? "favorite" : "favorite_border"}</i>
              </button>
            </div>
          </div>
        </div>
      `
    })

    container.innerHTML = html

    // Add event listeners
    document.querySelectorAll(".view-recipe").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const recipeId = e.target.getAttribute("data-id")
        this.viewRecipeDetails(recipeId)
      })
    })

    document.querySelectorAll(".toggle-favorite").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const recipeId = e.target.closest(".toggle-favorite").getAttribute("data-id")
        this.toggleFavoriteRecipe(recipeId, recipes)
      })
    })
  }

  showEmptyRecipesState(message) {
    const container = document.getElementById("recipe-cards")
    if (!container) return

    container.innerHTML = `
      <div class="empty-state">
        <i class="material-icons">restaurant_menu</i>
        <h3>${message || "No recipes found"}</h3>
        <p>Try searching for different recipes or check your internet connection.</p>
      </div>
    `
  }

  generateMockRecipes(count, query = "") {
    const recipes = []
    const titles = [
      "Grilled Chicken Salad",
      "Vegetable Stir Fry",
      "Salmon with Asparagus",
      "Quinoa Bowl",
      "Avocado Toast",
      "Greek Yogurt Parfait",
      "Protein Pancakes",
      "Spinach Omelette",
      "Tuna Wrap",
      "Sweet Potato Bowl",
    ]

    for (let i = 0; i < count; i++) {
      let title = titles[Math.floor(Math.random() * titles.length)]
      if (query) {
        title = `${query} ${title}`
      }

      recipes.push({
        id: Date.now() + i,
        title,
        image: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 200'%3E%3Crect fill='%23${Math.floor(Math.random() * 16777215).toString(16)}' width='300' height='200'/%3E%3Ctext x='150' y='100' text-anchor='middle' fill='white' font-size='16'%3E${title}%3C/text%3E%3C/svg%3E`,
        readyInMinutes: Math.floor(Math.random() * 30) + 15,
        servings: Math.floor(Math.random() * 4) + 1,
        vegetarian: Math.random() > 0.7,
        vegan: Math.random() > 0.8,
        glutenFree: Math.random() > 0.6,
        dairyFree: Math.random() > 0.7,
        healthScore: (Math.floor(Math.random() * 50) + 50) / 10,
        calories: Math.floor(Math.random() * 400) + 200,
        summary:
          "A delicious recipe that's easy to prepare and full of flavor. Perfect for a quick and healthy meal any day of the week.",
      })
    }

    return recipes
  }

  async viewRecipeDetails(recipeId) {
    try {
      const modal = document.getElementById("recipe-modal")
      const modalContent = document.getElementById("recipe-details")

      if (!modal || !modalContent) return

      modalContent.innerHTML = `
        <div class="loading-spinner">
          <div class="spinner"></div>
          <p>Loading recipe details...</p>
        </div>
      `

      modal.classList.add("active")

      try {
        const recipe = await nutritionAPI.getRecipeInformation(recipeId)

        if (recipe) {
          this.displayRecipeDetails(recipe, modalContent)
        } else {
          throw new Error("Recipe not found")
        }
      } catch (error) {
        console.error("API call failed, using mock data:", error)
        // Mock data for demo purposes
        const mockRecipe = this.generateMockRecipeDetails(recipeId)
        this.displayRecipeDetails(mockRecipe, modalContent)
      }

      // Add close event listener
      const closeBtn = modal.querySelector(".close")
      if (closeBtn) {
        closeBtn.addEventListener("click", () => {
          modal.classList.remove("active")
        })
      }
    } catch (error) {
      console.error("Error viewing recipe details:", error)
      this.showToast("Error loading recipe details", "error")
    }
  }

  displayRecipeDetails(recipe, container) {
    if (!container) return

    const html = `
      <div class="recipe-content">
        <img src="${recipe.image || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 200'%3E%3Crect fill='%236A1B9A' width='300' height='200'/%3E%3Ctext x='150' y='100' text-anchor='middle' fill='white' font-size='16'%3E${recipe.title}%3C/text%3E%3C/svg%3E`}" alt="${recipe.title}" />
        <h2>${recipe.title}</h2>
        <div class="recipe-info">
          <p><i class="material-icons">timer</i> Ready in ${recipe.readyInMinutes || 30} minutes</p>
          <p><i class="material-icons">people</i> Serves ${recipe.servings || 4}</p>
          <p><i class="material-icons">whatshot</i> ${recipe.calories || 350} calories per serving</p>
        </div>
        <div class="recipe-ingredients">
          <h3>Ingredients</h3>
          <ul>
            ${
              recipe.extendedIngredients
                ? recipe.extendedIngredients.map((ing) => `<li>${ing.original}</li>`).join("")
                : this.generateMockIngredients()
                    .map((ing) => `<li>${ing}</li>`)
                    .join("")
            }
          </ul>
        </div>
        <div class="recipe-instructions">
          <h3>Instructions</h3>
          ${
            recipe.instructions
              ? recipe.instructions
              : `
            <ol>
              <li>Preheat the oven to 375°F (190°C).</li>
              <li>Prepare all ingredients as listed above.</li>
              <li>In a large bowl, combine all ingredients and mix well.</li>
              <li>Transfer to a baking dish and bake for 25-30 minutes.</li>
              <li>Let cool for 5 minutes before serving.</li>
            </ol>
          `
          }
        </div>
      </div>
      <div class="recipe-actions">
        <button class="btn btn-secondary" id="add-to-meal-plan">Add to Meal Plan</button>
        <button class="btn btn-primary" id="add-to-favorites">Add to Favorites</button>
      </div>
    `

    container.innerHTML = html

    // Add event listeners
    const addToMealPlanBtn = document.getElementById("add-to-meal-plan")
    if (addToMealPlanBtn) {
      addToMealPlanBtn.addEventListener("click", () => {
        this.addToMealPlan(recipe)
      })
    }

    const addToFavoritesBtn = document.getElementById("add-to-favorites")
    if (addToFavoritesBtn) {
      addToFavoritesBtn.addEventListener("click", () => {
        this.addToFavorites(recipe)
      })
    }
  }

  generateMockRecipeDetails(id) {
    const titles = [
      "Grilled Chicken Salad",
      "Vegetable Stir Fry",
      "Salmon with Asparagus",
      "Quinoa Bowl",
      "Avocado Toast",
    ]

    const title = titles[Math.floor(Math.random() * titles.length)]

    return {
      id,
      title,
      image: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 200'%3E%3Crect fill='%23${Math.floor(Math.random() * 16777215).toString(16)}' width='300' height='200'/%3E%3Ctext x='150' y='100' text-anchor='middle' fill='white' font-size='16'%3E${title}%3C/text%3E%3C/svg%3E`,
      readyInMinutes: Math.floor(Math.random() * 30) + 15,
      servings: Math.floor(Math.random() * 4) + 1,
      vegetarian: Math.random() > 0.7,
      vegan: Math.random() > 0.8,
      glutenFree: Math.random() > 0.6,
      dairyFree: Math.random() > 0.7,
      healthScore: (Math.floor(Math.random() * 50) + 50) / 10,
      calories: Math.floor(Math.random() * 400) + 200,
      summary:
        "A delicious recipe that's easy to prepare and full of flavor. Perfect for a quick and healthy meal any day of the week.",
      instructions: `
        <ol>
          <li>Preheat the oven to 375°F (190°C).</li>
          <li>Prepare all ingredients as listed above.</li>
          <li>In a large bowl, combine all ingredients and mix well.</li>
          <li>Transfer to a baking dish and bake for 25-30 minutes.</li>
          <li>Let cool for 5 minutes before serving.</li>
        </ol>
      `,
    }
  }

  generateMockIngredients() {
    const ingredients = [
      "2 boneless, skinless chicken breasts",
      "1 cup quinoa, rinsed",
      "2 cups vegetable broth",
      "1 tablespoon olive oil",
      "1 red bell pepper, diced",
      "1 zucchini, diced",
      "1 yellow onion, diced",
      "2 cloves garlic, minced",
      "1 teaspoon dried oregano",
      "1/2 teaspoon salt",
      "1/4 teaspoon black pepper",
      "1/4 cup fresh parsley, chopped",
    ]

    // Return a random subset of ingredients
    const count = Math.floor(Math.random() * 5) + 5
    const shuffled = [...ingredients].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
  }

  toggleFavoriteRecipe(recipeId, recipes) {
    const recipe = recipes.find((r) => r.id.toString() === recipeId.toString())
    if (!recipe) return

    const isFavorite = this.favoriteRecipes.some((fav) => fav.id.toString() === recipeId.toString())

    if (isFavorite) {
      // Remove from favorites
      this.favoriteRecipes = this.favoriteRecipes.filter((fav) => fav.id.toString() !== recipeId.toString())
      this.showToast(`Removed "${recipe.title}" from favorites`, "info")
    } else {
      // Add to favorites
      this.favoriteRecipes.push(recipe)
      this.showToast(`Added "${recipe.title}" to favorites`, "success")
    }

    // Update UI
    const favoriteBtn = document.querySelector(`.toggle-favorite[data-id="${recipeId}"] i`)
    if (favoriteBtn) {
      favoriteBtn.textContent = isFavorite ? "favorite_border" : "favorite"
    }

    this.saveUserData()
  }

  addToFavorites(recipe) {
    const isFavorite = this.favoriteRecipes.some((fav) => fav.id.toString() === recipe.id.toString())

    if (!isFavorite) {
      this.favoriteRecipes.push(recipe)
      this.saveUserData()
      this.showToast(`Added "${recipe.title}" to favorites`, "success")
    } else {
      this.showToast(`"${recipe.title}" is already in your favorites`, "info")
    }

    // Close modal
    const modal = document.getElementById("recipe-modal")
    if (modal) modal.classList.remove("active")
  }

  addToMealPlan(recipe) {
    this.showToast(`Added "${recipe.title}" to your meal plan`, "success")

    // Close modal
    const modal = document.getElementById("recipe-modal")
    if (modal) modal.classList.remove("active")

    // Navigate to meal planner
    this.navigateToSection("meal-planner")
  }

  handleTabChange(tabName) {
    const recipeContainer = document.getElementById("recipe-cards")
    if (!recipeContainer) return

    switch (tabName) {
      case "favorites":
        if (this.favoriteRecipes.length > 0) {
          this.displayRecipes(this.favoriteRecipes)
        } else {
          recipeContainer.innerHTML = `
            <div class="empty-state">
              <i class="material-icons">favorite_border</i>
              <h3>No favorite recipes</h3>
              <p>Add recipes to your favorites to see them here.</p>
            </div>
          `
        }
        break
      case "meal-plans":
        recipeContainer.innerHTML = `
          <div class="empty-state">
            <i class="material-icons">calendar_today</i>
            <h3>No meal plans</h3>
            <p>Create a meal plan to see it here.</p>
          </div>
        `
        break
      case "discover":
      default:
        this.loadRandomRecipes()
        break
    }
  }

  // ====================================================
  // Water Tracking
  // ====================================================

  logWater() {
    this.waterIntake += 250 // Add 250ml
    this.updateWaterDisplay()
    this.saveUserData()
    this.showToast("Added 250ml of water to your daily intake", "success")
  }

  updateWaterDisplay() {
    const waterConsumed = document.getElementById("water-consumed")
    const waterBadge = document.getElementById("waterBadge")

    if (waterConsumed) {
      waterConsumed.textContent = this.waterIntake
    }

    if (waterBadge) {
      waterBadge.textContent = Math.floor(this.waterIntake / 250)
    }
  }

  // ====================================================
  // Weight Tracking
  // ====================================================

  logWeight() {
    this.showToast("Weight tracking feature coming soon!", "info")
  }

  // ====================================================
  // Product Search
  // ====================================================

  searchProduct() {
    const query = document.getElementById("product-search-input")?.value.trim()
    if (!query) {
      this.showToast("Please enter a product to search", "error")
      return
    }

    const productDetails = document.getElementById("product-details")
    if (productDetails) {
      productDetails.style.display = "block"
      productDetails.innerHTML = `
        <div class="loading-spinner">
          <div class="spinner"></div>
          <p>Searching for "${query}"...</p>
        </div>
      `

      setTimeout(() => {
        this.displayMockProductDetails(query, productDetails)
      }, 1500)
    }
  }

  displayMockProductDetails(query, container) {
    const calories = Math.floor(Math.random() * 200) + 100
    const protein = Math.floor(Math.random() * 20) + 5
    const carbs = Math.floor(Math.random() * 30) + 10
    const fat = Math.floor(Math.random() * 10) + 2
    const fiber = Math.floor(Math.random() * 5) + 1
    const sugar = Math.floor(Math.random() * 10) + 1

    const html = `
      <div class="product-header">
        <div class="product-image">
          <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23${Math.floor(Math.random() * 16777215).toString(16)}' width='100' height='100'/%3E%3Ctext x='50' y='50' text-anchor='middle' fill='white' font-size='10'%3E${query}%3C/text%3E%3C/svg%3E" alt="${query}" />
        </div>
        <div class="product-header-info">
          <h3>${query}</h3>
          <p>Serving size: 100g</p>
        </div>
      </div>
      <div class="product-nutrition">
        <div class="nutrition-item">
          <span class="value">${calories}</span>
          <span class="label">Calories</span>
        </div>
        <div class="nutrition-item">
          <span class="value">${protein}g</span>
          <span class="label">Protein</span>
        </div>
        <div class="nutrition-item">
          <span class="value">${carbs}g</span>
          <span class="label">Carbs</span>
        </div>
        <div class="nutrition-item">
          <span class="value">${fat}g</span>
          <span class="label">Fat</span>
        </div>
        <div class="nutrition-item">
          <span class="value">${fiber}g</span>
          <span class="label">Fiber</span>
        </div>
        <div class="nutrition-item">
          <span class="value">${sugar}g</span>
          <span class="label">Sugar</span>
        </div>
      </div>
      <div class="product-ingredients">
        <h4>Ingredients</h4>
        <p>Ingredients: ${this.generateMockIngredients().join(", ")}.</p>
      </div>
      <div class="form-actions">
        <button class="btn-secondary">Add to Favorites</button>
        <button class="btn" id="add-product-to-log">Add to Food Log</button>
      </div>
    `

    container.innerHTML = html

    // Add event listener
    document.getElementById("add-product-to-log")?.addEventListener("click", () => {
      const foodItemInput = document.getElementById("food-item")
      if (foodItemInput) foodItemInput.value = query

      const previewElements = {
        "preview-calories": calories,
        "preview-protein": `${protein}g`,
        "preview-carbs": `${carbs}g`,
        "preview-fats": `${fat}g`,
      }

      Object.entries(previewElements).forEach(([id, value]) => {
        const element = document.getElementById(id)
        if (element) element.textContent = value
      })

      this.navigateToSection("food-log")
      this.showToast(`Added "${query}" to food log form`, "success")
    })
  }

  handleProductAutocomplete(query) {
    if (query.length < 2) {
      const suggestions = document.getElementById("product-autocomplete-suggestions")
      if (suggestions) {
        suggestions.classList.remove("active")
      }
      return
    }

    // Simulate autocomplete
    setTimeout(() => {
      const suggestions = document.getElementById("product-autocomplete-suggestions")
      if (!suggestions) return

      const mockSuggestions = [
        `${query} - Brand A`,
        `${query} with extra protein`,
        `Organic ${query}`,
        `Low-fat ${query}`,
        `${query} snack pack`,
      ]

      let html = ""
      mockSuggestions.forEach((suggestion) => {
        html += `<div class="product-suggestion">${suggestion}</div>`
      })

      suggestions.innerHTML = html
      suggestions.classList.add("active")

      // Add event listeners
      document.querySelectorAll(".product-suggestion").forEach((suggestion) => {
        suggestion.addEventListener("click", () => {
          const input = document.getElementById("product-search-input")
          if (input) input.value = suggestion.textContent
          suggestions.classList.remove("active")
        })
      })

      // Close suggestions when clicking outside
      document.addEventListener("click", (e) => {
        if (!e.target.closest(".product-autocomplete")) {
          suggestions.classList.remove("active")
        }
      })
    }, 300)
  }

  // ====================================================
  // Dashboard Updates
  // ====================================================

  updateDashboard() {
    this.calculateTotals()
    this.updateCalorieProgress()
    this.updateFoodLog()
  }

  // ====================================================
  // Theme Management
  // ====================================================

  toggleTheme() {
    document.body.classList.toggle("light-theme")
    const themeIcon = document.querySelector("#theme-toggle-btn i")
    if (themeIcon) {
      themeIcon.textContent = document.body.classList.contains("light-theme") ? "dark_mode" : "light_mode"
    }

    const theme = document.body.classList.contains("light-theme") ? "light" : "dark"
    localStorage.setItem("nutrition_theme", theme)

    this.showToast(`Switched to ${theme} theme`, "info")
  }

  // ====================================================
  // Chatbot
  // ====================================================

  toggleChatbot() {
    const chatbot = document.getElementById("ai-chatbot")
    if (chatbot) {
      chatbot.classList.toggle("active")
    }
  }

  closeChatbot() {
    const chatbot = document.getElementById("ai-chatbot")
    if (chatbot) {
      chatbot.classList.remove("active")
    }
  }

  sendChatMessage() {
    const input = document.getElementById("chat-input")
    if (!input) return

    const message = input.value.trim()
    if (!message) return

    this.addChatMessage(message, true)
    input.value = ""

    // Simulate bot response
    setTimeout(() => {
      const responses = [
        "That's a great question! Based on your current nutrition goals, I'd recommend focusing on lean proteins and complex carbohydrates.",
        "I can help you with that! Would you like me to suggest some recipes that fit your calorie goals?",
        "Your current intake looks good! You're on track to meet your daily protein target.",
        "For better nutrition tracking, try to log your meals as soon as you eat them.",
        "I notice you haven't logged much water today. Remember to stay hydrated!",
      ]

      const response = responses[Math.floor(Math.random() * responses.length)]
      this.addChatMessage(response, false)
    }, 1000)
  }

  addChatMessage(message, isUser) {
    const chatBody = document.getElementById("chat-body")
    if (!chatBody) return

    const messageDiv = document.createElement("div")
    messageDiv.className = `chat-message ${isUser ? "user-message" : "bot-message"}`

    const avatar = document.createElement("div")
    avatar.className = "chat-avatar"
    avatar.innerHTML = isUser ? '<i class="material-icons">person</i>' : '<i class="material-icons">smart_toy</i>'

    const content = document.createElement("div")
    content.className = "chat-content"
    content.textContent = message

    messageDiv.appendChild(avatar)
    messageDiv.appendChild(content)

    chatBody.appendChild(messageDiv)
    chatBody.scrollTop = chatBody.scrollHeight
  }

  // ====================================================
  // Toast Notifications
  // ====================================================

  showToast(message, type = "info") {
    const toastContainer = document.getElementById("toast-container")
    if (!toastContainer) return

    const toast = document.createElement("div")
    toast.className = `toast ${type}`

    const icons = {
      success: "check_circle",
      error: "error",
      warning: "warning",
      info: "info",
    }

    toast.innerHTML = `
      <div class="toast-icon">
        <i class="material-icons">${icons[type] || "info"}</i>
      </div>
      <div class="toast-content">
        <p>${message}</p>
      </div>
      <button class="toast-close">
        <i class="material-icons">close</i>
      </button>
    `

    toastContainer.appendChild(toast)

    // Add event listener to close button
    const closeBtn = toast.querySelector(".toast-close")
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        toast.classList.add("hiding")
        setTimeout(() => {
          toast.remove()
        }, 300)
      })
    }

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.classList.add("hiding")
        setTimeout(() => {
          if (toast.parentNode) {
            toast.remove()
          }
        }, 300)
      }
    }, 5000)
  }
}

// Initialize the nutrition tracker when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.nutritionTracker = new NutritionTracker()

  // Load theme preference
  const savedTheme = localStorage.getItem("nutrition_theme")
  if (savedTheme === "light") {
    document.body.classList.add("light-theme")
    const themeIcon = document.querySelector("#theme-toggle-btn i")
    if (themeIcon) {
      themeIcon.textContent = "dark_mode"
    }
  }
})

export default NutritionTracker
