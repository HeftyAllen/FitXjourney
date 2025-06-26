// =============================
// Workout Planner Module
// =============================

// API Credentials and Endpoints
const exerciseDBKey = "02e5919d7cmshe07914db7605532p164aa8jsn0cde2d877db5"
const exerciseDBHost = "exercisedb.p.rapidapi.com"

// DOM Elements
const filterButtons = document.querySelectorAll(".filter-btn")
const equipmentSelect = document.getElementById("equipment")
const generateWorkoutBtn = document.getElementById("generate-workout-btn")
const exerciseGrid = document.getElementById("exercise-grid")
const loadingIndicator = document.getElementById("loading-indicator")
const workoutList = document.getElementById("workout-list")
const generatedWorkout = document.getElementById("generated-workout")
const startWorkoutBtn = document.getElementById("start-workout-btn")
const exerciseSearch = document.getElementById("exercise-search")
const searchBtn = document.getElementById("search-btn")
const prevPageBtn = document.getElementById("prev-page")
const nextPageBtn = document.getElementById("next-page")
const pageIndicator = document.getElementById("page-indicator")
const exerciseModal = document.getElementById("exercise-modal")
const exerciseDetail = document.getElementById("exercise-detail")
const modalClose = document.querySelector(".modal-close")
const clearWorkoutBtn = document.getElementById("clear-workout-btn")
const saveWorkoutBtn = document.getElementById("save-workout-btn")
const printWorkoutBtn = document.getElementById("print-workout-btn")
const exerciseCountElement = document.getElementById("exercise-count")
const totalDurationElement = document.getElementById("total-duration")
const difficultyLevelElement = document.getElementById("difficulty-level")
const themeToggleBtn = document.getElementById("theme-toggle-btn")

// State variables
let currentExercises = []
let selectedExercises = []
let currentPage = 1
let totalPages = 1
const itemsPerPage = 8
let currentFilter = "all"
let currentEquipment = ""
let isLightMode = false

// =============================
// API Functions
// =============================

// Fetch all exercises
async function fetchAllExercises() {
  const url = `https://${exerciseDBHost}/exercises?limit=10`
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": exerciseDBKey,
        "x-rapidapi-host": exerciseDBHost,
      },
    })

    if (!response.ok) {
      console.error("Error fetching exercises:", response.status, response.statusText)
      return []
    }

    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error("Error fetching exercises:", error)
    return []
  }
}

// Fetch exercises by body part
async function fetchExercisesByBodyPart(bodyPart) {
  if (bodyPart === "all") {
    return fetchAllExercises()
  }

  const url = `https://${exerciseDBHost}/exercises/bodyPart/${encodeURIComponent(bodyPart)}`
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": exerciseDBKey,
        "x-rapidapi-host": exerciseDBHost,
      },
    })

    if (!response.ok) {
      console.error("Error fetching exercises by body part:", response.status, response.statusText)
      return []
    }

    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error("Error fetching exercises by body part:", error)
    return []
  }
}

// Fetch exercises by equipment
async function fetchExercisesByEquipment(equipment) {
  const url = `https://${exerciseDBHost}/exercises/equipment/${encodeURIComponent(equipment)}`
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": exerciseDBKey,
        "x-rapidapi-host": exerciseDBHost,
      },
    })

    if (!response.ok) {
      console.error("Error fetching exercises by equipment:", response.status, response.statusText)
      return []
    }

    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error("Error fetching exercises by equipment:", error)
    return []
  }
}

// Fetch exercises by name (search)
async function searchExercises(query) {
  const url = `https://${exerciseDBHost}/exercises/name/${encodeURIComponent(query)}`
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": exerciseDBKey,
        "x-rapidapi-host": exerciseDBHost,
      },
    })

    if (!response.ok) {
      console.error("Error searching exercises:", response.status, response.statusText)
      return []
    }

    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error("Error searching exercises:", error)
    return []
  }
}

// Fetch exercise by ID
async function fetchExerciseById(id) {
  const url = `https://${exerciseDBHost}/exercises/exercise/${id}`
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": exerciseDBKey,
        "x-rapidapi-host": exerciseDBHost,
      },
    })

    if (!response.ok) {
      console.error("Error fetching exercise by ID:", response.status, response.statusText)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching exercise by ID:", error)
    return null
  }
}

// =============================
// UI Functions
// =============================

// Show loading indicator
function showLoading() {
  loadingIndicator.classList.remove("hidden")
  exerciseGrid.innerHTML = ""
}

// Hide loading indicator
function hideLoading() {
  loadingIndicator.classList.add("hidden")
}

// Render exercise cards
function renderExerciseCards(exercises) {
  exerciseGrid.innerHTML = ""

  if (exercises.length === 0) {
    exerciseGrid.innerHTML = `
      <div class="no-results">
        <p>No exercises found. Try a different filter or search term.</p>
      </div>
    `
    return
  }

  // Calculate pagination
  totalPages = Math.ceil(exercises.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, exercises.length)
  const paginatedExercises = exercises.slice(startIndex, endIndex)

  // Update pagination controls
  pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`
  prevPageBtn.disabled = currentPage === 1
  nextPageBtn.disabled = currentPage === totalPages

  // Render exercise cards
  paginatedExercises.forEach((exercise) => {
    const card = document.createElement("div")
    card.className = "exercise-card fadeIn"
    card.dataset.id = exercise.id

    const isSelected = selectedExercises.some((e) => e.id === exercise.id)

    card.innerHTML = `
      <img src="${exercise.gifUrl}" alt="${exercise.name}" class="exercise-image">
      <div class="exercise-info">
        <h3>${exercise.name}</h3>
        <div class="exercise-meta">
          <span>Target: ${exercise.target}</span>
          <span>Equipment: ${exercise.equipment}</span>
        </div>
      </div>
      <div class="exercise-actions">
        <button class="add-btn" title="Add to workout" ${isSelected ? 'style="display:none"' : ""}>
          <i class="material-icons">add</i>
        </button>
        <button class="info-btn" title="View details">
          <i class="material-icons">info</i>
        </button>
        <button class="selected-btn" title="Added to workout" ${isSelected ? "" : 'style="display:none"'}>
          <i class="material-icons">check</i>
        </button>
      </div>
    `

    exerciseGrid.appendChild(card)

    // Add event listeners
    const addBtn = card.querySelector(".add-btn")
    const infoBtn = card.querySelector(".info-btn")
    const selectedBtn = card.querySelector(".selected-btn")

    addBtn.addEventListener("click", () => {
      addExerciseToWorkout(exercise)
      addBtn.style.display = "none"
      selectedBtn.style.display = "flex"
    })

    infoBtn.addEventListener("click", () => {
      showExerciseDetails(exercise)
    })

    selectedBtn.addEventListener("click", () => {
      removeExerciseFromWorkout(exercise.id)
      selectedBtn.style.display = "none"
      addBtn.style.display = "flex"
    })
  })
}

// Render workout list
function renderWorkoutList() {
  workoutList.innerHTML = ""

  if (selectedExercises.length === 0) {
    workoutList.innerHTML = `
      <li class="empty-workout">
        <p>No exercises added to your workout yet. Browse and add exercises from the exercise browser.</p>
      </li>
    `
    return
  }

  selectedExercises.forEach((exercise, index) => {
    const li = document.createElement("li")
    li.className = "workout-item fadeIn"
    li.dataset.id = exercise.id

    li.innerHTML = `
      <div class="workout-item-number">${index + 1}</div>
      <img src="${exercise.gifUrl}" alt="${exercise.name}" class="workout-item-image">
      <div class="workout-item-details">
        <h4>${exercise.name}</h4>
        <div class="workout-item-meta">
          <span><i class="material-icons">fitness_center</i> ${exercise.equipment}</span>
          <span><i class="material-icons">accessibility</i> ${exercise.target}</span>
          <span><i class="material-icons">repeat</i> 3 sets × 12 reps</span>
        </div>
      </div>
      <div class="workout-item-actions">
        <button class="edit-btn" title="Edit sets and reps">
          <i class="material-icons">edit</i>
        </button>
        <button class="remove-btn" title="Remove from workout">
          <i class="material-icons">delete</i>
        </button>
      </div>
    `

    workoutList.appendChild(li)

    // Add event listeners
    const removeBtn = li.querySelector(".remove-btn")
    removeBtn.addEventListener("click", () => {
      removeExerciseFromWorkout(exercise.id)
    })

    const editBtn = li.querySelector(".edit-btn")
    editBtn.addEventListener("click", () => {
      // TODO: Implement edit functionality
      alert("Edit functionality will be implemented in a future update.")
    })
  })

  // Update workout summary
  exerciseCountElement.textContent = selectedExercises.length
  totalDurationElement.textContent = document.getElementById("session-duration").value
  difficultyLevelElement.textContent = document.getElementById("difficulty").value

  // Show generated workout section
  generatedWorkout.classList.remove("hidden")
}

// Show exercise details in modal
function showExerciseDetails(exercise) {
  exerciseDetail.innerHTML = `
    <div class="exercise-detail">
      <div class="exercise-detail-header">
        <h2>${exercise.name}</h2>
        <div class="exercise-detail-tags">
          <span class="exercise-tag"><i class="material-icons">accessibility</i> ${exercise.target}</span>
          <span class="exercise-tag"><i class="material-icons">fitness_center</i> ${exercise.equipment}</span>
          <span class="exercise-tag"><i class="material-icons">category</i> ${exercise.bodyPart}</span>
        </div>
      </div>
      
      <div class="exercise-detail-media">
        <img src="${exercise.gifUrl}" alt="${exercise.name}" />
      </div>
      
      <div class="exercise-detail-info">
        <div class="info-item">
          <span class="info-item-label">Target Muscle</span>
          <span class="info-item-value">${exercise.target}</span>
        </div>
        <div class="info-item">
          <span class="info-item-label">Equipment</span>
          <span class="info-item-value">${exercise.equipment}</span>
        </div>
        <div class="info-item">
          <span class="info-item-label">Body Part</span>
          <span class="info-item-value">${exercise.bodyPart}</span>
        </div>
        <div class="info-item">
          <span class="info-item-label">Secondary Muscles</span>
          <span class="info-item-value">${exercise.secondaryMuscles?.join(", ") || "Not specified"}</span>
        </div>
      </div>
      
      <div class="exercise-detail-instructions">
        <h3>Instructions</h3>
        ${
          exercise.instructions
            ? `<div class="instruction-steps">
            ${exercise.instructions
              .map(
                (instruction, index) => `
              <div class="instruction-step">
                <div class="step-number">${index + 1}</div>
                <div class="step-text">${instruction}</div>
              </div>
            `,
              )
              .join("")}
          </div>`
            : `<p>Follow the demonstration in the GIF above.</p>`
        }
      </div>
      
      <div class="exercise-detail-actions">
        ${
          selectedExercises.some((e) => e.id === exercise.id)
            ? `<button class="btn btn-secondary remove-from-workout-btn">
            <i class="material-icons">remove_circle</i> Remove from Workout
          </button>`
            : `<button class="btn btn-primary add-to-workout-btn">
            <i class="material-icons">add_circle</i> Add to Workout
          </button>`
        }
      </div>
    </div>
  `

  // Add event listeners
  const addToWorkoutBtn = exerciseDetail.querySelector(".add-to-workout-btn")
  if (addToWorkoutBtn) {
    addToWorkoutBtn.addEventListener("click", () => {
      addExerciseToWorkout(exercise)
      exerciseModal.style.display = "none"
    })
  }

  const removeFromWorkoutBtn = exerciseDetail.querySelector(".remove-from-workout-btn")
  if (removeFromWorkoutBtn) {
    removeFromWorkoutBtn.addEventListener("click", () => {
      removeExerciseFromWorkout(exercise.id)
      exerciseModal.style.display = "none"
    })
  }

  exerciseModal.style.display = "block"
}

// =============================
// Event Handlers
// =============================

// Add exercise to workout
function addExerciseToWorkout(exercise) {
  if (!selectedExercises.some((e) => e.id === exercise.id)) {
    selectedExercises.push(exercise)
    renderWorkoutList()

    // Update UI for all instances of this exercise in the grid
    const cards = exerciseGrid.querySelectorAll(`.exercise-card[data-id="${exercise.id}"]`)
    cards.forEach((card) => {
      card.querySelector(".add-btn").style.display = "none"
      card.querySelector(".selected-btn").style.display = "flex"
    })
  }
}

// Remove exercise from workout
function removeExerciseFromWorkout(exerciseId) {
  selectedExercises = selectedExercises.filter((e) => e.id !== exerciseId)
  renderWorkoutList()

  // Update UI for all instances of this exercise in the grid
  const cards = exerciseGrid.querySelectorAll(`.exercise-card[data-id="${exerciseId}"]`)
  cards.forEach((card) => {
    card.querySelector(".add-btn").style.display = "flex"
    card.querySelector(".selected-btn").style.display = "none"
  })
}

// Load exercises based on current filter and equipment
async function loadExercises() {
  showLoading()

  let exercises = []

  if (currentFilter === "all" && !currentEquipment) {
    exercises = await fetchAllExercises()
  } else if (currentEquipment && currentFilter === "all") {
    exercises = await fetchExercisesByEquipment(currentEquipment)
  } else if (currentEquipment && currentFilter !== "all") {
    const bodyPartExercises = await fetchExercisesByBodyPart(currentFilter)
    exercises = bodyPartExercises.filter((e) => e.equipment === currentEquipment)
  } else {
    exercises = await fetchExercisesByBodyPart(currentFilter)
  }

  currentExercises = exercises
  currentPage = 1

  hideLoading()
  renderExerciseCards(exercises)
}

// Generate AI workout
async function generateAIWorkout() {
  showLoading()

  const isCustomWorkout = document.getElementById("custom-workout").checked
  const difficulty = document.getElementById("difficulty").value
  const sessionDuration = Number.parseInt(document.getElementById("session-duration").value)

  // Calculate number of exercises based on session duration
  const exerciseCount = Math.floor(sessionDuration / 10)

  let exercises = []

  if (isCustomWorkout) {
    // For AI workout, fetch exercises from different body parts
    const bodyParts = ["back", "chest", "shoulders", "upper arms", "upper legs", "lower legs", "waist"]

    // Fetch exercises for each body part
    const promises = bodyParts.map((bodyPart) => fetchExercisesByBodyPart(bodyPart))
    const results = await Promise.all(promises)

    // Flatten and shuffle the results
    const allExercises = results.flat()
    const shuffled = allExercises.sort(() => 0.5 - Math.random())

    // Filter by equipment if selected
    let filtered = shuffled
    if (currentEquipment) {
      filtered = shuffled.filter((e) => e.equipment === currentEquipment)
    }

    // Select the required number of exercises
    exercises = filtered.slice(0, exerciseCount)
  } else {
    // For manual workout, use the current filter
    if (currentExercises.length === 0) {
      await loadExercises()
    }

    // Shuffle and select the required number of exercises
    const shuffled = [...currentExercises].sort(() => 0.5 - Math.random())
    exercises = shuffled.slice(0, exerciseCount)
  }

  // Clear previous selection and add new exercises
  selectedExercises = []
  exercises.forEach((exercise) => {
    addExerciseToWorkout(exercise)
  })

  hideLoading()
  renderWorkoutList()
}

// Save workout to localStorage
function saveWorkout() {
  if (selectedExercises.length === 0) {
    alert("Please add exercises to your workout before saving.")
    return
  }

  const workoutName = prompt("Enter a name for your workout:", "My Custom Workout")

  if (!workoutName) return

  const workout = {
    id: Date.now(),
    name: workoutName,
    exercises: selectedExercises,
    duration: document.getElementById("session-duration").value,
    difficulty: document.getElementById("difficulty").value,
    created: new Date().toISOString(),
  }

  // Get existing workouts from localStorage
  const savedWorkouts = JSON.parse(localStorage.getItem("savedWorkouts") || "[]")
  savedWorkouts.push(workout)

  // Save to localStorage
  localStorage.setItem("savedWorkouts", JSON.stringify(savedWorkouts))

  alert(`Workout "${workoutName}" has been saved successfully!`)
}

// Print workout
function printWorkout() {
  if (selectedExercises.length === 0) {
    alert("Please add exercises to your workout before printing.")
    return
  }

  const printWindow = window.open("", "_blank")

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>FitJourney Workout Plan</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        h1 {
          text-align: center;
          color: #8e44ad;
          margin-bottom: 20px;
        }
        .workout-summary {
          display: flex;
          justify-content: space-around;
          margin-bottom: 20px;
          padding: 10px;
          background-color: #f5f5f5;
          border-radius: 5px;
        }
        .summary-item {
          text-align: center;
        }
        .summary-value {
          font-size: 1.2rem;
          font-weight: bold;
        }
        .exercise-list {
          list-style: none;
          padding: 0;
        }
        .exercise-item {
          display: flex;
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid #ddd;
        }
        .exercise-number {
          width: 30px;
          height: 30px;
          background-color: #8e44ad;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 15px;
        }
        .exercise-image {
          width: 100px;
          margin-right: 15px;
        }
        .exercise-details {
          flex: 1;
        }
        .exercise-name {
          font-weight: bold;
          margin-bottom: 5px;
        }
        .exercise-meta {
          color: #666;
          font-size: 0.9rem;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          font-size: 0.8rem;
          color: #666;
        }
        @media print {
          body {
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <h1>FitJourney Workout Plan</h1>
      
      <div class="workout-summary">
        <div class="summary-item">
          <div class="summary-value">${document.getElementById("total-duration").textContent}</div>
          <div>Minutes</div>
        </div>
        <div class="summary-item">
          <div class="summary-value">${document.getElementById("exercise-count").textContent}</div>
          <div>Exercises</div>
        </div>
        <div class="summary-item">
          <div class="summary-value">${document.getElementById("difficulty-level").textContent}</div>
          <div>Difficulty</div>
        </div>
      </div>
      
      <h2>Exercise List</h2>
      <ul class="exercise-list">
        ${selectedExercises
          .map(
            (exercise, index) => `
          <li class="exercise-item">
            <div class="exercise-number">${index + 1}</div>
            <img src="${exercise.gifUrl}" alt="${exercise.name}" class="exercise-image">
            <div class="exercise-details">
              <div class="exercise-name">${exercise.name}</div>
              <div class="exercise-meta">
                <div>Target: ${exercise.target}</div>
                <div>Equipment: ${exercise.equipment}</div>
                <div>Sets: 3 × Reps: 12</div>
              </div>
            </div>
          </li>
        `,
          )
          .join("")}
      </ul>
      
      <div class="footer">
        <p>Generated by FitJourney on ${new Date().toLocaleDateString()}</p>
      </div>
    </body>
    </html>
  `)

  printWindow.document.close()
  printWindow.focus()

  // Print after images have loaded
  setTimeout(() => {
    printWindow.print()
  }, 1000)
}

// Start workout session
function startWorkoutSession() {
  if (selectedExercises.length === 0) {
    alert("Please add exercises to your workout before starting a session.")
    return
  }

  // Save current workout to localStorage for the session page
  const currentWorkout = {
    exercises: selectedExercises,
    duration: document.getElementById("session-duration").value,
    difficulty: document.getElementById("difficulty").value,
    restTime: document.getElementById("rest-timer").value,
    transitionTime: document.getElementById("transition-timer").value,
  }

  localStorage.setItem("currentWorkout", JSON.stringify(currentWorkout))

  // Redirect to workout session page
  window.location.href = "workout-session.html"
}

// =============================
// Event Listeners
// =============================

// Filter buttons
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    // Remove active class from all buttons
    filterButtons.forEach((btn) => btn.classList.remove("active"))

    // Add active class to clicked button
    button.classList.add("active")

    // Update current filter
    currentFilter = button.dataset.filter

    // Load exercises with new filter
    loadExercises()
  })
})

// Equipment select
if (equipmentSelect) {
  equipmentSelect.addEventListener("change", () => {
    currentEquipment = equipmentSelect.value
    loadExercises()
  })
}

// Generate workout button
if (generateWorkoutBtn) {
  generateWorkoutBtn.addEventListener("click", () => {
    generateAIWorkout()
  })
}

// Start workout button
if (startWorkoutBtn) {
  startWorkoutBtn.addEventListener("click", () => {
    startWorkoutSession()
  })
}

// Search button
if (searchBtn) {
  searchBtn.addEventListener("click", async () => {
    const query = exerciseSearch.value.trim()

    if (!query) {
      alert("Please enter a search term.")
      return
    }

    showLoading()

    const results = await searchExercises(query)
    currentExercises = results
    currentPage = 1

    hideLoading()
    renderExerciseCards(results)
  })
}

// Search input (search on Enter key)
if (exerciseSearch) {
  exerciseSearch.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      searchBtn.click()
    }
  })
}

// Pagination buttons
if (prevPageBtn) {
  prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--
      renderExerciseCards(currentExercises)
    }
  })
}

if (nextPageBtn) {
  nextPageBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++
      renderExerciseCards(currentExercises)
    }
  })
}

// Modal close button
if (modalClose) {
  modalClose.addEventListener("click", () => {
    exerciseModal.style.display = "none"
  })
}

// Close modal when clicking outside
window.addEventListener("click", (e) => {
  if (e.target === exerciseModal) {
    exerciseModal.style.display = "none"
  }
})

// Clear workout button
if (clearWorkoutBtn) {
  clearWorkoutBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to clear your workout?")) {
      selectedExercises = []
      renderWorkoutList()

      // Update UI for all exercise cards
      const addBtns = exerciseGrid.querySelectorAll(".add-btn")
      const selectedBtns = exerciseGrid.querySelectorAll(".selected-btn")

      addBtns.forEach((btn) => {
        btn.style.display = "flex"
      })

      selectedBtns.forEach((btn) => {
        btn.style.display = "none"
      })
    }
  })
}

// Save workout button
if (saveWorkoutBtn) {
  saveWorkoutBtn.addEventListener("click", () => {
    saveWorkout()
  })
}

// Print workout button
if (printWorkoutBtn) {
  printWorkoutBtn.addEventListener("click", () => {
    printWorkout()
  })
}

// Theme toggle
if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("light-mode")
    isLightMode = document.body.classList.contains("light-mode")

    const icon = themeToggleBtn.querySelector("i")
    icon.textContent = isLightMode ? "dark_mode" : "light_mode"

    // Save preference to localStorage
    localStorage.setItem("theme", isLightMode ? "light" : "dark")
  })

  // Check for saved theme preference
  const savedTheme = localStorage.getItem("theme")
  if (savedTheme === "light") {
    themeToggleBtn.click()
  }
}

// =============================
// Initialize
// =============================
document.addEventListener("DOMContentLoaded", () => {
  // Load initial exercises
  loadExercises()
})
