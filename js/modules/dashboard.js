// Enhanced FitJourney Dashboard JavaScript with Better Mobile Support
class FitJourneyDashboard {
  constructor() {
    this.currentUser = this.getCurrentUser()
    this.workoutData = this.loadWorkoutData()
    this.challengeData = this.loadChallengeData()
    this.searchState = {
      query: "",
      type: "all",
      difficulty: "all",
      duration: "all",
      focus: "all",
    }
    this.isMobile = window.innerWidth <= 768
    this.init()
  }

  init() {
    this.setupEventListeners()
    this.setupMobileResponsiveness()
    this.updateWelcomeBanner()
    this.renderOverviewStats()
    this.renderWorkoutFolders()
    this.renderWorkouts()
    this.renderAISuggestions()
    this.renderWorkoutHistory()
    this.renderProgressMetrics()
    this.renderChallenges()
    this.renderRewards()
    this.setupSearch()
    this.setupDropdowns()
    this.initializeCharts()
    this.setupTheme()
  }

  // =============================
  // Mobile Responsiveness
  // =============================
  setupMobileResponsiveness() {
    this.setupMobileMenu()
    this.handleResize()

    // Listen for window resize
    window.addEventListener("resize", () => {
      this.handleResize()
    })
  }

  setupMobileMenu() {
    const mobileToggle = document.getElementById("mobile-menu-toggle")
    const topNav = document.getElementById("top-nav")
    const mobileOverlay = document.getElementById("mobile-overlay")

    if (mobileToggle && topNav && mobileOverlay) {
      mobileToggle.addEventListener("click", () => {
        const isOpen = topNav.classList.contains("mobile-open")
        if (isOpen) {
          this.closeMobileMenu()
        } else {
          this.openMobileMenu()
        }
      })

      // Close menu when clicking overlay
      mobileOverlay.addEventListener("click", () => {
        this.closeMobileMenu()
      })

      // Enhanced: Dropdown logic for mobile
      topNav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", (e) => {
          const parentLi = link.closest("li.dropdown")
          if (parentLi && this.isMobile) {
            e.preventDefault()
            // Toggle only this dropdown
            const isActive = parentLi.classList.contains("active")
            topNav.querySelectorAll("li.dropdown").forEach(li => li.classList.remove("active"))
            if (!isActive) parentLi.classList.add("active")
            return
          }
          if (this.isMobile) {
            this.closeMobileMenu()
          }
        })
      })
    }
  }

  openMobileMenu() {
    const topNav = document.getElementById("top-nav")
    const mobileOverlay = document.getElementById("mobile-overlay")
    const mobileToggle = document.getElementById("mobile-menu-toggle")

    topNav?.classList.add("mobile-open")
    mobileOverlay?.classList.add("active")
    mobileToggle?.classList.add("active")
    document.body.style.overflow = "hidden"
  }

  closeMobileMenu() {
    const topNav = document.getElementById("top-nav")
    const mobileOverlay = document.getElementById("mobile-overlay")
    const mobileToggle = document.getElementById("mobile-menu-toggle")

    topNav?.classList.remove("mobile-open")
    mobileOverlay?.classList.remove("active")
    mobileToggle?.classList.remove("active")
    document.body.style.overflow = ""
  }

  handleResize() {
    const newIsMobile = window.innerWidth <= 768

    if (newIsMobile !== this.isMobile) {
      this.isMobile = newIsMobile

      if (!this.isMobile) {
        this.closeMobileMenu()
      }

      // Adjust layouts for mobile
      this.adjustLayoutForScreen()
    }
  }

  adjustLayoutForScreen() {
    const quickActions = document.querySelector(".quick-actions-bar")
    const overviewStats = document.querySelector(".overview-stats")
    const challengesContainer = document.querySelector(".challenges-rewards-container")

    if (this.isMobile) {
      // Mobile adjustments
      if (quickActions) {
        quickActions.style.gridTemplateColumns = "repeat(2, 1fr)"
      }
      if (overviewStats) {
        overviewStats.style.gridTemplateColumns = "1fr"
      }
      if (challengesContainer) {
        challengesContainer.style.gridTemplateColumns = "1fr"
      }
    } else {
      // Desktop adjustments
      if (quickActions) {
        quickActions.style.gridTemplateColumns = "repeat(auto-fit, minmax(120px, 1fr))"
      }
      if (overviewStats) {
        overviewStats.style.gridTemplateColumns = "repeat(auto-fit, minmax(250px, 1fr))"
      }
      if (challengesContainer) {
        challengesContainer.style.gridTemplateColumns = "1fr 1fr"
      }
    }
  }

  // =============================
  // User Management
  // =============================
  getCurrentUser() {
    const loggedInUser = localStorage.getItem("loggedInUser")
    if (loggedInUser) {
      try {
        return JSON.parse(loggedInUser)
      } catch (e) {
        return null
      }
    }
    return null
  }

  updateWelcomeBanner() {
    const welcomeBanner = document.getElementById("welcome-banner")
    const userNameSpan = document.querySelector(".user-name")
    const userInitials = document.getElementById("user-initials")

    if (this.currentUser && this.currentUser.name && this.currentUser.name !== "Guest") {
      const firstName = this.currentUser.name.split("@")[0].split(" ")[0]
      const welcomeMessages = [
        `Welcome back, <span class="highlight">${firstName}</span>! Ready to crush your goals today?`,
        `Hey <span class="highlight">${firstName}</span>! Let's make today count!`,
        `Good to see you, <span class="highlight">${firstName}</span>! Time to get moving!`,
        `Welcome <span class="highlight">${firstName}</span>! Your fitness journey continues!`,
      ]

      const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)]
      welcomeBanner.innerHTML = `<h2>${randomMessage}</h2>`

      userNameSpan.textContent = firstName
      userInitials.textContent = firstName.charAt(0).toUpperCase()
    } else {
      welcomeBanner.innerHTML = `<h2>Welcome, <span class="highlight">Guest</span>! Sign in to unlock your personalized dashboard.</h2>`
      userNameSpan.textContent = "Guest"
      userInitials.textContent = "G"
    }
  }

  // =============================
  // Data Loading with Enhanced Challenges & Rewards
  // =============================
  loadWorkoutData() {
    const savedWorkouts = JSON.parse(localStorage.getItem("savedWorkouts") || "[]")
    const workoutHistory = JSON.parse(localStorage.getItem("workoutHistory") || "[]")
    const workoutFolders = JSON.parse(localStorage.getItem("workoutFolders") || "[]")

    return {
      saved: savedWorkouts,
      history: workoutHistory,
      folders: workoutFolders,
    }
  }

  loadChallengeData() {
    const activeChallenges = JSON.parse(localStorage.getItem("activeChallenges") || "[]")
    const completedRewards = JSON.parse(localStorage.getItem("completedRewards") || "[]")

    // Enhanced challenges with more variety
    if (activeChallenges.length === 0) {
      const defaultChallenges = [
        {
          id: 1,
          title: "Workout 5 Days This Week",
          description: "Complete at least one workout on 5 different days this week.",
          progress: Math.floor(Math.random() * 4) + 1,
          target: 5,
          reward: "Badge: Consistency Champion",
          type: "weekly",
          icon: "calendar_today",
          difficulty: "medium",
        },
        {
          id: 2,
          title: "Burn 1000 Calories",
          description: "Burn a total of 1000 calories through workouts this week.",
          progress: Math.floor(Math.random() * 800) + 200,
          target: 1000,
          reward: "Badge: Calorie Crusher",
          type: "weekly",
          icon: "local_fire_department",
          difficulty: "hard",
        },
        {
          id: 3,
          title: "Try 3 New Exercises",
          description: "Add variety to your routine by trying 3 new exercises.",
          progress: Math.floor(Math.random() * 2),
          target: 3,
          reward: "Badge: Explorer",
          type: "monthly",
          icon: "explore",
          difficulty: "easy",
        },
        {
          id: 4,
          title: "Complete 10 Push-ups",
          description: "Build upper body strength by completing 10 consecutive push-ups.",
          progress: Math.floor(Math.random() * 8) + 1,
          target: 10,
          reward: "Badge: Push-up Pro",
          type: "skill",
          icon: "fitness_center",
          difficulty: "medium",
        },
        {
          id: 5,
          title: "30-Day Streak",
          description: "Maintain a 30-day workout streak to build lasting habits.",
          progress: Math.floor(Math.random() * 25) + 5,
          target: 30,
          reward: "Badge: Habit Master",
          type: "streak",
          icon: "trending_up",
          difficulty: "hard",
        },
        {
          id: 6,
          title: "Morning Warrior",
          description: "Complete 5 morning workouts before 9 AM.",
          progress: Math.floor(Math.random() * 3),
          target: 5,
          reward: "Badge: Early Bird",
          type: "time-based",
          icon: "wb_sunny",
          difficulty: "medium",
        },
        {
          id: 7,
          title: "Hydration Hero",
          description: "Drink 8 glasses of water daily for 7 consecutive days.",
          progress: Math.floor(Math.random() * 5) + 1,
          target: 7,
          reward: "Badge: Hydration Hero",
          type: "health",
          icon: "local_drink",
          difficulty: "easy",
        },
        {
          id: 8,
          title: "Flexibility Focus",
          description: "Complete 3 stretching or yoga sessions this week.",
          progress: Math.floor(Math.random() * 2),
          target: 3,
          reward: "Badge: Flexibility Master",
          type: "weekly",
          icon: "self_improvement",
          difficulty: "easy",
        },
      ]

      localStorage.setItem("activeChallenges", JSON.stringify(defaultChallenges))
      return { active: defaultChallenges, completed: completedRewards }
    }

    return { active: activeChallenges, completed: completedRewards }
  }

  // =============================
  // Overview Stats
  // =============================
  renderOverviewStats() {
    const statsContainer = document.getElementById("overview-stats")
    const totalWorkouts = this.workoutData.history.length
    const thisWeekWorkouts = this.getThisWeekWorkouts().length
    const totalTime = this.calculateTotalWorkoutTime()
    const totalCalories = this.calculateTotalCalories()

    statsContainer.innerHTML = `
      <div class="stat-card">
        <div class="stat-icon">
          <i class="material-icons">fitness_center</i>
        </div>
        <div class="stat-content">
          <h2>Total Workouts</h2>
          <p class="stat-value">${totalWorkouts}</p>
          <p class="stat-change positive">+${Math.floor(Math.random() * 5) + 1} from last month</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <i class="material-icons">event</i>
        </div>
        <div class="stat-content">
          <h2>This Week</h2>
          <p class="stat-value">${thisWeekWorkouts} Workouts</p>
          <p class="stat-change positive">On track for goal</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <i class="material-icons">timer</i>
        </div>
        <div class="stat-content">
          <h2>Total Time</h2>
          <p class="stat-value">${totalTime}</p>
          <p class="stat-change positive">+${Math.floor(Math.random() * 60) + 15} min from last week</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <i class="material-icons">local_fire_department</i>
        </div>
        <div class="stat-content">
          <h2>Calories Burned</h2>
          <p class="stat-value">${totalCalories.toLocaleString()} kcal</p>
          <p class="stat-change positive">+${Math.floor(Math.random() * 500) + 100} from last week</p>
        </div>
      </div>
    `
  }

  getThisWeekWorkouts() {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    return this.workoutData.history.filter((workout) => {
      if (!workout.date) return false
      const workoutDate = new Date(workout.date)
      return workoutDate >= startOfWeek
    })
  }

  calculateTotalWorkoutTime() {
    const totalMinutes = this.workoutData.history.reduce((total, workout) => {
      return total + (workout.duration || 30)
    }, 0)

    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${hours}h ${minutes}m`
  }

  calculateTotalCalories() {
    return this.workoutData.history.reduce((total, workout) => {
      return total + (workout.calories || Math.floor(Math.random() * 300) + 200)
    }, 0)
  }

  // =============================
  // Workout Folders Management
  // =============================
  renderWorkoutFolders() {
    const foldersContainer = document.getElementById("folders-container")
    const folders = this.workoutData.folders

    let foldersHTML = `
      <div class="workout-folder create-folder-card" onclick="dashboard.createNewFolder()">
        <div class="folder-header">
          <span class="folder-name">
            <i class="material-icons">add</i> Create New Folder
          </span>
        </div>
      </div>
    `

    folders.forEach((folder, index) => {
      const workoutCount = folder.workouts ? folder.workouts.length : 0
      foldersHTML += `
        <div class="workout-folder">
          <div class="folder-header">
            <span class="folder-name">${folder.name}</span>
            <button class="btn-icon" onclick="dashboard.deleteFolder(${index})" title="Delete Folder">
              <i class="material-icons">delete</i>
            </button>
          </div>
          <div class="folder-workouts">
            ${
              workoutCount === 0
                ? '<p class="empty-folder">No workouts in this folder</p>'
                : `<p>${workoutCount} workout${workoutCount !== 1 ? "s" : ""}</p>`
            }
            ${workoutCount > 0 ? this.renderFolderWorkouts(folder.workouts) : ""}
          </div>
          <button class="btn btn-secondary" onclick="dashboard.addWorkoutToFolder(${index})">
            Add Workout
          </button>
        </div>
      `
    })

    foldersContainer.innerHTML = foldersHTML
  }

  renderFolderWorkouts(workouts) {
    if (!workouts || workouts.length === 0) return ""

    let workoutsHTML = '<div class="folder-workout-list">'
    workouts.slice(0, 3).forEach((workout, index) => {
      workoutsHTML += `
        <div class="folder-workout-item" onclick="dashboard.viewWorkoutInFolder('${workout.id}')">
          <span class="workout-name">${workout.name}</span>
          <span class="workout-duration">${workout.duration || "30"} min</span>
        </div>
      `
    })

    if (workouts.length > 3) {
      workoutsHTML += `<div class="folder-workout-more">+${workouts.length - 3} more</div>`
    }

    workoutsHTML += "</div>"
    return workoutsHTML
  }

  createNewFolder() {
    const modal = document.getElementById("createFolderModal")
    modal.classList.add("active")
  }

  deleteFolder(index) {
    if (confirm("Are you sure you want to delete this folder and all its workouts?")) {
      const folders = this.workoutData.folders
      folders.splice(index, 1)
      localStorage.setItem("workoutFolders", JSON.stringify(folders))
      this.workoutData.folders = folders
      this.renderWorkoutFolders()
      this.showNotification("Folder deleted successfully", "success")
    }
  }

  addWorkoutToFolder(folderIndex) {
    sessionStorage.setItem("addWorkoutToFolderIdx", folderIndex)
    window.location.href = "workout-planner.html"
  }

  viewWorkoutInFolder(workoutId) {
    this.showNotification("Opening workout details...", "info")
  }

  // =============================
  // Workouts Management
  // =============================
  renderWorkouts() {
    const workoutsContainer = document.getElementById("workouts-container")
    const workouts = this.workoutData.saved

    if (workouts.length === 0) {
      workoutsContainer.innerHTML = `
        <div class="empty-state">
          <i class="material-icons">fitness_center</i>
          <p>No workouts created yet</p>
          <p>Create your first workout to get started!</p>
          <button class="btn btn-primary" onclick="dashboard.createNewWorkout()">
            <i class="material-icons">add</i> Create Workout
          </button>
        </div>
      `
      return
    }

    let workoutsHTML = ""
    workouts.slice(0, 6).forEach((workout, index) => {
      const exerciseCount = workout.exercises ? workout.exercises.length : 0
      const duration = workout.duration || "30 min"

      workoutsHTML += `
        <div class="workout-card">
          <h2>${workout.name || "Unnamed Workout"}</h2>
          <p><strong>Duration:</strong> ${duration} | <strong>Exercises:</strong> ${exerciseCount}</p>
          <div class="workout-actions">
            <button class="btn btn-secondary" onclick="dashboard.editWorkout(${index})">
              <i class="material-icons">edit</i> Edit
            </button>
            <button class="btn btn-secondary" onclick="dashboard.deleteWorkout(${index})">
              <i class="material-icons">delete</i> Delete
            </button>
            <button class="btn btn-primary" onclick="dashboard.startWorkout(${index})">
              <i class="material-icons">play_arrow</i> Start
            </button>
          </div>
        </div>
      `
    })

    workoutsContainer.innerHTML = workoutsHTML
  }

  createNewWorkout() {
    window.location.href = "workout-planner.html"
  }

  editWorkout(index) {
    window.location.href = `workout-planner.html?edit=${index}`
  }

  deleteWorkout(index) {
    if (confirm("Are you sure you want to delete this workout?")) {
      const workouts = this.workoutData.saved
      workouts.splice(index, 1)
      localStorage.setItem("savedWorkouts", JSON.stringify(workouts))
      this.workoutData.saved = workouts
      this.renderWorkouts()
      this.showNotification("Workout deleted successfully", "success")
    }
  }

  startWorkout(index) {
    const workout = this.workoutData.saved[index]
    if (workout) {
      localStorage.setItem("currentWorkout", JSON.stringify(workout))
      window.location.href = "workout-session.html"
    }
  }

  // =============================
  // AI Suggestions
  // =============================
  renderAISuggestions() {
    const suggestionsContainer = document.getElementById("ai-suggestions")
    const aiGreeting = document.getElementById("ai-greeting")
    const aiMessage = document.getElementById("ai-message")

    if (this.currentUser && this.currentUser.name && this.currentUser.name !== "Guest") {
      const firstName = this.currentUser.name.split("@")[0].split(" ")[0]
      aiGreeting.textContent = `Hello, ${firstName}! Here's your personalized fitness insight:`

      const personalizedMessages = [
        `Based on your recent activity patterns and goals, I've created some tailored workout recommendations. Your consistency has improved - great job!`,
        `I've analyzed your workout history and created some balanced routines that match your fitness level. Keep up the excellent work!`,
        `Your dedication is showing! Here are some progressive workouts to help you reach the next level.`,
      ]

      aiMessage.textContent = personalizedMessages[Math.floor(Math.random() * personalizedMessages.length)]
    }

    const suggestions = this.generateAIWorkoutSuggestions()

    let suggestionsHTML = ""
    suggestions.forEach((suggestion) => {
      suggestionsHTML += `
        <div class="suggestion-card">
          <div class="suggestion-header">
            <h3>${suggestion.name}</h3>
            <span class="ai-tag">AI Recommended</span>
          </div>
          <p>${suggestion.description}</p>
          <div class="suggestion-details">
            <div class="detail-item">
              <span class="detail-label">Difficulty</span>
              <span class="detail-value">${suggestion.difficulty}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Duration</span>
              <span class="detail-value">${suggestion.duration}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Focus</span>
              <span class="detail-value">${suggestion.focus}</span>
            </div>
          </div>
          <button class="btn-primary start-ai-workout-btn" onclick="dashboard.startAIWorkout('${suggestion.id}')">
            <i class="material-icons">play_arrow</i> Start Workout
          </button>
        </div>
      `
    })

    suggestionsContainer.innerHTML = suggestionsHTML
  }

  generateAIWorkoutSuggestions() {
    const workoutTypes = [
      {
        name: "Upper Body Power",
        description: "A strength session focused on chest, back, and arms. Perfect for building muscle.",
        difficulty: "Intermediate",
        duration: "45 minutes",
        focus: "Upper Body",
        id: "ai-upper-power",
      },
      {
        name: "HIIT Fat Burner",
        description: "High-intensity intervals to maximize calorie burn and boost metabolism.",
        difficulty: "Advanced",
        duration: "30 minutes",
        focus: "Full Body",
        id: "ai-hiit-burner",
      },
      {
        name: "Core Stability",
        description: "Strengthen your core with targeted exercises for better posture and balance.",
        difficulty: "Beginner",
        duration: "25 minutes",
        focus: "Core",
        id: "ai-core-stability",
      },
      {
        name: "Flexibility Flow",
        description: "A yoga-inspired routine to improve flexibility and aid recovery.",
        difficulty: "Beginner",
        duration: "35 minutes",
        focus: "Flexibility",
        id: "ai-flexibility-flow",
      },
      {
        name: "Lower Body Blast",
        description: "Target your legs and glutes with this comprehensive lower body workout.",
        difficulty: "Intermediate",
        duration: "40 minutes",
        focus: "Lower Body",
        id: "ai-lower-blast",
      },
    ]

    return workoutTypes.sort(() => 0.5 - Math.random()).slice(0, 3)
  }

  startAIWorkout(workoutId) {
    const aiWorkout = this.createAIWorkoutFromId(workoutId)
    localStorage.setItem("currentWorkout", JSON.stringify(aiWorkout))
    window.location.href = "workout-session.html?ai=1"
  }

  createAIWorkoutFromId(workoutId) {
    const workoutTemplates = {
      "ai-upper-power": {
        name: "Upper Body Power",
        exercises: [
          { name: "Push-ups", sets: 3, reps: 12, rest: 60 },
          { name: "Pull-ups", sets: 3, reps: 8, rest: 90 },
          { name: "Dumbbell Press", sets: 3, reps: 10, rest: 60 },
          { name: "Rows", sets: 3, reps: 12, rest: 60 },
        ],
        duration: 45,
        difficulty: "Intermediate",
      },
      "ai-hiit-burner": {
        name: "HIIT Fat Burner",
        exercises: [
          { name: "Burpees", sets: 4, reps: 10, rest: 30 },
          { name: "Mountain Climbers", sets: 4, reps: 20, rest: 30 },
          { name: "Jump Squats", sets: 4, reps: 15, rest: 30 },
          { name: "High Knees", sets: 4, reps: 20, rest: 30 },
        ],
        duration: 30,
        difficulty: "Advanced",
      },
      "ai-core-stability": {
        name: "Core Stability",
        exercises: [
          { name: "Plank", sets: 3, reps: "60 sec", rest: 45 },
          { name: "Russian Twists", sets: 3, reps: 20, rest: 45 },
          { name: "Dead Bug", sets: 3, reps: 10, rest: 45 },
          { name: "Bird Dog", sets: 3, reps: 10, rest: 45 },
        ],
        duration: 25,
        difficulty: "Beginner",
      },
    }

    return workoutTemplates[workoutId] || workoutTemplates["ai-core-stability"]
  }

  // =============================
  // Workout History & Search
  // =============================
  renderWorkoutHistory() {
    const historyTableBody = document.getElementById("history-table-body")
    let history = this.workoutData.history

    history = this.applySearchFilters(history)

    if (history.length === 0) {
      historyTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2rem; color: var(--light-text);">
            ${this.isSearchActive() ? "No workouts found matching your search criteria." : "No workout history available. Complete your first workout to see it here!"}
          </td>
        </tr>
      `
      return
    }

    let historyHTML = ""
    history.slice(0, 10).forEach((workout, index) => {
      const date = workout.date ? new Date(workout.date).toLocaleDateString() : "N/A"
      const duration = workout.duration ? `${workout.duration} min` : "N/A"
      const calories = workout.calories || Math.floor(Math.random() * 300) + 200
      const feedback = workout.feedback || "Great session!"

      historyHTML += `
        <tr>
          <td>${date}</td>
          <td>${workout.name || "Workout Session"}</td>
          <td>${duration}</td>
          <td>${calories} kcal</td>
          <td>${feedback}</td>
          <td>
            <button class="btn-icon" onclick="dashboard.viewWorkoutDetails(${index})" title="View Details">
              <i class="material-icons">visibility</i>
            </button>
            <button class="btn-icon" onclick="dashboard.repeatWorkout(${index})" title="Repeat Workout">
              <i class="material-icons">replay</i>
            </button>
          </td>
        </tr>
      `
    })

    historyTableBody.innerHTML = historyHTML
  }

  setupSearch() {
    const searchInput = document.getElementById("workout-search")
    const filterType = document.getElementById("filter-type")
    const filterDifficulty = document.getElementById("filter-difficulty")
    const filterDuration = document.getElementById("filter-duration")
    const filterFocus = document.getElementById("filter-focus")
    const clearFilters = document.getElementById("clear-filters")

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchState.query = e.target.value.toLowerCase()
        this.renderWorkoutHistory()
        this.renderActiveFilters()
      })
    }

    if (filterType) {
      filterType.addEventListener("change", (e) => {
        this.searchState.type = e.target.value
        this.renderWorkoutHistory()
        this.renderActiveFilters()
      })
    }

    if (filterDifficulty) {
      filterDifficulty.addEventListener("change", (e) => {
        this.searchState.difficulty = e.target.value
        this.renderWorkoutHistory()
        this.renderActiveFilters()
      })
    }

    if (filterDuration) {
      filterDuration.addEventListener("change", (e) => {
        this.searchState.duration = e.target.value
        this.renderWorkoutHistory()
        this.renderActiveFilters()
      })
    }

    if (filterFocus) {
      filterFocus.addEventListener("change", (e) => {
        this.searchState.focus = e.target.value
        this.renderWorkoutHistory()
        this.renderActiveFilters()
      })
    }

    if (clearFilters) {
      clearFilters.addEventListener("click", () => {
        this.clearAllFilters()
      })
    }
  }

  applySearchFilters(workouts) {
    return workouts.filter((workout) => {
      if (this.searchState.query && !workout.name.toLowerCase().includes(this.searchState.query)) {
        return false
      }

      if (this.searchState.type !== "all" && workout.type !== this.searchState.type) {
        return false
      }

      if (this.searchState.difficulty !== "all" && workout.difficulty !== this.searchState.difficulty) {
        return false
      }

      if (this.searchState.duration !== "all") {
        const duration = workout.duration || 30
        const [min, max] = this.searchState.duration.split("-").map(Number)
        if (max) {
          if (duration < min || duration > max) return false
        } else {
          if (duration < min) return false
        }
      }

      if (this.searchState.focus !== "all" && workout.focus !== this.searchState.focus) {
        return false
      }

      return true
    })
  }

  renderActiveFilters() {
    const activeFiltersContainer = document.getElementById("active-filters")
    if (!activeFiltersContainer) return

    const filters = []

    if (this.searchState.type !== "all") {
      filters.push({ key: "type", label: this.capitalize(this.searchState.type) })
    }

    if (this.searchState.difficulty !== "all") {
      filters.push({ key: "difficulty", label: this.capitalize(this.searchState.difficulty) })
    }

    if (this.searchState.duration !== "all") {
      filters.push({ key: "duration", label: this.searchState.duration + " min" })
    }

    if (this.searchState.focus !== "all") {
      filters.push({ key: "focus", label: this.capitalize(this.searchState.focus) })
    }

    let filtersHTML = ""
    filters.forEach((filter) => {
      filtersHTML += `
        <div class="filter-tag">
          ${filter.label}
          <i class="material-icons" onclick="dashboard.removeFilter('${filter.key}')">close</i>
        </div>
      `
    })

    activeFiltersContainer.innerHTML = filtersHTML
  }

  removeFilter(filterKey) {
    this.searchState[filterKey] = "all"
    document.getElementById(`filter-${filterKey}`).value = "all"
    this.renderWorkoutHistory()
    this.renderActiveFilters()
  }

  clearAllFilters() {
    this.searchState = {
      query: "",
      type: "all",
      difficulty: "all",
      duration: "all",
      focus: "all",
    }

    document.getElementById("workout-search").value = ""
    document.getElementById("filter-type").value = "all"
    document.getElementById("filter-difficulty").value = "all"
    document.getElementById("filter-duration").value = "all"
    document.getElementById("filter-focus").value = "all"

    this.renderWorkoutHistory()
    this.renderActiveFilters()
  }

  isSearchActive() {
    return (
      this.searchState.query !== "" ||
      this.searchState.type !== "all" ||
      this.searchState.difficulty !== "all" ||
      this.searchState.duration !== "all" ||
      this.searchState.focus !== "all"
    )
  }

  viewWorkoutDetails(index) {
    const workout = this.workoutData.history[index]
    if (workout) {
      this.showWorkoutModal(workout)
    }
  }

  repeatWorkout(index) {
    const workout = this.workoutData.history[index]
    if (workout) {
      localStorage.setItem("currentWorkout", JSON.stringify(workout))
      window.location.href = "workout-session.html"
    }
  }

  // =============================
  // Progress Analytics
  // =============================
  renderProgressMetrics() {
    const progressContainer = document.getElementById("progress-metrics")
    const avgDuration = this.calculateAverageWorkoutDuration()
    const weeklyConsistency = this.calculateWeeklyConsistency()
    const totalCalories = this.calculateTotalCalories()

    progressContainer.innerHTML = `
      <div class="metric-card">
        <div class="metric-icon">
          <i class="material-icons">timer</i>
        </div>
        <div class="metric-content">
          <h2>Average Workout Duration</h2>
          <p class="metric-value">${avgDuration} min</p>
          <div class="metric-progress">
            <div class="progress-bar" style="width: ${Math.min(100, (avgDuration / 60) * 100)}%"></div>
          </div>
          <p class="metric-target">Target: 60 min</p>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-icon">
          <i class="material-icons">calendar_today</i>
        </div>
        <div class="metric-content">
          <h2>Weekly Consistency</h2>
          <p class="metric-value">${weeklyConsistency}/7 days</p>
          <div class="metric-progress">
            <div class="progress-bar" style="width: ${(weeklyConsistency / 7) * 100}%"></div>
          </div>
          <p class="metric-target">Target: 7 days</p>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-icon">
          <i class="material-icons">local_fire_department</i>
        </div>
        <div class="metric-content">
          <h2>Total Calories Burned</h2>
          <p class="metric-value">${totalCalories.toLocaleString()} kcal</p>
          <div class="metric-progress">
            <div class="progress-bar" style="width: ${Math.min(100, (totalCalories / 10000) * 100)}%"></div>
          </div>
          <p class="metric-target">Target: 10,000 kcal</p>
        </div>
      </div>
    `
  }

  calculateAverageWorkoutDuration() {
    if (this.workoutData.history.length === 0) return 0
    const totalDuration = this.workoutData.history.reduce((sum, workout) => sum + (workout.duration || 30), 0)
    return Math.round(totalDuration / this.workoutData.history.length)
  }

  calculateWeeklyConsistency() {
    const thisWeekWorkouts = this.getThisWeekWorkouts()
    const uniqueDays = new Set()

    thisWeekWorkouts.forEach((workout) => {
      if (workout.date) {
        const day = new Date(workout.date).toDateString()
        uniqueDays.add(day)
      }
    })

    return uniqueDays.size
  }

  // =============================
  // Enhanced Challenges & Rewards
  // =============================
  renderChallenges() {
    const challengeList = document.getElementById("challenge-list")
    const challengeCount = document.getElementById("active-challenges-count")
    const challenges = this.challengeData.active

    challengeCount.textContent = `${challenges.length} Active`

    let challengesHTML = ""
    challenges.forEach((challenge, index) => {
      const progressPercent = Math.round((challenge.progress / challenge.target) * 100)
      const difficultyColor = this.getDifficultyColor(challenge.difficulty)

      challengesHTML += `
        <div class="challenge-item ${challenge.difficulty}" id="challenge-${challenge.id}">
          <div class="challenge-header" onclick="dashboard.toggleChallenge(${challenge.id})">
            <div class="challenge-icon" style="background-color: ${difficultyColor}20;">
              <i class="material-icons" style="color: ${difficultyColor};">${challenge.icon}</i>
            </div>
            <div class="challenge-info">
              <h3>${challenge.title}</h3>
              <p class="reward-label">${challenge.reward}</p>
              <div class="challenge-meta">
                <span class="challenge-type">${challenge.type}</span>
                <span class="challenge-difficulty ${challenge.difficulty}">${challenge.difficulty}</span>
              </div>
            </div>
            <div class="challenge-progress-indicator">
              <div class="progress-circle" style="--progress: ${progressPercent}%">
                <span>${challenge.progress}/${challenge.target}</span>
              </div>
            </div>
            <div class="challenge-toggle">
              <i class="material-icons">expand_more</i>
            </div>
          </div>
          <div class="challenge-details">
            <p>${challenge.description}</p>
            <div class="progress-container">
              <div class="progress-bar" style="width: ${progressPercent}%; background-color: ${difficultyColor};"></div>
            </div>
            <div class="challenge-actions">
              ${
                progressPercent < 100
                  ? `<button class="btn btn-primary" onclick="dashboard.updateChallengeProgress(${challenge.id})">
                  <i class="material-icons">add</i> Update Progress
                </button>`
                  : `<button class="btn btn-success" onclick="dashboard.completeChallenge(${challenge.id})">
                  <i class="material-icons">check</i> Claim Reward
                </button>`
              }
              <button class="btn btn-secondary" onclick="dashboard.skipChallenge(${challenge.id})">
                <i class="material-icons">skip_next</i> Skip
              </button>
            </div>
          </div>
        </div>
      `
    })

    challengeList.innerHTML = challengesHTML
  }

  getDifficultyColor(difficulty) {
    const colors = {
      easy: "#4CAF50",
      medium: "#FF9800",
      hard: "#F44336",
    }
    return colors[difficulty] || "#6A1B9A"
  }

  toggleChallenge(challengeId) {
    const challengeElement = document.getElementById(`challenge-${challengeId}`)
    if (challengeElement) {
      challengeElement.classList.toggle("expanded")
    }
  }

  updateChallengeProgress(challengeId) {
    const challenges = this.challengeData.active
    const challenge = challenges.find((c) => c.id === challengeId)

    if (challenge && challenge.progress < challenge.target) {
      challenge.progress += 1
      localStorage.setItem("activeChallenges", JSON.stringify(challenges))
      this.challengeData.active = challenges
      this.renderChallenges()
      this.showNotification("Progress updated! Keep it up!", "success")
    }
  }

  skipChallenge(challengeId) {
    if (confirm("Are you sure you want to skip this challenge? You can always try it again later.")) {
      const challenges = this.challengeData.active
      const challengeIndex = challenges.findIndex((c) => c.id === challengeId)

      if (challengeIndex !== -1) {
        challenges.splice(challengeIndex, 1)
        localStorage.setItem("activeChallenges", JSON.stringify(challenges))
        this.challengeData.active = challenges
        this.renderChallenges()
        this.showNotification("Challenge skipped. New challenges will appear soon!", "info")
      }
    }
  }

  completeChallenge(challengeId) {
    const challenges = this.challengeData.active
    const challengeIndex = challenges.findIndex((c) => c.id === challengeId)

    if (challengeIndex !== -1) {
      const challenge = challenges[challengeIndex]
      const completedRewards = this.challengeData.completed
      completedRewards.push({
        ...challenge,
        completedAt: new Date().toISOString(),
        points: this.calculateChallengePoints(challenge),
      })

      localStorage.setItem("completedRewards", JSON.stringify(completedRewards))
      challenges.splice(challengeIndex, 1)
      localStorage.setItem("activeChallenges", JSON.stringify(challenges))

      this.challengeData.active = challenges
      this.challengeData.completed = completedRewards

      this.renderChallenges()
      this.renderRewards()
      this.showChallengeCompletionModal(challenge)
    }
  }

  calculateChallengePoints(challenge) {
    const basePoints = {
      easy: 10,
      medium: 25,
      hard: 50,
    }
    return basePoints[challenge.difficulty] || 10
  }

  showChallengeCompletionModal(challenge) {
    const points = this.calculateChallengePoints(challenge)
    const modal = document.createElement("div")
    modal.className = "modal active challenge-completion-modal"
    modal.innerHTML = `
      <div class="modal-content">
        <div class="challenge-completion">
          <div class="completion-animation">
            <div class="completion-icon">
              <i class="material-icons">emoji_events</i>
            </div>
            <div class="confetti"></div>
          </div>
          <h2>🎉 Challenge Completed!</h2>
          <h3>${challenge.title}</h3>
          <p>Congratulations! You've earned:</p>
          <div class="reward-earned">
            <div class="reward-badge">
              <i class="material-icons">${challenge.icon}</i>
              <span>${challenge.reward}</span>
            </div>
            <div class="points-earned">
              <i class="material-icons">star</i>
              <span>+${points} Points</span>
            </div>
          </div>
          <div class="completion-actions">
            <button class="btn btn-primary" onclick="this.closest('.modal').remove()">
              <i class="material-icons">celebration</i> Awesome!
            </button>
            <button class="btn btn-secondary" onclick="dashboard.shareAchievement('${challenge.title}')">
              <i class="material-icons">share</i> Share
            </button>
          </div>
        </div>
      </div>
    `

    document.body.appendChild(modal)

    setTimeout(() => {
      if (modal.parentNode) {
        modal.remove()
      }
    }, 8000)
  }

  shareAchievement(challengeTitle) {
    if (navigator.share) {
      navigator.share({
        title: "FitJourney Achievement",
        text: `I just completed the "${challengeTitle}" challenge on FitJourney! 💪`,
        url: window.location.href,
      })
    } else {
      // Fallback for browsers that don't support Web Share API
      const text = `I just completed the "${challengeTitle}" challenge on FitJourney! 💪`
      navigator.clipboard.writeText(text).then(() => {
        this.showNotification("Achievement copied to clipboard!", "success")
      })
    }
  }

  renderRewards() {
    const rewardsGrid = document.getElementById("rewards-grid")
    const rewardsCount = document.getElementById("rewards-count")
    const completedRewards = this.challengeData.completed

    const defaultRewards = [
      {
        icon: "emoji_events",
        name: "Welcome",
        description: "Joined FitJourney",
        points: 5,
        rarity: "common",
      },
      {
        icon: "star",
        name: "First Steps",
        description: "First Workout",
        points: 10,
        rarity: "common",
      },
      {
        icon: "military_tech",
        name: "Getting Started",
        description: "5 Workouts",
        points: 25,
        rarity: "uncommon",
      },
      {
        icon: "workspace_premium",
        name: "Dedicated",
        description: "10 Workouts",
        points: 50,
        rarity: "rare",
      },
      {
        icon: "diamond",
        name: "Fitness Enthusiast",
        description: "25 Workouts",
        points: 100,
        rarity: "epic",
      },
    ]

    const allRewards = [...defaultRewards, ...completedRewards]
    const totalPoints = allRewards.reduce((sum, reward) => sum + (reward.points || 0), 0)

    rewardsCount.textContent = `${allRewards.length} Earned • ${totalPoints} Points`

    let rewardsHTML = ""
    allRewards.forEach((reward) => {
      const iconName = reward.icon || "star"
      const name = reward.name || reward.reward?.replace("Badge: ", "") || "Achievement"
      const description = reward.description || reward.title || "Completed challenge"
      const points = reward.points || 0
      const rarity = reward.rarity || "common"

      rewardsHTML += `
        <div class="reward-item ${rarity}" title="${name} - ${description}">
          <div class="reward-icon ${rarity}">
            <i class="material-icons">${iconName}</i>
          </div>
          <h4>${name}</h4>
          <p>${description}</p>
          ${points > 0 ? `<div class="reward-points">+${points} pts</div>` : ""}
        </div>
      `
    })

    rewardsGrid.innerHTML = rewardsHTML
  }

  // =============================
  // Charts and Visualization
  // =============================
  initializeCharts() {
    if (typeof Plotly !== "undefined") {
      this.renderWeeklyWorkoutChart()
      this.renderProgressChart()
    } else {
      document.getElementById("weekly-workout-chart").innerHTML = "Weekly workout chart will appear here"
      document.getElementById("progress-chart").innerHTML = "Progress chart will appear here"
    }
  }

  renderWeeklyWorkoutChart() {
    const chartElement = document.getElementById("weekly-workout-chart")
    if (!chartElement) return

    const dates = []
    const workoutCounts = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      dates.push(date.toLocaleDateString("en-US", { weekday: "short" }))
      workoutCounts.push(Math.floor(Math.random() * 3))
    }

    const data = [
      {
        x: dates,
        y: workoutCounts,
        type: "bar",
        marker: {
          color: "#FF6F00",
        },
      },
    ]

    const layout = {
      title: "",
      xaxis: { title: "Day" },
      yaxis: { title: "Workouts" },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { color: "#e0e0e0" },
    }

    Plotly.newPlot(chartElement, data, layout, { responsive: true })
  }

  renderProgressChart() {
    const chartElement = document.getElementById("progress-chart")
    if (!chartElement) return

    const weeks = ["Week 1", "Week 2", "Week 3", "Week 4"]
    const duration = [25, 30, 35, 40]
    const calories = [200, 250, 300, 350]

    const data = [
      {
        x: weeks,
        y: duration,
        type: "scatter",
        mode: "lines+markers",
        name: "Duration (min)",
        line: { color: "#6A1B9A" },
      },
      {
        x: weeks,
        y: calories,
        type: "scatter",
        mode: "lines+markers",
        name: "Calories",
        yaxis: "y2",
        line: { color: "#FF6F00" },
      },
    ]

    const layout = {
      title: "",
      xaxis: { title: "Time Period" },
      yaxis: { title: "Duration (min)" },
      yaxis2: {
        title: "Calories",
        overlaying: "y",
        side: "right",
      },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { color: "#e0e0e0" },
    }

    Plotly.newPlot(chartElement, data, layout, { responsive: true })
  }

  // =============================
  // Theme Management
  // =============================
  setupTheme() {
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme === "light") {
      document.body.classList.add("light-mode")
      const icon = document.getElementById("theme-icon")
      if (icon) icon.textContent = "light_mode"
    }
  }

  // =============================
  // Event Listeners
  // =============================
  setupEventListeners() {
    this.setupQuickActions()
    this.setupDropdowns()
    this.setupModals()
    this.setupChartControls()
    this.setupThemeToggle()
    this.setupAIChat()
  }

  setupQuickActions() {
    const quickActions = {
      "btn-new-workout": () => this.createNewWorkout(),
      "btn-start-session": () => this.startQuickSession(),
      "btn-log-meal": () => this.logMeal(),
      "btn-log-water": () => this.logWater(),
      "btn-view-progress": () => this.viewProgress(),
      "btn-refresh-data": () => this.refreshData(),
      "btn-personalized-plan": () => this.getPersonalizedPlan(),
      "btn-chat-coach": () => this.openAIChat(),
      "btn-export-history": () => this.exportHistory(),
      "btn-set-goals": () => this.setGoals(),
      "browse-challenges-btn": () => this.browseChallenges(),
    }

    Object.entries(quickActions).forEach(([id, handler]) => {
      const element = document.getElementById(id)
      if (element) {
        element.addEventListener("click", handler)
      }
    })
  }

  setupDropdowns() {
    // Enhanced dropdown functionality with proper event handling
    document.querySelectorAll(".dropdown").forEach((dropdown) => {
      const trigger = dropdown.querySelector("a")
      if (trigger) {
        trigger.addEventListener("click", (e) => {
          e.preventDefault()
          e.stopPropagation()

          // Close other dropdowns
          document.querySelectorAll(".dropdown.active").forEach((otherDropdown) => {
            if (otherDropdown !== dropdown) {
              otherDropdown.classList.remove("active")
            }
          })

          // Toggle current dropdown
          dropdown.classList.toggle("active")
        })
      }
    })

    // User profile dropdown
    const userProfile = document.querySelector(".user-profile")
    if (userProfile) {
      userProfile.addEventListener("click", (e) => {
        e.stopPropagation()

        // Close other dropdowns
        document.querySelectorAll(".dropdown.active").forEach((dropdown) => {
          dropdown.classList.remove("active")
        })

        // Toggle user profile dropdown
        userProfile.classList.toggle("active")
      })
    }

    // Close dropdowns when clicking outside
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".dropdown") && !e.target.closest(".user-profile")) {
        document.querySelectorAll(".dropdown.active, .user-profile.active").forEach((el) => {
          el.classList.remove("active")
        })
      }
    })

    // Close dropdowns on escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        document.querySelectorAll(".dropdown.active, .user-profile.active").forEach((el) => {
          el.classList.remove("active")
        })
      }
    })

    // Handle dropdown menu item clicks
    document.querySelectorAll(".dropdown-menu a, .user-dropdown-menu a").forEach((link) => {
      link.addEventListener("click", (e) => {
        // Close dropdown after clicking a menu item
        const dropdown = link.closest(".dropdown") || link.closest(".user-profile")
        if (dropdown) {
          dropdown.classList.remove("active")
        }
      })
    })

    // --- Mobile: close menu when a dropdown link is clicked ---
    const topNav = document.getElementById('top-nav');
    if (topNav) {
      topNav.querySelectorAll('.dropdown-menu a').forEach(link => {
        link.addEventListener('click', () => {
          if (window.innerWidth <= 768) {
            document.body.style.overflow = '';
            topNav.classList.remove('mobile-open');
            const mobileOverlay = document.getElementById('mobile-overlay');
            const mobileToggle = document.getElementById('mobile-menu-toggle');
            mobileOverlay && mobileOverlay.classList.remove('active');
            mobileToggle && mobileToggle.classList.remove('active');
          }
        });
      });
    }
  }

  setupModals() {
    document.querySelectorAll(".modal-close").forEach((closeBtn) => {
      closeBtn.addEventListener("click", () => {
        closeBtn.closest(".modal").classList.remove("active")
      })
    })

    // Close modal when clicking outside
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal")) {
        e.target.classList.remove("active")
      }
    })

    // Close modal on escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        document.querySelectorAll(".modal.active").forEach((modal) => {
          modal.classList.remove("active")
        })
      }
    })

    const createFolderForm = document.getElementById("create-folder-form")
    if (createFolderForm) {
      createFolderForm.addEventListener("submit", (e) => {
        e.preventDefault()
        this.handleCreateFolder()
      })
    }

    // Color option selection for folder creation
    document.querySelectorAll(".color-option").forEach((option) => {
      option.addEventListener("click", () => {
        document.querySelectorAll(".color-option").forEach((opt) => opt.classList.remove("active"))
        option.classList.add("active")
      })
    })
  }

  setupChartControls() {
    document.querySelectorAll(".btn-chart-period").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".btn-chart-period").forEach((b) => b.classList.remove("active"))
        btn.classList.add("active")
        this.changeChartPeriod(btn.dataset.period)
      })
    })

    const progressSelector = document.getElementById("progress-metric-selector")
    if (progressSelector) {
      progressSelector.addEventListener("change", (e) => {
        this.changeProgressMetric(e.target.value)
      })
    }
  }

  setupThemeToggle() {
    const themeToggle = document.getElementById("theme-toggle")
    if (themeToggle) {
      themeToggle.addEventListener("click", () => {
        document.body.classList.toggle("light-mode")
        const icon = document.getElementById("theme-icon")
        if (icon) {
          icon.textContent = document.body.classList.contains("light-mode") ? "light_mode" : "dark_mode"
        }

        localStorage.setItem("theme", document.body.classList.contains("light-mode") ? "light" : "dark")

        // Re-render charts with new theme
        if (typeof Plotly !== "undefined") {
          this.initializeCharts()
        }
      })
    }
  }

  setupAIChat() {
    const chatToggle = document.getElementById("chat-toggle")
    const aiChatbot = document.getElementById("ai-chatbot")
    const closeChat = document.getElementById("close-chat")
    const minimizeChat = document.getElementById("minimize-chat")
    const sendChat = document.getElementById("send-chat")
    const chatInput = document.getElementById("chat-input")

    if (chatToggle && aiChatbot) {
      chatToggle.addEventListener("click", () => {
        aiChatbot.classList.toggle("hidden")
      })
    }

    if (closeChat && aiChatbot) {
      closeChat.addEventListener("click", () => {
        aiChatbot.classList.add("hidden")
      })
    }

    if (minimizeChat && aiChatbot) {
      minimizeChat.addEventListener("click", () => {
        aiChatbot.classList.toggle("minimized")
      })
    }

    if (sendChat && chatInput) {
      const sendMessage = () => {
        const message = chatInput.value.trim()
        if (message) {
          this.sendChatMessage(message)
          chatInput.value = ""
        }
      }

      sendChat.addEventListener("click", sendMessage)
      chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          sendMessage()
        }
      })
    }

    document.querySelectorAll(".suggestion-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        this.sendChatMessage(chip.textContent)
      })
    })
  }

  // =============================
  // Quick Action Handlers
  // =============================
  startQuickSession() {
    const quickWorkout = {
      name: "Quick Session",
      duration: 15,
      exercises: [
        { name: "Jumping Jacks", sets: 2, reps: 20, rest: 30 },
        { name: "Push-ups", sets: 2, reps: 10, rest: 30 },
        { name: "Squats", sets: 2, reps: 15, rest: 30 },
      ],
    }

    localStorage.setItem("currentWorkout", JSON.stringify(quickWorkout))
    window.location.href = "workout-session.html?quick=1"
  }

  logMeal() {
    window.location.href = "nutrition.html#log-meal"
  }

  logWater() {
    const waterIntake = JSON.parse(localStorage.getItem("dailyWaterIntake") || "0")
    const newIntake = waterIntake + 250
    localStorage.setItem("dailyWaterIntake", JSON.stringify(newIntake))
    this.showNotification("Water logged! +250ml", "success")
  }

  viewProgress() {
    document.getElementById("progress").scrollIntoView({ behavior: "smooth" })
  }

  refreshData() {
    this.showNotification("Refreshing data...", "info")

    setTimeout(() => {
      this.renderOverviewStats()
      this.renderWorkoutHistory()
      this.renderProgressMetrics()
      this.showNotification("Data refreshed successfully!", "success")
    }, 1000)
  }

  getPersonalizedPlan() {
    this.showNotification("Generating personalized plan...", "info")

    setTimeout(() => {
      this.renderAISuggestions()
      this.showNotification("New personalized recommendations available!", "success")
    }, 2000)
  }

  openAIChat() {
    const aiChatbot = document.getElementById("ai-chatbot")
    if (aiChatbot) {
      aiChatbot.classList.remove("hidden")
    }
  }

  exportHistory() {
    const history = this.workoutData.history
    const csvContent = this.convertToCSV(history)
    this.downloadCSV(csvContent, "workout-history.csv")
    this.showNotification("Workout history exported!", "success")
  }

  setGoals() {
    this.showNotification("Goals setting coming soon!", "info")
  }

  browseChallenges() {
    this.showNotification("More challenges coming soon!", "info")
  }

  // =============================
  // Chart Control Handlers
  // =============================
  changeChartPeriod(period) {
    if (typeof Plotly !== "undefined") {
      this.renderWeeklyWorkoutChart()
    }
    this.showNotification(`Chart updated to show ${period} view`, "info")
  }

  changeProgressMetric(metric) {
    if (typeof Plotly !== "undefined") {
      this.renderProgressChart()
    }
    this.showNotification(`Progress chart updated to show ${metric}`, "info")
  }

  // =============================
  // Modal Handlers
  // =============================
  showWorkoutModal(workout) {
    const modal = document.getElementById("detailModal")
    const modalTitle = document.getElementById("modalTitle")
    const modalBody = document.getElementById("modalBody")

    if (modal && modalTitle && modalBody) {
      modalTitle.textContent = workout.name || "Workout Details"
      modalBody.innerHTML = `
        <div class="workout-details">
          <p><strong>Date:</strong> ${workout.date ? new Date(workout.date).toLocaleDateString() : "N/A"}</p>
          <p><strong>Duration:</strong> ${workout.duration || "N/A"} minutes</p>
          <p><strong>Calories:</strong> ${workout.calories || "N/A"} kcal</p>
          <p><strong>Type:</strong> ${workout.type || "General"}</p>
          <p><strong>Difficulty:</strong> ${workout.difficulty || "N/A"}</p>
          ${
            workout.exercises
              ? `
            <div class="exercises-list">
              <h4>Exercises:</h4>
              <ul>
                ${workout.exercises.map((ex) => `<li>${ex.name} - ${ex.sets}x${ex.reps}</li>`).join("")}
              </ul>
            </div>
          `
              : ""
          }
        </div>
      `
      modal.classList.add("active")
    }
  }

  handleCreateFolder() {
    const folderName = document.getElementById("folder-name").value.trim()
    const selectedColor = document.querySelector(".color-option.active")?.style.backgroundColor || "#FF6F00"

    if (folderName) {
      const newFolder = {
        id: Date.now(),
        name: folderName,
        color: selectedColor,
        workouts: [],
        createdAt: new Date().toISOString(),
      }

      const folders = this.workoutData.folders
      folders.push(newFolder)
      localStorage.setItem("workoutFolders", JSON.stringify(folders))
      this.workoutData.folders = folders

      this.renderWorkoutFolders()
      document.getElementById("createFolderModal").classList.remove("active")
      document.getElementById("create-folder-form").reset()

      // Reset color selection to first option
      document.querySelectorAll(".color-option").forEach((opt) => opt.classList.remove("active"))
      document.querySelector(".color-option").classList.add("active")

      this.showNotification("Folder created successfully!", "success")
    }
  }

  // =============================
  // AI Chat Handlers
  // =============================
  sendChatMessage(message) {
    const chatBody = document.getElementById("chat-body")
    if (!chatBody) return

    this.addChatMessage(message, "user")

    setTimeout(() => {
      const response = this.generateAIResponse(message)
      this.addChatMessage(response, "bot")
    }, 1000)
  }

  addChatMessage(message, sender) {
    const chatBody = document.getElementById("chat-body")
    if (!chatBody) return

    const messageElement = document.createElement("div")
    messageElement.className = `chat-message ${sender}`

    const currentTime = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })

    if (sender === "bot") {
      messageElement.innerHTML = `
        <div class="message-avatar">
          <img src="images/ai-coach.png" alt="AI Coach">
        </div>
        <div class="message-content">
          <p>${message}</p>
          <span class="message-time">${currentTime}</span>
        </div>
      `
    } else {
      messageElement.innerHTML = `
        <div class="message-content">
          <p>${message}</p>
          <span class="message-time">${currentTime}</span>
        </div>
      `
    }

    chatBody.appendChild(messageElement)
    chatBody.scrollTop = chatBody.scrollHeight
  }

  generateAIResponse(message) {
    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes("workout") || lowerMessage.includes("exercise")) {
      return "I'd be happy to help with your workout! Based on your recent activity, I recommend focusing on compound movements like squats, deadlifts, and push-ups. Would you like me to create a specific routine for you?"
    } else if (lowerMessage.includes("nutrition") || lowerMessage.includes("diet")) {
      return "Great question about nutrition! A balanced diet with adequate protein (0.8-1g per lb of body weight) will support your fitness goals. Focus on whole foods, stay hydrated, and consider meal timing around your workouts."
    } else if (lowerMessage.includes("progress") || lowerMessage.includes("track")) {
      return "Your progress is looking good! I can see you've been consistent with your workouts. Keep tracking your sessions, and consider taking progress photos and measurements for a complete picture of your improvements."
    } else {
      return "I'm here to help with your fitness journey! Feel free to ask me about workouts, nutrition, progress tracking, or any other fitness-related questions."
    }
  }

  // =============================
  // Utility Functions
  // =============================
  showNotification(message, type = "info") {
    const container = document.getElementById("notification-container")
    if (!container) return

    const notification = document.createElement("div")
    notification.className = `notification notification-${type}`
    notification.innerHTML = `
      <i class="material-icons">${this.getNotificationIcon(type)}</i>
      <span>${message}</span>
      <button class="notification-close">
        <i class="material-icons">close</i>
      </button>
    `

    container.appendChild(notification)

    setTimeout(() => notification.classList.add("show"), 100)

    setTimeout(() => {
      notification.classList.remove("show")
      setTimeout(() => notification.remove(), 300)
    }, 5000)

    notification.querySelector(".notification-close").addEventListener("click", () => {
      notification.classList.remove("show")
      setTimeout(() => notification.remove(), 300)
    })
  }

  getNotificationIcon(type) {
    const icons = {
      success: "check_circle",
      error: "error",
      warning: "warning",
      info: "info",
    }
    return icons[type] || "info"
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  convertToCSV(data) {
    if (!data.length) return ""

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(","),
      ...data.map((row) => headers.map((header) => row[header] || "").join(",")),
    ].join("\n")

    return csvContent
  }

  downloadCSV(content, filename) {
    const blob = new Blob([content], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.dashboard = new FitJourneyDashboard()
  setupDropdowns()
})

// Dropdown menu logic for navigation and user profile
function setupDropdowns() {
  // Navigation dropdowns
  const navDropdowns = document.querySelectorAll('.dropdown');
  // User profile dropdown
  const userProfile = document.querySelector('.user-profile');
  const userDropdown = userProfile ? userProfile.querySelector('.user-dropdown-menu') : null;

  // Helper to close all dropdowns
  function closeAllDropdowns(except) {
    navDropdowns.forEach(drop => {
      if (drop !== except) drop.classList.remove('active');
    });
    if (userProfile && except !== userProfile) userProfile.classList.remove('active');
  }

  // Toggle nav dropdowns
  navDropdowns.forEach(dropdown => {
    const trigger = dropdown.querySelector('a, button');
    if (trigger) {
      trigger.addEventListener('click', e => {
        e.stopPropagation();
        const isActive = dropdown.classList.contains('active');
        closeAllDropdowns();
        if (!isActive) dropdown.classList.add('active');
      });
    }
  });

  // User profile dropdown
  if (userProfile) {
    userProfile.addEventListener('click', e => {
      e.stopPropagation();
      const isActive = userProfile.classList.contains('active');
      closeAllDropdowns();
      if (!isActive) userProfile.classList.add('active');
    });
  }

  // Close dropdowns on outside click
  document.addEventListener('click', () => closeAllDropdowns());
  // Close dropdowns on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAllDropdowns();
  });

  // --- Mobile: close menu when a dropdown link is clicked ---
  const topNav = document.getElementById('top-nav');
  if (topNav) {
    topNav.querySelectorAll('.dropdown-menu a').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          document.body.style.overflow = '';
          topNav.classList.remove('mobile-open');
          const mobileOverlay = document.getElementById('mobile-overlay');
          const mobileToggle = document.getElementById('mobile-menu-toggle');
          mobileOverlay && mobileOverlay.classList.remove('active');
          mobileToggle && mobileToggle.classList.remove('active');
        }
      });
    });
  }
}
