// exercise-library.js

// ===== Global Variables =====
window.exerciseLibrary = window.exerciseLibrary || {}
let exercises = window.exerciseLibrary.exercises || []
let filteredExercises = []
let currentPage = 1
const exercisesPerPage = 20
const favorites = JSON.parse(localStorage.getItem("favorites")) || []
const savedWorkouts = JSON.parse(localStorage.getItem("savedWorkouts")) || []
const selectedExercises = []
let currentExercise = null
let totalExercises = 0
let isLoading = false

// API Configuration with your key
const API_CONFIG = {
  baseUrl: "https://exercisedb.p.rapidapi.com",
  headers: {
    "X-RapidAPI-Key": "02e5919d7cmshe07914db7605532p164aa8jsn0cde2d877db5",
    "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
  },
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

// Library Content
const exerciseCount = document.getElementById("exercise-count")
const totalExercisesCount = document.getElementById("total-exercises")
const gridViewBtn = document.getElementById("grid-view")
const listViewBtn = document.getElementById("list-view")
const sortSelect = document.getElementById("sort-select")
const loadingIndicator = document.getElementById("loading-indicator")
const exerciseGrid = document.getElementById("exercise-grid")
const emptyState = document.getElementById("empty-state")
const errorState = document.getElementById("error-state")
const clearSearchFilters = document.getElementById("clear-search-filters")
const loadMoreBtn = document.getElementById("load-more")
const retryLoading = document.getElementById("retry-loading")

// Exercise Modal
const exerciseModal = document.getElementById("exercise-modal")
const modalExerciseName = document.getElementById("modal-exercise-name")
const modalExerciseGif = document.getElementById("modal-exercise-gif")
const modalTarget = document.getElementById("modal-target")
const modalEquipment = document.getElementById("modal-equipment")
const modalBodyPart = document.getElementById("modal-body-part")
const modalDifficulty = document.getElementById("modal-difficulty")
const modalInstructions = document.getElementById("modal-instructions")
const modalSecondaryMuscles = document.getElementById("modal-secondary-muscles")
const closeModal = document.getElementById("close-modal")
const addToFavorites = document.getElementById("add-to-favorites")

// ===== Initialization =====
document.addEventListener("DOMContentLoaded", () => {
  initializeApp()
})

function initializeApp() {
  console.log("Initializing Exercise Library...")

  // Initialize theme
  if (localStorage.getItem("theme") === "light") {
    document.body.classList.remove("dark-theme")
  }

  // Set up event listeners
  setupEventListeners()

  // Fetch exercises immediately with the API key
  fetchExercises()
}

function setupEventListeners() {
  // Theme toggle
  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme)
  }

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

  // Retry loading
  if (retryLoading) {
    retryLoading.addEventListener("click", fetchExercises)
  }

  // Exercise modal
  if (closeModal) {
    closeModal.addEventListener("click", closeExerciseModal)
  }
  if (addToFavorites) {
    addToFavorites.addEventListener("click", toggleFavoriteInModal)
  }

  // Category cards
  const categoryCards = document.querySelectorAll(".category-card")
  categoryCards.forEach((card) => {
    card.addEventListener("click", () => {
      const category = card.dataset.category
      if (category) {
        handleCategoryFilter(category)
      }
    })
  })

  // Close modals when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target === exerciseModal) closeExerciseModal()
  })
}

// ===== Theme Functions =====
function toggleTheme() {
  document.body.classList.toggle("dark-theme")
  localStorage.setItem("theme", document.body.classList.contains("dark-theme") ? "dark" : "light")
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

// ===== API Functions =====
async function fetchExercises(reset = true) {
  if (isLoading) return

  try {
    isLoading = true
    showLoading(true)
    hideErrorState()

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

    console.log("API Response status:", response.status)

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
      difficulty: getDifficultyLevel(exercise.equipment, exercise.bodyPart),
    }))

    if (reset) {
      exercises = processedExercises
      totalExercises = 1300 // ExerciseDB has around 1300+ exercises
    } else {
      exercises = [...exercises, ...processedExercises]
    }

    // Update total count
    if (totalExercisesCount) {
      totalExercisesCount.textContent = `${totalExercises}+`
    }

    filteredExercises = [...exercises]
    applyCurrentFilters()
    updateExerciseCount()
    renderExercises()
    updateLoadMoreButton()

    showToast(`Loaded ${processedExercises.length} exercises`, "success")
  } catch (error) {
    console.error("Error fetching exercises:", error)
    showErrorState(error.message || "Failed to load exercises. Please check your connection.")
    showToast("Failed to load exercises", "error")
  } finally {
    isLoading = false
    showLoading(false)
  }
}

// Helper function to determine difficulty level
function getDifficultyLevel(equipment, bodyPart) {
  if (equipment === "body weight") {
    return "beginner"
  } else if (equipment === "dumbbell" || equipment === "kettlebell") {
    return "intermediate"
  } else if (equipment === "barbell" || equipment === "cable") {
    return "advanced"
  } else {
    return "intermediate"
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
      difficulty: getDifficultyLevel(exercise.equipment, exercise.bodyPart),
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
    showErrorState("Failed to load exercises for this body part.")
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
      searchClear.style.pointerEvents = "none"
    }
  } else {
    if (searchClear) {
      searchClear.style.opacity = "1"
      searchClear.style.pointerEvents = "auto"
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
    searchClear.style.pointerEvents = "none"
  }
  applyCurrentFilters()
}

function toggleFilterPanel() {
  if (filterPanel) {
    filterPanel.classList.toggle("active")
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

  // Get selected difficulty levels
  const selectedDifficulty = Array.from(document.querySelectorAll(".difficulty-options input:checked")).map(
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

    // Filter by difficulty
    if (selectedDifficulty.length > 0) {
      const difficulty = exercise.difficulty || "beginner"
      if (!selectedDifficulty.includes(difficulty)) {
        return false
      }
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

function handleCategoryFilter(category) {
  // Reset all quick filter buttons
  quickFilterBtns.forEach((btn) => btn.classList.remove("active"))

  // Find and activate the corresponding quick filter
  const targetBtn = document.querySelector(`.quick-filter-btn[data-target="${category}"]`)
  if (targetBtn) {
    targetBtn.classList.add("active")
  }

  handleQuickFilter(category, targetBtn || quickFilterBtns[0])
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
        const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 }
        return (difficultyOrder[a.difficulty] || 1) - (difficultyOrder[b.difficulty] || 1)
      case "difficulty-desc":
        const difficultyOrderDesc = { beginner: 1, intermediate: 2, advanced: 3 }
        return (difficultyOrderDesc[b.difficulty] || 1) - (difficultyOrderDesc[a.difficulty] || 1)
      default:
        return 0
    }
  })

  renderExercises()
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
  const difficulty = exercise.difficulty || "beginner"

  // Add entrance animation
  card.style.opacity = "0"
  card.style.transform = "translateY(30px)"

  card.innerHTML = `
    <div class="exercise-image-container">
      <img src="${exercise.gifUrl || "/placeholder.svg?height=220&width=300"}" 
           alt="${exercise.name}" 
           class="exercise-image" 
           loading="lazy"
           onerror="this.src='/placeholder.svg?height=220&width=300'">
      <div class="exercise-difficulty-badge ${difficulty}">
        ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
      </div>
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

function updateTotalExercisesCount() {
  if (totalExercisesCount) {
    totalExercisesCount.textContent = `${totalExercises}+`
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
  if (modalDifficulty) {
    const difficulty = exercise.difficulty || "beginner"
    modalDifficulty.textContent = difficulty
    modalDifficulty.className = `detail-value difficulty-badge ${difficulty}`
  }

  // Update instructions
  if (modalInstructions && exercise.instructions) {
    modalInstructions.innerHTML = ""
    exercise.instructions.forEach((instruction, index) => {
      const li = document.createElement("li")
      li.textContent = instruction
      modalInstructions.appendChild(li)
    })
  }

  // Update secondary muscles
  if (modalSecondaryMuscles && exercise.secondaryMuscles) {
    modalSecondaryMuscles.innerHTML = ""
    if (exercise.secondaryMuscles.length > 0) {
      exercise.secondaryMuscles.forEach((muscle) => {
        const tag = document.createElement("span")
        tag.className = "muscle-tag"
        tag.textContent = muscle
        modalSecondaryMuscles.appendChild(tag)
      })
    }
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

function showErrorState(message) {
  if (errorState) {
    errorState.classList.remove("hidden")
    const errorMessage = document.getElementById("error-message")
    if (errorMessage) {
      errorMessage.textContent = message
    }
  }
  if (exerciseGrid) {
    exerciseGrid.style.display = "none"
  }
}

function hideErrorState() {
  if (errorState) {
    errorState.classList.add("hidden")
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
