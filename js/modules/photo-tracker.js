// photo-tracker.js - Enhanced functionality with Theme Toggle and Firebase Integration

// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js"
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-analytics.js"
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js"
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js"

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAHEvRJuOyZ8SagrmioDFmrWH8rAqCu5Vk",
  authDomain: "fit-x-journey.firebaseapp.com",
  projectId: "fit-x-journey",
  storageBucket: "fit-x-journey.appspot.com",
  messagingSenderId: "583991205621",
  appId: "1:583991205621:web:6db1600a16b23590c3efbc",
  measurementId: "G-XT12JJNNC3",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const analytics = getAnalytics(app)
const auth = getAuth(app)
const db = getFirestore(app)

// Global variables
let currentUser = null
let userPhotos = []
let userWeights = []
let userMeasurements = []

// =====================================================================
// THEME TOGGLE FUNCTIONALITY
// =====================================================================
class ThemeToggle {
  constructor() {
    this.themeToggleBtn = document.getElementById("theme-toggle-btn")
    this.body = document.body
    this.themeIcon = this.themeToggleBtn?.querySelector("i")
    this.storageKey = "fitjourney-theme"
    this.init()
  }

  init() {
    this.loadTheme()
    this.addEventListeners()

    // Add transition class after initial load
    setTimeout(() => {
      this.body.classList.add("theme-transition")
    }, 100)
  }

  addEventListeners() {
    if (this.themeToggleBtn) {
      this.themeToggleBtn.addEventListener("click", () => {
        this.toggleTheme()
      })
    }

    // Listen for system theme changes
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      mediaQuery.addEventListener("change", (e) => {
        if (!localStorage.getItem(this.storageKey)) {
          this.setTheme(e.matches ? "dark" : "light")
        }
      })
    }

    // Keyboard shortcut (Ctrl/Cmd + Shift + T)
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "T") {
        e.preventDefault()
        this.toggleTheme()
      }
    })
  }

  loadTheme() {
    const savedTheme = localStorage.getItem(this.storageKey)

    if (savedTheme) {
      this.setTheme(savedTheme)
    } else {
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      this.setTheme(prefersDark ? "dark" : "light")
    }
  }

  setTheme(theme) {
    this.body.classList.remove("light-mode", "dark-mode")

    if (theme === "light") {
      this.body.classList.add("light-mode")
      this.updateIcon("light_mode")
      this.updateAriaLabel("Switch to dark mode")
    } else {
      this.body.classList.add("dark-mode")
      this.updateIcon("dark_mode")
      this.updateAriaLabel("Switch to light mode")
    }

    this.body.setAttribute("data-theme", theme)
    localStorage.setItem(this.storageKey, theme)
    this.updateMetaThemeColor(theme)
    this.updateChartsForTheme()
  }

  toggleTheme() {
    const currentTheme = this.body.classList.contains("light-mode") ? "light" : "dark"
    const newTheme = currentTheme === "light" ? "dark" : "light"

    this.themeToggleBtn?.classList.add("theme-toggle-animate")
    this.setTheme(newTheme)

    setTimeout(() => {
      this.themeToggleBtn?.classList.remove("theme-toggle-animate")
    }, 300)

    this.showThemeChangeToast(newTheme)
  }

  updateIcon(iconName) {
    if (this.themeIcon) {
      this.themeIcon.textContent = iconName
    }
  }

  updateAriaLabel(label) {
    if (this.themeToggleBtn) {
      this.themeToggleBtn.setAttribute("aria-label", label)
    }
  }

  updateMetaThemeColor(theme) {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]')

    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta")
      metaThemeColor.name = "theme-color"
      document.head.appendChild(metaThemeColor)
    }

    const color = theme === "light" ? "#f8fafc" : "#1c1c1c"
    metaThemeColor.content = color
  }

  updateChartsForTheme() {
    const isDark = !this.body.classList.contains("light-mode")
    const chartColors = {
      background: isDark ? "#1e1e1e" : "#ffffff",
      text: isDark ? "#e0e0e0" : "#1a202c",
      grid: isDark ? "#3d3d3d" : "#e2e8f0",
    }

    // Update existing charts if they exist
    const chartElement = document.getElementById("progressChart")
    if (chartElement && window.Plotly && chartElement.data) {
      const update = {
        paper_bgcolor: chartColors.background,
        plot_bgcolor: chartColors.background,
        "font.color": chartColors.text,
        "xaxis.gridcolor": chartColors.grid,
        "yaxis.gridcolor": chartColors.grid,
        "xaxis.color": chartColors.text,
        "yaxis.color": chartColors.text,
      }

      window.Plotly.relayout(chartElement, update)
    }
  }

  showThemeChangeToast(theme) {
    const message = `Switched to ${theme} mode`
    const icon = theme === "light" ? "light_mode" : "dark_mode"
    showToast(message, "info", icon)
  }

  getCurrentTheme() {
    return this.body.classList.contains("light-mode") ? "light" : "dark"
  }

  isLightMode() {
    return this.body.classList.contains("light-mode")
  }
}

// Initialize theme toggle
let themeToggle

// =====================================================================
// AUTHENTICATION & USER MANAGEMENT
// =====================================================================
function initializeAuth() {
  onAuthStateChanged(auth, async (user) => {
    currentUser = user

    if (user) {
      console.log("User is signed in:", user)
      await updateUserProfile(user)
      await loadUserData()
    } else {
      console.log("User is signed out")
      updateUserProfile(null)
      clearUserData()
    }

    updateDashboardStats()
  })
}

async function updateUserProfile(user) {
  const userNameEl = document.querySelector(".user-name")
  const userInitialsEl = document.getElementById("user-initials")
  const userAvatarEl = document.getElementById("user-avatar")

  if (user) {
    // Get user data from Firestore
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid))
      const userData = userDoc.exists() ? userDoc.data() : {}

      const displayName = userData.fullName || user.displayName || user.email.split("@")[0]
      const initials = getInitials(displayName)

      if (userNameEl) userNameEl.textContent = displayName
      if (userInitialsEl) userInitialsEl.textContent = initials

      // Hide avatar image and show initials
      if (userAvatarEl) userAvatarEl.style.display = "none"
      if (userInitialsEl) userInitialsEl.style.display = "flex"
    } catch (error) {
      console.error("Error fetching user data:", error)
      // Fallback to basic user info
      const displayName = user.displayName || user.email.split("@")[0]
      const initials = getInitials(displayName)

      if (userNameEl) userNameEl.textContent = displayName
      if (userInitialsEl) userInitialsEl.textContent = initials
    }
  } else {
    // User not logged in - show guest
    if (userNameEl) userNameEl.textContent = "Guest"
    if (userInitialsEl) userInitialsEl.textContent = "G"
    if (userAvatarEl) userAvatarEl.style.display = "none"
    if (userInitialsEl) userInitialsEl.style.display = "flex"
  }

  // Always re-attach dropdown event listeners after updating profile
  const userProfile = document.querySelector('.user-profile');
  if (userProfile) {
    // Remove previous listeners by cloning
    const newProfile = userProfile.cloneNode(true);
    userProfile.parentNode.replaceChild(newProfile, userProfile);
    newProfile.addEventListener('click', function(e) {
      e.stopPropagation();
      newProfile.classList.toggle('active');
    });
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.user-profile')) {
        newProfile.classList.remove('active');
      }
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') newProfile.classList.remove('active');
    });
    newProfile.querySelectorAll('.user-dropdown-menu a').forEach(link => {
      link.addEventListener('click', () => newProfile.classList.remove('active'));
    });
  }
}

function getInitials(name) {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("")
}

// Add logout functionality
function setupLogout() {
  const logoutLinks = document.querySelectorAll('a[href="logout.html"]')
  logoutLinks.forEach((link) => {
    link.addEventListener("click", async (e) => {
      e.preventDefault()

      try {
        await signOut(auth)
        showToast("Logged out successfully", "success")

        // Redirect to login page after a short delay
        setTimeout(() => {
          window.location.href = "index.html"
        }, 1500)
      } catch (error) {
        console.error("Error signing out:", error)
        showToast("Error signing out", "error")
      }
    })
  })
}

// =====================================================================
// FIREBASE DATA MANAGEMENT
// =====================================================================
async function loadUserData() {
  if (!currentUser) return

  try {
    // Load photos
    const photosQuery = query(collection(db, "photos"), where("userId", "==", currentUser.uid), orderBy("date", "desc"))
    const photosSnapshot = await getDocs(photosQuery)
    userPhotos = photosSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

    // Load weights
    const weightsQuery = query(
      collection(db, "weights"),
      where("userId", "==", currentUser.uid),
      orderBy("date", "desc"),
    )
    const weightsSnapshot = await getDocs(weightsQuery)
    userWeights = weightsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

    // Load measurements
    const measurementsQuery = query(
      collection(db, "measurements"),
      where("userId", "==", currentUser.uid),
      orderBy("date", "desc"),
    )
    const measurementsSnapshot = await getDocs(measurementsQuery)
    userMeasurements = measurementsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

    // Update UI
    updatePhotoTimeline()
    updateBeforeAfterOptions()
    updateWeightHistory()
  } catch (error) {
    console.error("Error loading user data:", error)
    showToast("Error loading your data", "error")
  }
}

function clearUserData() {
  userPhotos = []
  userWeights = []
  userMeasurements = []

  // Update UI
  updatePhotoTimeline()
  updateBeforeAfterOptions()
  updateWeightHistory()
}

async function savePhotoToFirebase(photo) {
  if (!currentUser) {
    showToast("Please log in to save photos", "warning")
    return
  }

  try {
    const photoData = {
      ...photo,
      userId: currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const docRef = await addDoc(collection(db, "photos"), photoData)
    photo.id = docRef.id
    userPhotos.unshift(photo)

    showToast("Photo saved to cloud!", "success")
  } catch (error) {
    console.error("Error saving photo:", error)
    showToast("Error saving photo to cloud", "error")
  }
}

async function saveWeightToFirebase(weight) {
  if (!currentUser) {
    showToast("Please log in to save weight data", "warning")
    return
  }

  try {
    const weightData = {
      ...weight,
      userId: currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const docRef = await addDoc(collection(db, "weights"), weightData)
    weight.id = docRef.id
    userWeights.unshift(weight)

    showToast("Weight saved to cloud!", "success")
  } catch (error) {
    console.error("Error saving weight:", error)
    showToast("Error saving weight to cloud", "error")
  }
}

async function saveMeasurementToFirebase(measurement) {
  if (!currentUser) {
    showToast("Please log in to save measurements", "warning")
    return
  }

  try {
    const measurementData = {
      ...measurement,
      userId: currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const docRef = await addDoc(collection(db, "measurements"), measurementData)
    measurement.id = docRef.id
    userMeasurements.unshift(measurement)

    showToast("Measurements saved to cloud!", "success")
  } catch (error) {
    console.error("Error saving measurements:", error)
    showToast("Error saving measurements to cloud", "error")
  }
}

// =====================================================================
// MAIN INITIALIZATION
// =====================================================================
// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", () => {
  // Initialize theme toggle first
  themeToggle = new ThemeToggle()

  // Initialize Firebase auth
  initializeAuth()

  // Initialize all components
  initializeUI()
  initializePhotoUpload()
  initializePhotoTimeline()
  initializeBeforeAfterComparison()
  initializeWeightLogging()
  initializeMeasurements()
  initializeProgressGraphs()
  initializeAIFeedback()
  initializeChatBot()

  // Setup logout functionality
  setupLogout()

  // Update dashboard stats
  updateDashboardStats()
})

// =====================================================================
// UI INITIALIZATION
// =====================================================================
function initializeUI() {
  // Quick action buttons
  document.getElementById("upload-photo-btn")?.addEventListener("click", () => {
    document.getElementById("upload-photo").scrollIntoView({ behavior: "smooth" })
  })

  document.getElementById("compare-photos-btn")?.addEventListener("click", () => {
    document.getElementById("before-after").scrollIntoView({ behavior: "smooth" })
  })

  document.getElementById("log-weight-btn")?.addEventListener("click", () => {
    document.getElementById("weight-tracking").scrollIntoView({ behavior: "smooth" })
  })

  document.getElementById("view-charts-btn")?.addEventListener("click", () => {
    document.getElementById("progress-graphs").scrollIntoView({ behavior: "smooth" })
  })

  // Mobile menu toggle
  const mobileMenuToggle = document.querySelector(".mobile-menu-toggle")
  const nav = document.querySelector(".tracker-nav")

  if (mobileMenuToggle && nav) {
    mobileMenuToggle.addEventListener("click", function () {
      nav.classList.toggle("active")
      this.querySelector("i").textContent = nav.classList.contains("active") ? "close" : "menu"
    })
  }

  // Upload first photo button
  const uploadFirstPhotoBtn = document.getElementById("upload-first-photo")
  if (uploadFirstPhotoBtn) {
    uploadFirstPhotoBtn.addEventListener("click", () => {
      document.getElementById("upload-photo").scrollIntoView({ behavior: "smooth" })
    })
  }

  // Chart tabs
  const chartTabs = document.querySelectorAll(".chart-tab")
  chartTabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      chartTabs.forEach((t) => t.classList.remove("active"))
      this.classList.add("active")

      const chartType = this.getAttribute("data-chart")
      updateChart(chartType)
    })
  })

  // Set today's date as default for date inputs
  const today = new Date().toISOString().split("T")[0]
  const dateInputs = document.querySelectorAll('input[type="date"]')
  dateInputs.forEach((input) => {
    input.value = today
  })

  // User profile dropdown
  const userProfile = document.querySelector(".user-profile")
  if (userProfile) {
    userProfile.addEventListener("click", (e) => {
      e.stopPropagation()
      userProfile.classList.toggle("active")
    })

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".user-profile")) {
        userProfile.classList.remove("active")
      }
    })

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") userProfile.classList.remove("active")
    })

    userProfile.querySelectorAll(".user-dropdown-menu a").forEach((link) => {
      link.addEventListener("click", () => userProfile.classList.remove("active"))
    })
  }
}

// Update dashboard stats
function updateDashboardStats() {
  const photos = getPhotos()
  const weightLogs = getWeightLogs()
  const measurements = getMeasurements()

  // Update total photos
  const totalPhotosEl = document.getElementById("total-photos")
  if (totalPhotosEl) {
    totalPhotosEl.textContent = photos.length
  }

  // Update tracking since
  const trackingSinceEl = document.getElementById("tracking-since")
  if (trackingSinceEl && photos.length > 0) {
    const sortedPhotos = [...photos].sort((a, b) => new Date(a.date) - new Date(b.date))
    const firstPhotoDate = new Date(sortedPhotos[0].date)
    trackingSinceEl.textContent = firstPhotoDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Update latest weight
  const latestWeightEl = document.getElementById("latest-weight")
  if (latestWeightEl && weightLogs.length > 0) {
    const sortedLogs = [...weightLogs].sort((a, b) => new Date(b.date) - new Date(a.date))
    latestWeightEl.textContent = `${sortedLogs[0].weight} ${sortedLogs[0].unit}`
  }

  // Calculate progress score
  const progressScoreEl = document.getElementById("progress-score")
  if (progressScoreEl) {
    if (photos.length > 0 && weightLogs.length > 0) {
      const photoScore = Math.min(photos.length * 5, 50)
      const weightScore = Math.min(weightLogs.length * 2, 30)

      let consistencyScore = 0
      if (weightLogs.length > 3) {
        consistencyScore = 20
      }

      const totalScore = photoScore + weightScore + consistencyScore
      progressScoreEl.textContent = `${totalScore}/100`
    } else {
      progressScoreEl.textContent = "N/A"
    }
  }
}

// =====================================================================
// UTILITY FUNCTIONS
// =====================================================================
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function getBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve(reader.result)
    }
    reader.onerror = (error) => reject(error)
    reader.readAsDataURL(file)
  })
}

// Enhanced toast notification with theme support
function showToast(message, type = "info", icon = null) {
  let toastContainer = document.querySelector(".toast-container")
  if (!toastContainer) {
    toastContainer = document.createElement("div")
    toastContainer.className = "toast-container"
    document.body.appendChild(toastContainer)
  }

  const toast = document.createElement("div")
  toast.className = `toast theme-toast toast-${type}`

  // Set icon based on type or custom icon
  let toastIcon = icon || "info"
  if (!icon) {
    if (type === "success") toastIcon = "check_circle"
    if (type === "error") toastIcon = "error"
    if (type === "warning") toastIcon = "warning"
  }

  toast.innerHTML = `
    <i class="material-icons">${toastIcon}</i>
    <div class="toast-content">
      <span>${message}</span>
    </div>
    <button class="toast-close" aria-label="Close notification">
      <i class="material-icons">close</i>
    </button>
  `

  toastContainer.appendChild(toast)

  // Show toast
  setTimeout(() => toast.classList.add("show"), 100)

  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove("show")
    setTimeout(() => toast.remove(), 300)
  }, 3000)

  // Close button functionality
  const closeBtn = toast.querySelector(".toast-close")
  closeBtn.addEventListener("click", () => {
    toast.classList.remove("show")
    setTimeout(() => toast.remove(), 300)
  })
}

// =====================================================================
// DATA ACCESS FUNCTIONS (Updated for Firebase)
// =====================================================================
function getPhotos() {
  return currentUser ? userPhotos : JSON.parse(localStorage.getItem("progressPhotos")) || []
}

function getWeightLogs() {
  return currentUser ? userWeights : JSON.parse(localStorage.getItem("weightLogs")) || []
}

function getMeasurements() {
  return currentUser ? userMeasurements : JSON.parse(localStorage.getItem("bodyMeasurements")) || []
}

function savePhoto(photo) {
  if (currentUser) {
    savePhotoToFirebase(photo)
  } else {
    const photos = JSON.parse(localStorage.getItem("progressPhotos")) || []
    photos.push(photo)
    localStorage.setItem("progressPhotos", JSON.stringify(photos))
  }
}

function saveWeightLog(log) {
  if (currentUser) {
    saveWeightToFirebase(log)
  } else {
    const weightLogs = JSON.parse(localStorage.getItem("weightLogs")) || []
    weightLogs.push(log)
    localStorage.setItem("weightLogs", JSON.stringify(weightLogs))
  }
}

function saveMeasurement(measurements) {
  if (currentUser) {
    saveMeasurementToFirebase(measurements)
  } else {
    const allMeasurements = JSON.parse(localStorage.getItem("bodyMeasurements")) || []
    allMeasurements.push(measurements)
    localStorage.setItem("bodyMeasurements", JSON.stringify(allMeasurements))
  }
}

// =====================================================================
// PHOTO UPLOAD & GALLERY
// =====================================================================
function initializePhotoUpload() {
  const uploadForm = document.getElementById("upload-form")
  const photoUpload = document.getElementById("photo-upload")
  const photoPreview = document.getElementById("photo-preview")
  const cancelUpload = document.getElementById("cancel-upload")

  if (!uploadForm) return

  // Show preview when a file is selected
  photoUpload?.addEventListener("change", (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        photoPreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`
      }
      reader.readAsDataURL(file)
    }
  })

  // Cancel upload
  cancelUpload?.addEventListener("click", () => {
    uploadForm.reset()
    photoPreview.innerHTML = `
      <div class="placeholder">
        <i class="material-icons">add_photo_alternate</i>
        <p>Preview will appear here</p>
      </div>
    `
  })

  // Handle form submission
  uploadForm.addEventListener("submit", async (event) => {
    event.preventDefault()

    const fileInput = document.getElementById("photo-upload")
    const captionInput = document.getElementById("photo-caption")
    const dateInput = document.getElementById("photo-date")
    const categoryInput = document.getElementById("photo-category")
    const weightInput = document.getElementById("current-weight")
    const weightUnitInput = document.getElementById("weight-unit")

    // Validation
    if (fileInput.files.length === 0) {
      showToast("Please select a photo to upload", "error")
      return
    }

    if (!captionInput.value.trim()) {
      showToast("Please add notes about your photo", "error")
      return
    }

    if (!dateInput.value) {
      showToast("Please select a date", "error")
      return
    }

    try {
      const file = fileInput.files[0]
      const fullData = await getBase64(file)

      const photo = {
        id: generateId(),
        fullData: fullData,
        caption: captionInput.value.trim(),
        date: new Date(dateInput.value).toISOString(),
        displayDate: formatDate(new Date(dateInput.value)),
        category: categoryInput.value,
      }

      // Save photo
      savePhoto(photo)

      // If weight is provided, log it too
      if (weightInput.value) {
        const weightLog = {
          id: generateId(),
          weight: Number.parseFloat(weightInput.value),
          unit: weightUnitInput.value,
          date: new Date(dateInput.value).toISOString(),
          displayDate: formatDate(new Date(dateInput.value)),
          notes: `Logged with photo upload: ${captionInput.value.trim()}`,
        }

        saveWeightLog(weightLog)
        updateWeightHistory()
      }

      // Update UI
      updatePhotoTimeline()
      updateBeforeAfterOptions()
      updateDashboardStats()

      // Clear form
      uploadForm.reset()
      photoPreview.innerHTML = `
        <div class="placeholder">
          <i class="material-icons">add_photo_alternate</i>
          <p>Preview will appear here</p>
        </div>
      `

      showToast("Photo uploaded successfully!", "success")
    } catch (error) {
      console.error("Error uploading photo:", error)
      showToast("Failed to upload photo. Please try again.", "error")
    }
  })
}

// =====================================================================
// PHOTO TIMELINE
// =====================================================================
function initializePhotoTimeline() {
  updatePhotoTimeline()

  // Set up search functionality
  const searchInput = document.getElementById("search-photos")
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      updatePhotoTimeline(this.value)
    })
  }

  // Set up category filter
  const categorySelect = document.getElementById("category-select")
  if (categorySelect) {
    categorySelect.addEventListener("change", () => {
      updatePhotoTimeline(searchInput ? searchInput.value : "")
    })
  }

  // Set up sort options
  const sortSelect = document.getElementById("sort-select")
  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      updatePhotoTimeline(searchInput ? searchInput.value : "")
    })
  }
}

function updatePhotoTimeline(searchTerm = "") {
  const gallery = document.getElementById("photo-gallery")
  const emptyState = document.getElementById("empty-gallery")
  const photos = getPhotos()

  if (!gallery) return

  // Get filter values
  const categoryFilter = document.getElementById("category-select")?.value || "all"
  const sortOrder = document.getElementById("sort-select")?.value || "newest"

  // Clear existing photos
  gallery.innerHTML = ""

  if (photos.length === 0) {
    gallery.appendChild(emptyState)
    return
  }

  // Filter photos
  let filteredPhotos = [...photos]

  // Apply category filter
  if (categoryFilter !== "all") {
    filteredPhotos = filteredPhotos.filter((photo) => photo.category === categoryFilter)
  }

  // Apply search filter
  if (searchTerm) {
    const term = searchTerm.toLowerCase()
    filteredPhotos = filteredPhotos.filter(
      (photo) => photo.caption.toLowerCase().includes(term) || photo.displayDate.toLowerCase().includes(term),
    )
  }

  // Sort photos
  filteredPhotos.sort((a, b) => {
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB
  })

  // Show message if no photos match filters
  if (filteredPhotos.length === 0) {
    const noResults = document.createElement("div")
    noResults.className = "no-results"
    noResults.innerHTML = `
      <i class="material-icons">search_off</i>
      <h3>No photos match your filters</h3>
      <p>Try adjusting your search or filter criteria.</p>
    `
    gallery.appendChild(noResults)
    return
  }

  // Add photo cards
  filteredPhotos.forEach((photo) => {
    const photoCard = createPhotoCard(photo)
    gallery.appendChild(photoCard)
  })
}

function createPhotoCard(photo) {
  const photoCard = document.createElement("div")
  photoCard.className = "photo-card"
  photoCard.dataset.id = photo.id

  // Create category badge
  let categoryLabel = "Custom"
  if (photo.category === "front") categoryLabel = "Front View"
  if (photo.category === "side") categoryLabel = "Side View"
  if (photo.category === "back") categoryLabel = "Back View"

  photoCard.innerHTML = `
    <img src="${photo.fullData}" alt="Progress photo from ${photo.displayDate}" />
    <div class="photo-info">
      <div class="photo-date">${photo.displayDate}</div>
      <span class="photo-category">${categoryLabel}</span>
      <h3>Progress Update</h3>
      <p>${photo.caption}</p>
      <div class="photo-actions">
        <button class="btn btn-secondary btn-icon delete-photo" data-id="${photo.id}" title="Delete Photo">
          <i class="material-icons">delete</i>
        </button>
        <button class="btn btn-secondary btn-icon set-as-before" data-id="${photo.id}" title="Set as Before">
          <i class="material-icons">first_page</i>
        </button>
        <button class="btn btn-secondary btn-icon set-as-after" data-id="${photo.id}" title="Set as After">
          <i class="material-icons">last_page</i>
        </button>
        <button class="btn btn-primary btn-view-details" data-id="${photo.id}">
          <i class="material-icons">visibility</i> View
        </button>
      </div>
    </div>
  `

  // Add event listeners
  photoCard.querySelector(".delete-photo")?.addEventListener("click", function (e) {
    e.stopPropagation()
    const photoId = this.dataset.id
    deletePhoto(photoId)
  })

  photoCard.querySelector(".set-as-before")?.addEventListener("click", function (e) {
    e.stopPropagation()
    const photoId = this.dataset.id
    const beforeSelect = document.getElementById("before-select")
    if (beforeSelect) {
      beforeSelect.value = photoId
      beforeSelect.dispatchEvent(new Event("change"))
      document.getElementById("before-after")?.scrollIntoView({ behavior: "smooth" })
    }
  })

  photoCard.querySelector(".set-as-after")?.addEventListener("click", function (e) {
    e.stopPropagation()
    const photoId = this.dataset.id
    const afterSelect = document.getElementById("after-select")
    if (afterSelect) {
      afterSelect.value = photoId
      afterSelect.dispatchEvent(new Event("change"))
      document.getElementById("before-after")?.scrollIntoView({ behavior: "smooth" })
    }
  })

  photoCard.querySelector(".btn-view-details")?.addEventListener("click", function (e) {
    e.stopPropagation()
    const photoId = this.dataset.id
    viewPhotoDetails(photoId)
  })

  return photoCard
}

function deletePhoto(photoId) {
  if (confirm("Are you sure you want to delete this photo? This action cannot be undone.")) {
    if (currentUser) {
      // Remove from local array
      userPhotos = userPhotos.filter((photo) => photo.id !== photoId)
      // TODO: Delete from Firebase (implement deleteDoc)
    } else {
      let photos = getPhotos()
      photos = photos.filter((photo) => photo.id !== photoId)
      localStorage.setItem("progressPhotos", JSON.stringify(photos))
    }

    updatePhotoTimeline()
    updateBeforeAfterOptions()
    updateDashboardStats()

    showToast("Photo deleted successfully", "success")
  }
}

function viewPhotoDetails(photoId) {
  const photos = getPhotos()
  const photo = photos.find((p) => p.id === photoId)

  if (!photo) {
    showToast("Photo not found", "error")
    return
  }

  // Create modal for photo details
  const modal = document.createElement("div")
  modal.className = "modal active"

  // Find weight entry from the same date if exists
  const weightLogs = getWeightLogs()
  const matchingWeight = weightLogs.find((log) => {
    const logDate = new Date(log.date).toDateString()
    const photoDate = new Date(photo.date).toDateString()
    return logDate === photoDate
  })

  // Find measurements from the same date if exists
  const measurements = getMeasurements()
  const matchingMeasurements = measurements.find((m) => {
    const mDate = new Date(m.date).toDateString()
    const photoDate = new Date(photo.date).toDateString()
    return mDate === photoDate
  })

  // Create category badge
  let categoryLabel = "Custom"
  if (photo.category === "front") categoryLabel = "Front View"
  if (photo.category === "side") categoryLabel = "Side View"
  if (photo.category === "back") categoryLabel = "Back View"

  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Photo Details</h2>
        <button class="close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="photo-detail-grid">
          <div class="photo-detail-image">
            <img src="${photo.fullData}" alt="Progress photo" class="detail-image">
          </div>
          <div class="photo-detail-info">
            <div class="detail-date">${photo.displayDate}</div>
            <div class="detail-category">${categoryLabel}</div>
            
            <h3>Notes</h3>
            <p class="detail-notes">${photo.caption}</p>
            
            ${
              matchingWeight
                ? `
              <h3>Weight</h3>
              <p class="detail-weight">${matchingWeight.weight} ${matchingWeight.unit}</p>
            `
                : ""
            }
            
            ${
              matchingMeasurements
                ? `
              <h3>Measurements</h3>
              <div class="measurements-grid">
                ${matchingMeasurements.chest ? `<div class="measurement-item"><span>Chest:</span> ${matchingMeasurements.chest} cm</div>` : ""}
                ${matchingMeasurements.waist ? `<div class="measurement-item"><span>Waist:</span> ${matchingMeasurements.waist} cm</div>` : ""}
                ${matchingMeasurements.hips ? `<div class="measurement-item"><span>Hips:</span> ${matchingMeasurements.hips} cm</div>` : ""}
                ${matchingMeasurements.bicep ? `<div class="measurement-item"><span>Bicep:</span> ${matchingMeasurements.bicep} cm</div>` : ""}
                ${matchingMeasurements.thigh ? `<div class="measurement-item"><span>Thigh:</span> ${matchingMeasurements.thigh} cm</div>` : ""}
                ${matchingMeasurements.calf ? `<div class="measurement-item"><span>Calf:</span> ${matchingMeasurements.calf} cm</div>` : ""}
              </div>
            `
                : ""
            }
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary modal-close">Close</button>
        <button class="btn btn-primary run-ai-analysis" data-id="${photo.id}">
          <i class="material-icons">auto_awesome</i> Run AI Analysis
        </button>
      </div>
    </div>
  `

  document.body.appendChild(modal)

  // Handle close button
  modal.querySelector(".close")?.addEventListener("click", () => {
    modal.remove()
  })

  // Handle modal close button
  modal.querySelector(".modal-close")?.addEventListener("click", () => {
    modal.remove()
  })

  // Handle AI analysis button
  modal.querySelector(".run-ai-analysis")?.addEventListener("click", () => {
    modal.remove()
    runAIAnalysis(photo)
    document.getElementById("ai-feedback")?.scrollIntoView({ behavior: "smooth" })
  })

  // Close when clicking outside
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove()
    }
  })
}

// =====================================================================
// BEFORE & AFTER COMPARISON
// =====================================================================
function initializeBeforeAfterComparison() {
  updateBeforeAfterOptions()

  const beforeSelect = document.getElementById("before-select")
  const afterSelect = document.getElementById("after-select")
  const beforeImage = document.getElementById("before-image-display")
  const afterImage = document.getElementById("after-image-display")
  const comparisonRange = document.getElementById("comparisonRange")
  const comparisonSlider = document.getElementById("comparison-slider")

  if (!beforeSelect || !afterSelect) return

  // Update images when selections change
  beforeSelect.addEventListener("change", updateComparisonImages)
  afterSelect.addEventListener("change", updateComparisonImages)

  // Handle comparison slider
  comparisonRange?.addEventListener("input", function () {
    const value = this.value
    if (afterImage) afterImage.style.clipPath = `inset(0 ${100 - value}% 0 0)`
    if (comparisonSlider) comparisonSlider.style.left = `${value}%`
  })

  // Make slider draggable
  let isDragging = false

  comparisonSlider?.addEventListener("mousedown", (e) => {
    isDragging = true
    e.preventDefault()
  })

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return

    const container = document.querySelector(".comparison-wrapper")
    if (!container) return

    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left
    const containerWidth = rect.width

    let percent = (x / containerWidth) * 100
    percent = Math.max(0, Math.min(100, percent))

    if (comparisonSlider) comparisonSlider.style.left = `${percent}%`
    if (afterImage) afterImage.style.clipPath = `inset(0 ${100 - percent}% 0 0)`
    if (comparisonRange) comparisonRange.value = percent
  })

  document.addEventListener("mouseup", () => {
    isDragging = false
  })

  // Touch events for mobile
  comparisonSlider?.addEventListener("touchstart", (e) => {
    isDragging = true
    e.preventDefault()
  })

  document.addEventListener("touchmove", (e) => {
    if (!isDragging) return

    const container = document.querySelector(".comparison-wrapper")
    if (!container) return

    const rect = container.getBoundingClientRect()
    const touch = e.touches[0]
    const x = touch.clientX - rect.left
    const containerWidth = rect.width

    let percent = (x / containerWidth) * 100
    percent = Math.max(0, Math.min(100, percent))

    if (comparisonSlider) comparisonSlider.style.left = `${percent}%`
    if (afterImage) afterImage.style.clipPath = `inset(0 ${100 - percent}% 0 0)`
    if (comparisonRange) comparisonRange.value = percent
  })

  document.addEventListener("touchend", () => {
    isDragging = false
  })

  // Set initial clip on page load
  if (afterImage) afterImage.style.clipPath = `inset(0 50% 0 0)`
  if (comparisonSlider) comparisonSlider.style.left = "50%"
}

function updateBeforeAfterOptions() {
  const beforeSelect = document.getElementById("before-select")
  const afterSelect = document.getElementById("after-select")

  if (!beforeSelect || !afterSelect) return

  const photos = getPhotos()

  // Clear existing options except the first placeholder
  while (beforeSelect.options.length > 1) {
    beforeSelect.remove(1)
  }

  while (afterSelect.options.length > 1) {
    afterSelect.remove(1)
  }

  // Sort photos by date (oldest first)
  const sortedPhotos = [...photos]
  sortedPhotos.sort((a, b) => new Date(a.date) - new Date(b.date))

  // Populate selects
  sortedPhotos.forEach((photo) => {
    const beforeOption = document.createElement("option")
    beforeOption.value = photo.id
    beforeOption.textContent = photo.displayDate
    beforeSelect.appendChild(beforeOption)

    const afterOption = document.createElement("option")
    afterOption.value = photo.id
    afterOption.textContent = photo.displayDate
    afterSelect.appendChild(afterOption)
  })

  // Set default selections if at least 2 photos
  if (sortedPhotos.length >= 2) {
    beforeSelect.value = sortedPhotos[0].id // Oldest photo
    afterSelect.value = sortedPhotos[sortedPhotos.length - 1].id // Newest photo

    // Trigger update of images
    updateComparisonImages()
  }
}

function updateComparisonImages() {
  const beforeSelect = document.getElementById("before-select")
  const afterSelect = document.getElementById("after-select")
  const beforeImage = document.getElementById("before-image-display")
  const afterImage = document.getElementById("after-image-display")

  if (!beforeSelect || !afterSelect || !beforeImage || !afterImage) return

  const beforeId = beforeSelect.value
  const afterId = afterSelect.value

  if (!beforeId || !afterId) return

  const photos = getPhotos()
  const beforePhoto = photos.find((p) => p.id === beforeId)
  const afterPhoto = photos.find((p) => p.id === afterId)

  if (beforePhoto) {
    beforeImage.src = beforePhoto.fullData
  }

  if (afterPhoto) {
    afterImage.src = afterPhoto.fullData
  }
}

// =====================================================================
// WEIGHT LOGGING
// =====================================================================
function initializeWeightLogging() {
  const weightForm = document.getElementById("weight-form")
  if (!weightForm) return

  weightForm.addEventListener("submit", (e) => {
    e.preventDefault()

    const weightInput = document.getElementById("weight-input")
    const weightUnit = document.getElementById("weight-unit-log")
    const weightDate = document.getElementById("weight-date")
    const weightNotes = document.getElementById("weight-notes")

    if (!weightInput || !weightUnit || !weightDate) return

    const weight = Number.parseFloat(weightInput.value)

    if (isNaN(weight) || weight <= 0) {
      showToast("Please enter a valid weight", "error")
      return
    }

    if (!weightDate.value) {
      showToast("Please select a date", "error")
      return
    }

    // Create weight log entry
    const weightLog = {
      id: generateId(),
      weight: weight,
      unit: weightUnit.value,
      date: new Date(weightDate.value).toISOString(),
      displayDate: formatDate(new Date(weightDate.value)),
      notes: weightNotes?.value || "",
    }

    // Save to storage
    saveWeightLog(weightLog)

    // Update weight history table
    updateWeightHistory()

    // Update dashboard stats
    updateDashboardStats()

    // Clear inputs
    weightInput.value = ""
    if (weightNotes) weightNotes.value = ""
    weightDate.value = new Date().toISOString().split("T")[0]

    showToast("Weight logged successfully!", "success")
  })

  // Initial load of weight history
  updateWeightHistory()
}

function updateWeightHistory() {
  const tableBody = document.getElementById("weight-history-body")
  if (!tableBody) return

  const weightLogs = getWeightLogs()

  // Clear existing entries
  tableBody.innerHTML = ""

  if (weightLogs.length === 0) {
    const emptyRow = document.createElement("tr")
    emptyRow.innerHTML = '<td colspan="3" style="text-align: center;">No weight logs yet</td>'
    tableBody.appendChild(emptyRow)
    return
  }

  // Sort by date (newest first)
  weightLogs.sort((a, b) => new Date(b.date) - new Date(a.date))

  // Add entries
  weightLogs.forEach((log, index) => {
    const row = document.createElement("tr")

    // Calculate weight change if not first entry
    let changeText = "Initial"
    let changeClass = ""

    if (index < weightLogs.length - 1) {
      const currentWeight = log.weight
      const previousWeight = weightLogs[index + 1].weight
      const change = currentWeight - previousWeight

      if (change > 0) {
        changeText = `+${change.toFixed(1)} ${log.unit}`
        changeClass = "text-error"
      } else if (change < 0) {
        changeText = `${change.toFixed(1)} ${log.unit}`
        changeClass = "text-success"
      } else {
        changeText = "No change"
      }
    }

    row.innerHTML = `
      <td>${log.displayDate || formatDate(log.date)}</td>
      <td>${log.weight} ${log.unit}</td>
      <td class="${changeClass}">${changeText}</td>
    `

    tableBody.appendChild(row)
  })

  // Update weight graph if visible
  if (document.querySelector('.chart-tab[data-chart="weight"].active')) {
    displayWeightGraph()
  }
}

// =====================================================================
// BODY MEASUREMENTS
// =====================================================================
function initializeMeasurements() {
  const saveButton = document.getElementById("save-measurements")
  if (!saveButton) return

  saveButton.addEventListener("click", () => {
    // Get values from form
    const chest = Number.parseFloat(document.getElementById("chest")?.value) || null
    const waist = Number.parseFloat(document.getElementById("waist")?.value) || null
    const hips = Number.parseFloat(document.getElementById("hips")?.value) || null
    const bicep = Number.parseFloat(document.getElementById("bicep")?.value) || null
    const thigh = Number.parseFloat(document.getElementById("thigh")?.value) || null
    const calf = Number.parseFloat(document.getElementById("calf")?.value) || null

    // Validate that at least one measurement is filled
    if (chest === null && waist === null && hips === null && bicep === null && thigh === null && calf === null) {
      showToast("Please enter at least one measurement", "error")
      return
    }

    // Create measurements object
    const measurements = {
      id: generateId(),
      date: new Date().toISOString(),
      displayDate: formatDate(new Date()),
      chest,
      waist,
      hips,
      bicep,
      thigh,
      calf,
    }

    // Save to storage
    saveMeasurement(measurements)

    // Clear form
    const inputs = ["chest", "waist", "hips", "bicep", "thigh", "calf"]
    inputs.forEach((id) => {
      const input = document.getElementById(id)
      if (input) input.value = ""
    })

    // Update measurement graph if visible
    if (document.querySelector('.chart-tab[data-chart="measurements"].active')) {
      displayMeasurementGraph()
    }

    showToast("Measurements saved successfully!", "success")
  })
}

// =====================================================================
// PROGRESS GRAPHS
// =====================================================================
function initializeProgressGraphs() {
  const weightGraphBtn = document.getElementById("load-weight-graph")
  const measurementGraphBtn = document.getElementById("load-measurement-graph")
  const exportDataBtn = document.getElementById("export-data")

  weightGraphBtn?.addEventListener("click", displayWeightGraph)
  measurementGraphBtn?.addEventListener("click", displayMeasurementGraph)
  exportDataBtn?.addEventListener("click", exportProgressData)

  // Load weight graph by default if data exists
  const weightLogs = getWeightLogs()
  if (weightLogs.length > 0) {
    displayWeightGraph()
  }
}

function updateChart(chartType) {
  if (chartType === "weight") {
    displayWeightGraph()
  } else if (chartType === "measurements") {
    displayMeasurementGraph()
  } else if (chartType === "combined") {
    displayCombinedGraph()
  }
}

function displayWeightGraph() {
  const weightLogs = getWeightLogs()

  if (weightLogs.length === 0) {
    showToast("No weight data available yet", "warning")
    return
  }

  // Sort by date (oldest first for chart)
  weightLogs.sort((a, b) => new Date(a.date) - new Date(b.date))

  // Extract dates and weights
  const dates = weightLogs.map((log) => log.displayDate || formatDate(log.date))
  const weights = weightLogs.map((log) => log.weight)
  const unit = weightLogs[0].unit

  // Get theme colors
  const isDark = !themeToggle?.isLightMode()
  const chartColors = {
    background: isDark ? "#1e1e1e" : "#ffffff",
    text: isDark ? "#e0e0e0" : "#1a202c",
    grid: isDark ? "#3d3d3d" : "#e2e8f0",
  }

  // Create graph using Plotly
  const data = [
    {
      x: dates,
      y: weights,
      type: "scatter",
      mode: "lines+markers",
      line: {
        color: "#6A1B9A",
        width: 3,
      },
      marker: {
        color: "#FF6F00",
        size: 8,
      },
    },
  ]

  const layout = {
    title: "Weight Progress",
    xaxis: {
      title: "Date",
      tickfont: { color: chartColors.text },
      gridcolor: chartColors.grid,
      zerolinecolor: chartColors.grid,
    },
    yaxis: {
      title: `Weight (${unit})`,
      tickfont: { color: chartColors.text },
      gridcolor: chartColors.grid,
      zerolinecolor: chartColors.grid,
    },
    paper_bgcolor: chartColors.background,
    plot_bgcolor: chartColors.background,
    font: {
      color: chartColors.text,
    },
    margin: { t: 50, l: 60, r: 30, b: 50 },
    hoverlabel: {
      bgcolor: "#6A1B9A",
    },
  }

  const config = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ["select2d", "lasso2d"],
  }

  if (window.Plotly) {
    window.Plotly.newPlot("progressChart", data, layout, config)
  }
}

function displayMeasurementGraph() {
  const measurements = getMeasurements()

  if (measurements.length === 0) {
    showToast("No measurement data available yet", "warning")
    return
  }

  // Sort by date (oldest first for chart)
  measurements.sort((a, b) => new Date(a.date) - new Date(b.date))

  // Extract dates
  const dates = measurements.map((m) => m.displayDate || formatDate(m.date))

  // Get theme colors
  const isDark = !themeToggle?.isLightMode()
  const chartColors = {
    background: isDark ? "#1e1e1e" : "#ffffff",
    text: isDark ? "#e0e0e0" : "#1a202c",
    grid: isDark ? "#3d3d3d" : "#e2e8f0",
  }

  // Create data series for each measurement type
  const data = []

  const measurementTypes = ["chest", "waist", "hips", "bicep", "thigh", "calf"]
  const colors = ["#6A1B9A", "#FF6F00", "#3498DB", "#2ECC71", "#E74C3C", "#F1C40F"]

  measurementTypes.forEach((type, index) => {
    // Check if we have any data for this measurement type
    const hasData = measurements.some((m) => m[type] !== null)

    if (hasData) {
      const values = measurements.map((m) => m[type])

      data.push({
        x: dates,
        y: values,
        type: "scatter",
        mode: "lines+markers",
        name: type.charAt(0).toUpperCase() + type.slice(1),
        line: {
          color: colors[index],
          width: 2,
        },
        marker: {
          color: colors[index],
          size: 6,
        },
      })
    }
  })

  const layout = {
    title: "Body Measurements Progress",
    xaxis: {
      title: "Date",
      tickfont: { color: chartColors.text },
      gridcolor: chartColors.grid,
      zerolinecolor: chartColors.grid,
    },
    yaxis: {
      title: "Measurement (cm)",
      tickfont: { color: chartColors.text },
      gridcolor: chartColors.grid,
      zerolinecolor: chartColors.grid,
    },
    paper_bgcolor: chartColors.background,
    plot_bgcolor: chartColors.background,
    font: {
      color: chartColors.text,
    },
    margin: { t: 50, l: 60, r: 30, b: 50 },
    legend: {
      orientation: "h",
      xanchor: "center",
      y: -0.2,
      x: 0.5,
    },
    hoverlabel: {
      bgcolor: "#6A1B9A",
    },
  }

  const config = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ["select2d", "lasso2d"],
  }

  if (window.Plotly) {
    window.Plotly.newPlot("progressChart", data, layout, config)
  }
}

function displayCombinedGraph() {
  const weightLogs = getWeightLogs()
  const measurements = getMeasurements()

  if (weightLogs.length === 0 && measurements.length === 0) {
    showToast("No data available yet", "warning")
    return
  }

  // Get theme colors
  const isDark = !themeToggle?.isLightMode()
  const chartColors = {
    background: isDark ? "#1e1e1e" : "#ffffff",
    text: isDark ? "#e0e0e0" : "#1a202c",
    grid: isDark ? "#3d3d3d" : "#e2e8f0",
  }

  // Create combined dataset
  const data = []

  // Add weight data if available
  if (weightLogs.length > 0) {
    // Sort by date (oldest first)
    weightLogs.sort((a, b) => new Date(a.date) - new Date(b.date))

    // Extract dates and weights
    const dates = weightLogs.map((log) => log.displayDate || formatDate(log.date))
    const weights = weightLogs.map((log) => log.weight)
    const unit = weightLogs[0].unit

    data.push({
      x: dates,
      y: weights,
      type: "scatter",
      mode: "lines+markers",
      name: `Weight (${unit})`,
      line: {
        color: "#6A1B9A",
        width: 3,
      },
      marker: {
        color: "#6A1B9A",
        size: 8,
      },
      yaxis: "y",
    })
  }

  // Add waist measurement if available (as example of key measurement)
  if (measurements.length > 0) {
    // Check if we have waist measurements
    const hasWaistData = measurements.some((m) => m.waist !== null)

    if (hasWaistData) {
      // Sort by date (oldest first)
      measurements.sort((a, b) => new Date(a.date) - new Date(b.date))

      // Extract dates and waist measurements
      const dates = measurements.map((m) => m.displayDate || formatDate(m.date))
      const waistValues = measurements.map((m) => m.waist)

      data.push({
        x: dates,
        y: waistValues,
        type: "scatter",
        mode: "lines+markers",
        name: "Waist (cm)",
        line: {
          color: "#FF6F00",
          width: 2,
        },
        marker: {
          color: "#FF6F00",
          size: 6,
        },
        yaxis: "y2",
      })
    }
  }

  const layout = {
    title: "Combined Progress View",
    xaxis: {
      title: "Date",
      tickfont: { color: chartColors.text },
      gridcolor: chartColors.grid,
      zerolinecolor: chartColors.grid,
    },
    yaxis: {
      title: "Weight",
      tickfont: { color: chartColors.text },
      gridcolor: chartColors.grid,
      zerolinecolor: chartColors.grid,
      side: "left",
    },
    yaxis2: {
      title: "Measurements (cm)",
      tickfont: { color: chartColors.text },
      gridcolor: chartColors.grid,
      zerolinecolor: chartColors.grid,
      overlaying: "y",
      side: "right",
    },
    paper_bgcolor: chartColors.background,
    plot_bgcolor: chartColors.background,
    font: {
      color: chartColors.text,
    },
    margin: { t: 50, l: 60, r: 60, b: 50 },
    legend: {
      orientation: "h",
      xanchor: "center",
      y: -0.2,
      x: 0.5,
    },
    hoverlabel: {
      bgcolor: "#6A1B9A",
    },
  }

  const config = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ["select2d", "lasso2d"],
  }

  if (window.Plotly) {
    window.Plotly.newPlot("progressChart", data, layout, config)
  }
}

function exportProgressData() {
  // Gather all data
  const photos = getPhotos().map((photo) => ({
    id: photo.id,
    date: photo.date,
    displayDate: photo.displayDate,
    category: photo.category,
    caption: photo.caption,
    // Exclude the actual image data to keep file size reasonable
  }))

  const weightLogs = getWeightLogs()
  const measurements = getMeasurements()

  // Create export object
  const exportData = {
    exportDate: new Date().toISOString(),
    user: currentUser
      ? {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
        }
      : null,
    photos,
    weightLogs,
    measurements,
  }

  // Convert to JSON
  const jsonData = JSON.stringify(exportData, null, 2)

  // Create download link
  const blob = new Blob([jsonData], { type: "application/json" })
  const url = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = `fitjourney-progress-export-${new Date().toISOString().split("T")[0]}.json`
  document.body.appendChild(a)
  a.click()

  // Clean up
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 100)

  showToast("Progress data exported successfully!", "success")
}

// =====================================================================
// AI FEEDBACK
// =====================================================================
function initializeAIFeedback() {
  const runAiButton = document.querySelector(".btn-run-ai")
  if (!runAiButton) return

  runAiButton.addEventListener("click", () => {
    const photos = getPhotos()

    if (photos.length === 0) {
      showToast("Please upload a photo first", "warning")
      return
    }

    // Get the most recent photo
    const sortedPhotos = [...photos].sort((a, b) => new Date(b.date) - new Date(a.date))
    const latestPhoto = sortedPhotos[0]

    runAIAnalysis(latestPhoto)
  })
}

// Simulate AI analysis with advanced feedback
function runAIAnalysis(photo) {
  const feedbackPlaceholder = document.querySelector(".ai-feedback-placeholder")
  const aiResults = document.getElementById("ai-results")

  if (!feedbackPlaceholder || !aiResults) return

  // Show loading state
  feedbackPlaceholder.innerHTML = `
    <div class="loading-animation">
      <i class="material-icons rotating">autorenew</i>
      <p>Analyzing your photo...</p>
    </div>
  `
  feedbackPlaceholder.style.display = "block"
  aiResults.style.display = "none"

  // Simulate AI processing time
  setTimeout(() => {
    // Generate simulated AI feedback
    const feedback = generateAIFeedback(photo)

    // Display results
    aiResults.innerHTML = feedback
    feedbackPlaceholder.style.display = "none"
    aiResults.style.display = "block"

    showToast("AI analysis completed!", "success")
  }, 2500)
}

// Generate simulated AI feedback
function generateAIFeedback(photo) {
  // This is a simulation - in a real app, this would call an AI API
  const possibleObservations = [
    "Good posture evident in this photo.",
    "Visible progress in muscle definition compared to previous uploads.",
    "Consider improving stance for better stability.",
    "Lighting conditions are optimal for progress tracking.",
    "Body symmetry appears balanced.",
    "Clothing choice allows for good visibility of progress.",
    "Possible signs of improved shoulder/hip ratio.",
    "Core engagement is visible.",
    "Good progress visible in targeted areas.",
    "Consistent posing helps with accurate progress tracking.",
  ]

  const possibleRecommendations = [
    "Continue your current training regimen for consistent results.",
    "Consider increasing protein intake for muscle development.",
    "Focus on hydration for better recovery between workouts.",
    "Try incorporating more compound movements for balanced development.",
    "Add more rest days to your schedule for optimal recovery.",
    "Consider progressive overload to continue seeing results.",
    "Maintain consistent photo angles for better comparison.",
    "Try alternating between strength and cardiovascular training.",
    "Consider tracking measurements alongside photos for comprehensive progress monitoring.",
    "Continue with current nutritional approach as progress is visible.",
  ]

  // Select random observations and recommendations for simulation
  const numObservations = 3 + Math.floor(Math.random() * 3) // 3-5 observations
  const numRecommendations = 2 + Math.floor(Math.random() * 2) // 2-3 recommendations

  const selectedObservations = []
  const selectedRecommendations = []

  for (let i = 0; i < numObservations; i++) {
    const index = Math.floor(Math.random() * possibleObservations.length)
    selectedObservations.push(possibleObservations[index])
    possibleObservations.splice(index, 1) // Remove to avoid duplicates
  }

  for (let i = 0; i < numRecommendations; i++) {
    const index = Math.floor(Math.random() * possibleRecommendations.length)
    selectedRecommendations.push(possibleRecommendations[index])
    possibleRecommendations.splice(index, 1) // Remove to avoid duplicates
  }

  // Generate body composition prediction (simulated)
  const bodyFat = (20 + Math.random() * 10).toFixed(1)
  const muscleMass = (60 + Math.random() * 20).toFixed(1)

  // Build HTML output
  let html = `
    <div class="ai-analysis-results">
      <div class="ai-header">
        <div class="ai-avatar">
          <i class="material-icons">psychology</i>
        </div>
        <div class="ai-title">
          <h3>AI Analysis Results</h3>
          <p>Analysis date: ${formatDate(new Date())}</p>
        </div>
      </div>
      
      <div class="ai-content">
        <div class="ai-section">
          <h4><i class="material-icons">visibility</i> Observations:</h4>
          <ul class="ai-list">
  `

  // Add observations
  selectedObservations.forEach((observation) => {
    html += `<li>${observation}</li>`
  })

  html += `
          </ul>
        </div>
        
        <div class="ai-section">
          <h4><i class="material-icons">monitor_weight</i> Body Composition (Estimated):</h4>
          <div class="ai-metrics">
            <div class="ai-metric">
              <div class="metric-value">${bodyFat}%</div>
              <div class="metric-label">Body Fat</div>
            </div>
            <div class="ai-metric">
              <div class="metric-value">${muscleMass}%</div>
              <div class="metric-label">Muscle Mass</div>
            </div>
          </div>
        </div>
        
        <div class="ai-section">
          <h4><i class="material-icons">lightbulb</i> Recommendations:</h4>
          <ul class="ai-list">
  `

  // Add recommendations
  selectedRecommendations.forEach((recommendation) => {
    html += `<li>${recommendation}</li>`
  })

  html += `
          </ul>
        </div>
        
        <div class="ai-disclaimer">
          <p><i class="material-icons">info</i> This is an AI-powered estimation. For professional advice, consult with a certified fitness or healthcare professional.</p>
        </div>
      </div>
    </div>
  `

  return html
}

// =====================================================================
// CHATBOT
// =====================================================================
function initializeChatBot() {
  const chatToggle = document.getElementById("chat-toggle")
  const chatbot = document.getElementById("ai-chatbot")
  const closeChat = document.getElementById("close-chat")
  const sendChat = document.getElementById("send-chat")
  const chatInput = document.getElementById("chat-input")
  const chatBody = document.getElementById("chat-body")

  if (!chatToggle || !chatbot) return

  // Toggle chatbot visibility
  chatToggle.addEventListener("click", () => {
    chatbot.classList.toggle("hidden")
    if (!chatbot.classList.contains("hidden")) {
      chatInput?.focus()
    }
  })

  // Close chatbot
  closeChat?.addEventListener("click", () => {
    chatbot.classList.add("hidden")
  })

  // Send message
  sendChat?.addEventListener("click", sendMessage)

  // Send message on Enter key
  chatInput?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage()
    }
  })

  function sendMessage() {
    if (!chatInput || !chatBody) return

    const message = chatInput.value.trim()

    if (!message) return

    // Add user message to chat
    addMessage(message, true)

    // Clear input
    chatInput.value = ""

    // Process message and respond
    processMessage(message)
  }

  function addMessage(message, isUser = false) {
    if (!chatBody) return

    const messageElement = document.createElement("div")
    messageElement.className = `chat-message ${isUser ? "user" : "bot"}`
    messageElement.textContent = message

    chatBody.appendChild(messageElement)

    // Scroll to bottom
    chatBody.scrollTop = chatBody.scrollHeight
  }

  function processMessage(message) {
    if (!chatBody) return

    // Simple keyword-based responses
    message = message.toLowerCase()

    // Add typing indicator
    const typingIndicator = document.createElement("div")
    typingIndicator.className = "chat-message bot typing"
    typingIndicator.innerHTML = '<span class="typing-dots"><span>.</span><span>.</span><span>.</span></span>'
    chatBody.appendChild(typingIndicator)

    // Scroll to bottom
    chatBody.scrollTop = chatBody.scrollHeight

    // Simulate AI thinking time
    setTimeout(() => {
      // Remove typing indicator
      chatBody.removeChild(typingIndicator)

      let response = ""

      if (message.includes("hello") || message.includes("hi") || message.includes("hey")) {
        response = "Hello! How can I assist with your fitness progress tracking today?"
      } else if (message.includes("help") || message.includes("how") || message.includes("work")) {
        response =
          "I can help you track your fitness progress! You can upload photos, log your weight, track measurements, and compare your progress over time. What would you like to know more about?"
      } else if (message.includes("photo") || message.includes("picture") || message.includes("image")) {
        response =
          "To upload a progress photo, go to the 'Upload Your Progress Photo' section. You can view all your photos in the 'Transformation Timeline' and compare before/after in the comparison tool."
      } else if (message.includes("weight") || message.includes("weigh")) {
        response =
          "You can log your weight in the 'Weight Tracker' section. Your weight history will be displayed in a table and you can visualize your progress in graphs."
      } else if (message.includes("measure") || message.includes("size")) {
        response =
          "Track your body measurements in the 'Body Measurements' section. Log measurements like chest, waist, hips, and more to get a comprehensive view of your body changes."
      } else if (message.includes("graph") || message.includes("chart") || message.includes("visual")) {
        response =
          "Your progress graphs are available in the 'Progress Graphs' section. You can view weight trends and measurement changes over time."
      } else if (message.includes("compare") || message.includes("before") || message.includes("after")) {
        response =
          "Use the 'Before & After Comparison' tool to visually compare any two photos from your timeline. The slider helps you see the difference clearly."
      } else if (message.includes("ai") || message.includes("analysis") || message.includes("feedback")) {
        response =
          "Our AI analysis tool examines your photos and provides observations about your progress. Upload a photo and click 'Run AI Analysis' to get personalized insights."
      } else if (message.includes("theme") || message.includes("dark") || message.includes("light")) {
        response =
          "You can switch between dark and light themes using the theme toggle button in the header. Use Ctrl+Shift+T as a keyboard shortcut!"
      } else if (message.includes("account") || message.includes("login") || message.includes("user")) {
        if (currentUser) {
          response = `You're logged in as ${currentUser.displayName || currentUser.email}. Your data is automatically saved to the cloud!`
        } else {
          response =
            "You're currently using the app as a guest. Log in to save your data to the cloud and access it from any device."
        }
      } else if (message.includes("thank")) {
        response = "You're welcome! I'm here to help with any questions about tracking your fitness journey."
      } else {
        response =
          "I'm not sure I understand. Would you like to know more about tracking photos, logging weight, recording measurements, or using the comparison tools?"
      }

      // Add response to chat
      addMessage(response)
    }, 1500)
  }
}

// Export for global access
window.themeToggle = themeToggle
window.photoTracker = {
  getPhotos,
  getWeightLogs,
  getMeasurements,
  deletePhoto,
  viewPhotoDetails,
  runAIAnalysis,
}
