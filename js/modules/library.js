// Exercise Library Redesigned - Matching Dashboard Theme with AI Chat

// ===== Global Variables =====
let exercises = []
let filteredExercises = []
let currentPage = 1
const exercisesPerPage = 20
const favorites = JSON.parse(localStorage.getItem("favorites")) || []
let currentExercise = null
let totalExercises = 0
let isLoading = false
const chatHistory = []

// API Configuration
const API_CONFIG = {
  baseUrl: "https://exercisedb.p.rapidapi.com",
  headers: {
    "X-RapidAPI-Key": "02e5919d7cmshe07914db7605532p164aa8jsn0cde2d877db5",
    "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
  },
}

// AI Chat responses for fitness questions
const AI_RESPONSES = {
  "chest exercises":
    "Great chest exercises include push-ups, bench press, dumbbell flyes, and dips. For beginners, start with push-ups and incline push-ups. Focus on proper form with controlled movements.",
  "squat form":
    "For proper squat form: 1) Keep feet shoulder-width apart, 2) Keep chest up and core engaged, 3) Lower until thighs are parallel to ground, 4) Drive through heels to stand up, 5) Keep knees aligned with toes.",
  "beginner routine":
    "A great beginner routine includes: Day 1: Push-ups, squats, planks. Day 2: Rest or light walking. Day 3: Lunges, modified pull-ups, glute bridges. Start with 2-3 sets of 8-12 reps.",
  "sets and reps":
    "For muscle building: 3-4 sets of 8-12 reps with moderate to heavy weight. For strength: 3-5 sets of 1-6 reps with heavy weight. For endurance: 2-3 sets of 15+ reps with lighter weight.",
  "core exercises":
    "Effective core exercises include planks, dead bugs, bicycle crunches, mountain climbers, Russian twists, and leg raises. Focus on quality over quantity.",
  "injury prevention":
    "To prevent injuries: 1) Always warm up before exercising, 2) Use proper form, 3) Progress gradually, 4) Include rest days, 5) Stay hydrated, 6) Listen to your body and stop if you feel pain.",
}

// ===== DOM Elements =====
const themeToggle = document.getElementById("theme-toggle-btn")
const mobileMenuToggle = document.querySelector(".mobile-menu-toggle")
const mainNav = document.querySelector(".nav")

// Search and Filters
const searchInput = document.getElementById("search-input")
const searchClear = document.getElementById("search-clear")
const filterToggle = document.getElementById("filter-toggle")
const filterPanel = document.getElementById("filter-panel")
const closeFilter = document.getElementById("close-filter")
const resetFilters = document.getElementById("reset-filters")
const applyFilters = document.getElementById("apply-filters")
const quickFilterBtns = document.querySelectorAll(".quick-filter-btn")

// AI Chat
const aiChatBtn = document.getElementById("ai-chat-btn")
const aiChatPanel = document.getElementById("ai-chat-panel")
const closeChat = document.getElementById("close-chat")
const chatBody = document.getElementById("chat-body")
const chatInput = document.getElementById("chat-input")
const sendMessage = document.getElementById("send-message")

// Library Content
const exerciseCount = document.getElementById("exercise-count")
const gridViewBtn = document.getElementById("grid-view")
const listViewBtn = document.getElementById("list-view")
const sortSelect = document.getElementById("sort-select")
const loadingIndicator = document.getElementById("loading-indicator")
const exerciseGrid = document.getElementById("exercise-grid")
const emptyState = document.getElementById("empty-state")
const clearSearchFilters = document.getElementById("clear-search-filters")
const loadMoreBtn = document.getElementById("load-more")

// Exercise Modal
const exerciseModal = document.getElementById("exercise-modal")
const modalExerciseName = document.getElementById("modal-exercise-name")
const modalExerciseGif = document.getElementById("modal-exercise-gif")
const modalTarget = document.getElementById("modal-target")
const modalEquipment = document.getElementById("modal-equipment")
const modalBodyPart = document.getElementById("modal-body-part")
const modalInstructions = document.getElementById("modal-instructions")
const closeModal = document.getElementById("close-modal")
const addToFavorites = document.getElementById("add-to-favorites")
const askAiAboutExercise = document.getElementById("ask-ai-about-exercise")

// ===== Theme Toggle with Enhanced Animations =====
class LibraryThemeToggle {
  constructor() {
    this.isDark = document.body.classList.contains("dark-theme")
    this.button = document.getElementById("theme-toggle-btn")
    this.init()
  }

  init() {
    // Load saved theme
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme) {
      this.isDark = savedTheme === "dark"
      document.body.classList.toggle("dark-theme", this.isDark)
      this.updateIcon()
    }

    // Add event listeners
    if (this.button) {
      this.button.addEventListener("click", () => this.toggle())

      // Keyboard shortcut
      document.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "T") {
          e.preventDefault()
          this.toggle()
        }
      })
    }

    // System theme detection
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      mediaQuery.addEventListener("change", (e) => {
        if (!localStorage.getItem("theme")) {
          this.isDark = e.matches
          document.body.classList.toggle("dark-theme", this.isDark)
          this.updateIcon()
        }
      })
    }
  }

  toggle() {
    this.isDark = !this.isDark
    document.body.classList.toggle("dark-theme", this.isDark)
    localStorage.setItem("theme", this.isDark ? "dark" : "light")
    this.updateIcon()
    this.animateToggle()

    // Show toast
    showToast(`Switched to ${this.isDark ? "dark" : "light"} mode`, "success")
  }

  updateIcon() {
    if (this.button) {
      const icon = this.button.querySelector("i")
      if (icon) {
        icon.textContent = this.isDark ? "light_mode" : "dark_mode"
      }
    }
  }

  animateToggle() {
    if (this.button) {
      this.button.style.transform = "rotate(360deg) scale(1.2)"
      setTimeout(() => {
        this.button.style.transform = ""
      }, 300)
    }
  }
}

// ===== Initialization =====
document.addEventListener("DOMContentLoaded", () => {
  initializeApp()
})

function initializeApp() {
  console.log("Initializing Exercise Library...")

  // Initialize theme toggle
  new LibraryThemeToggle()

  // Set up event listeners
  setupEventListeners()

  // Fetch exercises immediately
  fetchExercises()

  // Show welcome message
  setTimeout(() => {
    showToast("Welcome to the Exercise Library! Ask our AI coach any fitness questions.", "info")
  }, 1000)
}

function setupEventListeners() {
  // Mobile menu
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener("click", toggleMobileMenu)
  }

  // Search
  if (searchInput) {
    searchInput.addEventListener("input", debounce(handleSearch, 300))
  }
  if (searchClear) {
    searchClear.addEventListener("click", clearSearch)
  }

  // Filters
  if (filterToggle) {
    filterToggle.addEventListener("click", toggleFilterPanel)
  }
  if (closeFilter) {
    closeFilter.addEventListener("click", toggleFilterPanel)
  }
  if (resetFilters) {
    resetFilters.addEventListener("click", resetAllFilters)
  }
  if (applyFilters) {
    applyFilters.addEventListener("click", applyAllFilters)
  }

  // AI Chat
  if (aiChatBtn) {
    aiChatBtn.addEventListener("click", toggleAiChat)
  }
  if (closeChat) {
    closeChat.addEventListener("click", toggleAiChat)
  }
  if (sendMessage) {
    sendMessage.addEventListener("click", sendChatMessage)
  }
  if (chatInput) {
    chatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        sendChatMessage()
      }
    })
  }

  // Quick questions and suggestions
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("quick-question") || e.target.classList.contains("suggestion")) {
      const question = e.target.dataset.question
      if (question) {
        chatInput.value = question
        sendChatMessage()
      }
    }
  })

  // Quick filters
  quickFilterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.target
      handleQuickFilter(target, btn)
    })
  })

  // View options
  if (gridViewBtn) {
    gridViewBtn.addEventListener("click", () => setViewMode("grid"))
  }
  if (listViewBtn) {
    listViewBtn.addEventListener("click", () => setViewMode("list"))
  }

  // Sort
  if (sortSelect) {
    sortSelect.addEventListener("change", sortExercises)
  }

  // Empty state
  if (clearSearchFilters) {
    clearSearchFilters.addEventListener("click", clearAllFilters)
  }

  // Load more
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", loadMoreExercises)
  }

  // Exercise modal
  if (closeModal) {
    closeModal.addEventListener("click", closeExerciseModal)
  }
  if (addToFavorites) {
    addToFavorites.addEventListener("click", toggleFavoriteInModal)
  }
  if (askAiAboutExercise) {
    askAiAboutExercise.addEventListener("click", askAiAboutCurrentExercise)
  }

  // Close modals when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target === exerciseModal) closeExerciseModal()
  })
}

// ===== Mobile Menu Functions =====
function toggleMobileMenu() {
  if (mainNav) {
    mainNav.classList.toggle("active")
    if (mobileMenuToggle) {
      const icon = mobileMenuToggle.querySelector("i")
      if (icon) {
        icon.textContent = mainNav.classList.contains("active") ? "close" : "menu"
      }
    }
  }
}

// ===== AI Chat Functions =====
function toggleAiChat() {
  if (aiChatPanel) {
    aiChatPanel.classList.toggle("active")

    // Close filter panel if open
    if (aiChatPanel.classList.contains("active") && filterPanel) {
      filterPanel.classList.remove("active")
    }

    // Focus on input when opening
    if (aiChatPanel.classList.contains("active") && chatInput) {
      setTimeout(() => chatInput.focus(), 300)
    }
  }
}

function sendChatMessage() {
  const message = chatInput.value.trim()
  if (!message) return

  // Add user message to chat
  addMessageToChat(message, "user")

  // Clear input
  chatInput.value = ""

  // Show typing indicator
  showTypingIndicator()

  // Generate AI response
  setTimeout(
    () => {
      hideTypingIndicator()
      const response = generateAiResponse(message)
      addMessageToChat(response, "ai")
    },
    1000 + Math.random() * 1000,
  ) // Random delay for realism
}

function addMessageToChat(message, sender) {
  if (!chatBody) return

  const messageDiv = document.createElement("div")
  messageDiv.className = `chat-message ${sender}-message`

  const avatar = document.createElement("div")
  avatar.className = "message-avatar"
  avatar.innerHTML =
    sender === "ai" ? '<i class="material-icons">smart_toy</i>' : '<i class="material-icons">person</i>'

  const content = document.createElement("div")
  content.className = "message-content"
  content.innerHTML = `<p>${message}</p>`

  messageDiv.appendChild(avatar)
  messageDiv.appendChild(content)

  chatBody.appendChild(messageDiv)

  // Scroll to bottom
  chatBody.scrollTop = chatBody.scrollHeight

  // Add to chat history
  chatHistory.push({ message, sender, timestamp: Date.now() })
}

function showTypingIndicator() {
  if (!chatBody) return

  const typingDiv = document.createElement("div")
  typingDiv.className = "chat-message ai-message typing-indicator"
  typingDiv.innerHTML = `
    <div class="message-avatar">
      <i class="material-icons">smart_toy</i>
    </div>
    <div class="message-content">
      <div class="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `

  chatBody.appendChild(typingDiv)
  chatBody.scrollTop = chatBody.scrollHeight
}

function hideTypingIndicator() {
  const typingIndicator = chatBody.querySelector(".typing-indicator")
  if (typingIndicator) {
    typingIndicator.remove()
  }
}

function generateAiResponse(message) {
  const lowerMessage = message.toLowerCase()

  // Check for specific keywords and return appropriate responses
  for (const [keyword, response] of Object.entries(AI_RESPONSES)) {
    if (lowerMessage.includes(keyword)) {
      return response
    }
  }

  // Default responses for common fitness topics
  if (lowerMessage.includes("workout") || lowerMessage.includes("exercise")) {
    return "I'd be happy to help with your workout questions! Could you be more specific about what you'd like to know? For example, are you looking for exercises for a particular muscle group, or do you need help with form?"
  }

  if (lowerMessage.includes("diet") || lowerMessage.includes("nutrition")) {
    return "While I focus mainly on exercises, I can tell you that proper nutrition is crucial for fitness goals. Consider consulting with a nutritionist for detailed dietary advice. For workouts, I'm here to help!"
  }

  if (lowerMessage.includes("weight loss") || lowerMessage.includes("lose weight")) {
    return "For weight loss, combine cardio exercises like running, cycling, or HIIT with strength training. Consistency is key! Try exercises like burpees, mountain climbers, and circuit training."
  }

  if (lowerMessage.includes("muscle") || lowerMessage.includes("build")) {
    return "For muscle building, focus on compound exercises like squats, deadlifts, bench press, and pull-ups. Use progressive overload - gradually increase weight, reps, or sets over time."
  }

  // Generic helpful response
  return "That's a great question! I'm here to help with exercise form, workout routines, muscle targeting, and fitness tips. Could you provide more details about what specific aspect of fitness you'd like to know about?"
}

function askAiAboutCurrentExercise() {
  if (!currentExercise) return

  // Open AI chat if not already open
  if (!aiChatPanel.classList.contains("active")) {
    toggleAiChat()
  }

  // Generate question about current exercise
  const question = `Tell me more about the ${currentExercise.name} exercise. What muscles does it target and what are some form tips?`

  // Set the question in the input
  if (chatInput) {
    chatInput.value = question
  }

  // Send the message
  setTimeout(() => {
    sendChatMessage()
  }, 500)

  // Close modal
  closeExerciseModal()
}

// ===== API Functions =====
async function fetchExercises(reset = true) {
  if (isLoading) return

  try {
    isLoading = true
    showLoading(true)

    console.log("Fetching exercises from API...")

    if (reset) {
      currentPage = 1
      exercises = []
    }

    const limit = exercisesPerPage
    const offset = (currentPage - 1) * exercisesPerPage

    const response = await fetch(`${API_CONFIG.baseUrl}/exercises?limit=${limit}&offset=${offset}`, {
      method: "GET",
      headers: API_CONFIG.headers,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log("Received exercises:", data.length)

    // Process the exercises data
    const processedExercises = data.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      target: exercise.target,
      equipment: exercise.equipment,
      bodyPart: exercise.bodyPart,
      gifUrl: exercise.gifUrl,
      instructions: exercise.instructions || [],
      secondaryMuscles: exercise.secondaryMuscles || [],
    }))

    if (reset) {
      exercises = processedExercises
      totalExercises = 1300 // ExerciseDB has around 1300+ exercises
    } else {
      exercises = [...exercises, ...processedExercises]
    }

    filteredExercises = [...exercises]
    applyCurrentFilters()
    updateExerciseCount()
    renderExercises()
    updateLoadMoreButton()

    showToast(`Loaded ${processedExercises.length} exercises`, "success")
  } catch (error) {
    console.error("Error fetching exercises:", error)
    showToast("Failed to load exercises", "error")
  } finally {
    isLoading = false
    showLoading(false)
  }
}

// Fetch exercises by body part
async function fetchExercisesByBodyPart(bodyPart) {
  try {
    showLoading(true)
    console.log("Fetching exercises for body part:", bodyPart)

    const response = await fetch(`${API_CONFIG.baseUrl}/exercises/bodyPart/${bodyPart}`, {
      method: "GET",
      headers: API_CONFIG.headers,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log("Received exercises for", bodyPart, ":", data.length)

    const processedExercises = data.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      target: exercise.target,
      equipment: exercise.equipment,
      bodyPart: exercise.bodyPart,
      gifUrl: exercise.gifUrl,
      instructions: exercise.instructions || [],
      secondaryMuscles: exercise.secondaryMuscles || [],
    }))

    exercises = processedExercises
    filteredExercises = [...exercises]
    updateExerciseCount()
    renderExercises()

    if (processedExercises.length === 0) {
      showEmptyState()
    } else {
      hideEmptyState()
    }
  } catch (error) {
    console.error("Error fetching exercises by body part:", error)
    showToast("Failed to load exercises for this body part", "error")
  } finally {
    showLoading(false)
  }
}

// ===== Search and Filter Functions =====
function handleSearch() {
  const searchTerm = searchInput.value.toLowerCase().trim()

  if (searchTerm === "") {
    if (searchClear) {
      searchClear.style.opacity = "0"
    }
  } else {
    if (searchClear) {
      searchClear.style.opacity = "1"
    }
  }

  applyCurrentFilters()
}

function clearSearch() {
  if (searchInput) {
    searchInput.value = ""
  }
  if (searchClear) {
    searchClear.style.opacity = "0"
  }
  applyCurrentFilters()
}

function toggleFilterPanel() {
  if (filterPanel) {
    filterPanel.classList.toggle("active")

    // Close AI chat if open
    if (filterPanel.classList.contains("active") && aiChatPanel) {
      aiChatPanel.classList.remove("active")
    }
  }
}

function resetAllFilters() {
  // Clear checkboxes
  document.querySelectorAll('.filter-option input[type="checkbox"]').forEach((checkbox) => {
    checkbox.checked = false
  })

  // Clear search
  clearSearch()

  // Reset quick filters
  quickFilterBtns.forEach((btn) => btn.classList.remove("active"))
  const allBtn = document.querySelector('.quick-filter-btn[data-target="all"]')
  if (allBtn) {
    allBtn.classList.add("active")
  }

  // Reset to all exercises
  fetchExercises()
}

function applyAllFilters() {
  applyCurrentFilters()
  toggleFilterPanel()
}

function applyCurrentFilters() {
  // Get selected muscle groups
  const selectedMuscleGroups = Array.from(document.querySelectorAll(".muscle-group-options input:checked")).map(
    (input) => input.value,
  )

  // Get selected equipment
  const selectedEquipment = Array.from(document.querySelectorAll(".equipment-options input:checked")).map(
    (input) => input.value,
  )

  // Get search term
  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : ""

  // Filter exercises
  filteredExercises = exercises.filter((exercise) => {
    // Filter by search term
    if (
      searchTerm &&
      !exercise.name.toLowerCase().includes(searchTerm) &&
      !exercise.target.toLowerCase().includes(searchTerm) &&
      !exercise.equipment.toLowerCase().includes(searchTerm) &&
      !exercise.bodyPart.toLowerCase().includes(searchTerm)
    ) {
      return false
    }

    // Filter by muscle group
    if (selectedMuscleGroups.length > 0 && !selectedMuscleGroups.includes(exercise.bodyPart.toLowerCase())) {
      return false
    }

    // Filter by equipment
    if (selectedEquipment.length > 0 && !selectedEquipment.includes(exercise.equipment.toLowerCase())) {
      return false
    }

    return true
  })

  updateExerciseCount()
  renderExercises()

  // Show/hide empty state
  if (filteredExercises.length === 0 && exercises.length > 0) {
    showEmptyState()
  } else {
    hideEmptyState()
  }
}

function handleQuickFilter(target, btn) {
  // Reset all quick filter buttons
  quickFilterBtns.forEach((b) => b.classList.remove("active"))
  btn.classList.add("active")

  // Clear other filters
  document.querySelectorAll('.filter-option input[type="checkbox"]').forEach((checkbox) => {
    checkbox.checked = false
  })

  if (target === "all") {
    fetchExercises()
  } else {
    // Fetch exercises for specific body part
    fetchExercisesByBodyPart(target)

    // Check the corresponding muscle group filter
    const targetCheckbox = document.querySelector(`.muscle-group-options input[value="${target}"]`)
    if (targetCheckbox) {
      targetCheckbox.checked = true
    }
  }
}

function clearAllFilters() {
  resetAllFilters()
}

function sortExercises() {
  if (!sortSelect) return

  const sortValue = sortSelect.value

  filteredExercises.sort((a, b) => {
    switch (sortValue) {
      case "name-asc":
        return a.name.localeCompare(b.name)
      case "name-desc":
        return b.name.localeCompare(a.name)
      case "difficulty-asc":
        return getEquipmentDifficulty(a.equipment) - getEquipmentDifficulty(b.equipment)
      case "difficulty-desc":
        return getEquipmentDifficulty(b.equipment) - getEquipmentDifficulty(a.equipment)
      default:
        return 0
    }
  })

  renderExercises()
}

function getEquipmentDifficulty(equipment) {
  const difficultyMap = {
    "body weight": 1,
    dumbbell: 2,
    kettlebell: 2,
    cable: 3,
    barbell: 3,
    machine: 3,
  }
  return difficultyMap[equipment.toLowerCase()] || 2
}

function setViewMode(mode) {
  if (mode === "grid") {
    if (gridViewBtn) gridViewBtn.classList.add("active")
    if (listViewBtn) listViewBtn.classList.remove("active")
    if (exerciseGrid) exerciseGrid.classList.remove("list-view")
  } else {
    if (listViewBtn) listViewBtn.classList.add("active")
    if (gridViewBtn) gridViewBtn.classList.remove("active")
    if (exerciseGrid) exerciseGrid.classList.add("list-view")
  }
}

// ===== Rendering Functions =====
function renderExercises() {
  if (!exerciseGrid) return

  exerciseGrid.innerHTML = ""

  filteredExercises.forEach((exercise, index) => {
    const card = createExerciseCard(exercise, index)
    exerciseGrid.appendChild(card)
  })
}

function createExerciseCard(exercise, index) {
  const card = document.createElement("div")
  card.className = "exercise-card"
  card.onclick = () => openExerciseModal(exercise)

  const isFavorite = favorites.includes(exercise.id)

  // Add entrance animation
  card.style.opacity = "0"
  card.style.transform = "translateY(30px)"

  card.innerHTML = `
    <div class="exercise-image-container">
      <img src="${exercise.gifUrl || "/placeholder.svg?height=200&width=320"}"
           alt="${exercise.name}"
           class="exercise-image"
           loading="lazy"
           onerror="this.src='/placeholder.svg?height=200&width=320'">
    </div>
    <div class="exercise-card-content">
      <h3 class="exercise-title">${exercise.name}</h3>
      <div class="exercise-meta">
        <div class="exercise-meta-item">
          <i class="material-icons">fitness_center</i>
          <span>${exercise.target}</span>
        </div>
        <div class="exercise-meta-item">
          <i class="material-icons">sports_gymnastics</i>
          <span>${exercise.equipment}</span>
        </div>
      </div>
      <div class="exercise-tags">
        <span class="exercise-tag">${exercise.bodyPart}</span>
      </div>
      <div class="exercise-actions">
        <button class="action-btn favorite-btn ${isFavorite ? "active" : ""}"
                onclick="event.stopPropagation(); toggleFavorite('${exercise.id}')"
                title="${isFavorite ? "Remove from favorites" : "Add to favorites"}">
          <i class="material-icons">${isFavorite ? "favorite" : "favorite_border"}</i>
        </button>
        <button class="action-btn view-btn"
                onclick="event.stopPropagation(); openExerciseModal('${exercise.id}')"
                title="View exercise details">
          <i class="material-icons">visibility</i>
          Details
        </button>
      </div>
    </div>
  `

  // Animate card entrance
  setTimeout(() => {
    card.style.transition = "all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
    card.style.opacity = "1"
    card.style.transform = "translateY(0)"
  }, index * 50) // Stagger animation

  return card
}

function updateExerciseCount() {
  if (exerciseCount) {
    exerciseCount.textContent = filteredExercises.length
  }
}

// ===== Modal Functions =====
function openExerciseModal(exerciseOrId) {
  let exercise
  if (typeof exerciseOrId === "string") {
    exercise = exercises.find((ex) => ex.id === exerciseOrId)
  } else {
    exercise = exerciseOrId
  }

  if (!exercise || !exerciseModal) return

  currentExercise = exercise

  // Update modal content
  if (modalExerciseName) modalExerciseName.textContent = exercise.name
  if (modalExerciseGif) {
    modalExerciseGif.src = exercise.gifUrl || "/placeholder.svg?height=300&width=400"
    modalExerciseGif.alt = exercise.name
  }
  if (modalTarget) modalTarget.textContent = exercise.target
  if (modalEquipment) modalEquipment.textContent = exercise.equipment
  if (modalBodyPart) modalBodyPart.textContent = exercise.bodyPart

  // Update instructions
  if (modalInstructions && exercise.instructions) {
    modalInstructions.innerHTML = ""
    exercise.instructions.forEach((instruction) => {
      const li = document.createElement("li")
      li.textContent = instruction
      modalInstructions.appendChild(li)
    })
  }

  updateModalFavoriteButton()
  exerciseModal.classList.add("active")
  document.body.style.overflow = "hidden"
}

function closeExerciseModal() {
  if (exerciseModal) {
    exerciseModal.classList.remove("active")
    document.body.style.overflow = ""
    currentExercise = null
  }
}

function updateModalFavoriteButton() {
  if (!addToFavorites || !currentExercise) return

  const isFavorite = favorites.includes(currentExercise.id)
  const icon = addToFavorites.querySelector("i")
  const text = addToFavorites.querySelector("span")

  if (icon) {
    icon.textContent = isFavorite ? "favorite" : "favorite_border"
  }
  if (text) {
    text.textContent = isFavorite ? "Remove from Favorites" : "Add to Favorites"
  }
}

function toggleFavoriteInModal() {
  if (currentExercise) {
    toggleFavorite(currentExercise.id)
    updateModalFavoriteButton()
  }
}

function toggleFavorite(exerciseId) {
  const index = favorites.indexOf(exerciseId)
  if (index > -1) {
    favorites.splice(index, 1)
    showToast("Removed from favorites", "info")
  } else {
    favorites.push(exerciseId)
    showToast("Added to favorites", "success")
  }

  localStorage.setItem("favorites", JSON.stringify(favorites))

  // Update UI
  const favoriteBtn = document.querySelector(`[onclick*="${exerciseId}"]`)
  if (favoriteBtn) {
    const isFavorite = favorites.includes(exerciseId)
    favoriteBtn.classList.toggle("active", isFavorite)
    const icon = favoriteBtn.querySelector("i")
    if (icon) {
      icon.textContent = isFavorite ? "favorite" : "favorite_border"
    }
  }

  // Re-render exercises to update all favorite buttons
  renderExercises()
}

// ===== Load More Functions =====
function loadMoreExercises() {
  if (isLoading) return
  currentPage++
  fetchExercises(false)
}

function updateLoadMoreButton() {
  if (!loadMoreBtn) return

  // Show load more if we have loaded exercises and there might be more
  const hasMore = exercises.length >= currentPage * exercisesPerPage && exercises.length < totalExercises
  loadMoreBtn.style.display = hasMore ? "block" : "none"

  if (isLoading) {
    loadMoreBtn.disabled = true
    loadMoreBtn.innerHTML = '<span>Loading...</span><i class="material-icons">hourglass_empty</i>'
  } else {
    loadMoreBtn.disabled = false
    loadMoreBtn.innerHTML = '<span>Load More</span><i class="material-icons">expand_more</i>'
  }
}

// ===== State Management Functions =====
function showLoading(show) {
  if (loadingIndicator) {
    loadingIndicator.style.display = show ? "flex" : "none"
  }
  if (exerciseGrid && show) {
    exerciseGrid.style.display = "none"
  } else if (exerciseGrid && !show) {
    exerciseGrid.style.display = "grid"
  }
  updateLoadMoreButton()
}

function showEmptyState() {
  if (emptyState) {
    emptyState.classList.remove("hidden")
  }
  if (exerciseGrid) {
    exerciseGrid.style.display = "none"
  }
}

function hideEmptyState() {
  if (emptyState) {
    emptyState.classList.add("hidden")
  }
  if (exerciseGrid) {
    exerciseGrid.style.display = "grid"
  }
}

// ===== Toast Functions =====
function showToast(message, type = "info") {
  // Create toast if it doesn't exist
  let toast = document.getElementById("toast")
  if (!toast) {
    toast = document.createElement("div")
    toast.id = "toast"
    toast.className = "toast hidden"
    toast.innerHTML = `
      <i id="toast-icon" class="material-icons">info</i>
      <span id="toast-message">${message}</span>
      <button id="toast-close" class="toast-close">
        <i class="material-icons">close</i>
      </button>
    `
    document.body.appendChild(toast)

    // Add close functionality
    const closeBtn = toast.querySelector("#toast-close")
    if (closeBtn) {
      closeBtn.addEventListener("click", hideToast)
    }
  }

  const icon = toast.querySelector("#toast-icon")
  const messageEl = toast.querySelector("#toast-message")

  // Update content
  if (messageEl) messageEl.textContent = message

  // Update icon based on type
  if (icon) {
    switch (type) {
      case "success":
        icon.textContent = "check_circle"
        break
      case "error":
        icon.textContent = "error"
        break
      case "warning":
        icon.textContent = "warning"
        break
      default:
        icon.textContent = "info"
    }
  }

  // Update classes
  toast.className = `toast ${type}`

  // Show toast
  setTimeout(() => {
    toast.classList.remove("hidden")
  }, 100)

  // Auto hide after 3 seconds
  setTimeout(() => {
    hideToast()
  }, 3000)
}

function hideToast() {
  const toast = document.getElementById("toast")
  if (toast) {
    toast.classList.add("hidden")
  }
}

// ===== Utility Functions =====
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// ===== Error Handling =====
window.addEventListener("error", (event) => {
  console.error("JavaScript error:", event.error)
  showToast("An unexpected error occurred", "error")
})

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason)
  showToast("An unexpected error occurred", "error")
})

// Add CSS for typing indicator
const typingCSS = `
.typing-dots {
  display: flex;
  gap: 4px;
  padding: 8px 0;
}

.typing-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary);
  animation: typing 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(1) { animation-delay: -0.32s; }
.typing-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
`

// Inject typing CSS
const style = document.createElement("style")
style.textContent = typingCSS
document.head.appendChild(style)
