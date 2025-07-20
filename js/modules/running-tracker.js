// Import Firebase auth and Leaflet
import { auth } from "./user-auth-Jdlamini351.js"
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js"
import L from "https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"

class EnhancedRunningTracker {
  constructor() {
    // Core tracking state
    this.isTracking = false
    this.isPaused = false
    this.startTime = null
    this.pausedTime = 0
    this.currentActivity = "walk"
    this.watchId = null
    this.positions = []
    this.routePolyline = null

    // Stats
    this.totalDistance = 0
    this.currentSpeed = 0
    this.maxSpeed = 0
    this.steps = 0
    this.calories = 0
    this.elevationGain = 0
    this.currentElevation = 0
    this.previousElevation = null
    this.lastKmTime = 0
    this.kmSplits = []

    // Goals
    this.currentGoalType = "distance"
    this.goals = {
      distance: 5,
      time: 30,
      calories: 300,
    }

    // Voice coaching
    this.voiceEnabled = true
    this.voiceSettings = {
      frequency: 1, // km
      volume: 0.8,
      rate: 1,
      announceDistance: true,
      announceTime: true,
      announcePace: true,
      announceGoalProgress: true,
    }
    this.lastAnnouncement = 0
    this.speechSynthesis = window.speechSynthesis

    // Map and weather
    this.map = null
    this.currentLocationMarker = null
    this.weatherData = null
    this.currentUser = null

    // API Keys
    this.OPENWEATHER_API_KEY = "f21d67a9e459162a06695902e69f9f90d"

    // Activity configurations
    this.activityConfig = {
      walk: {
        icon: "🚶‍♂️",
        name: "Walking",
        caloriesPerKm: 50,
        stepLength: 0.7,
        color: "#10b981",
      },
      jog: {
        icon: "🏃‍♂️",
        name: "Jogging",
        caloriesPerKm: 80,
        stepLength: 0.8,
        color: "#f59e0b",
      },
      run: {
        icon: "🏃‍♂️",
        name: "Running",
        caloriesPerKm: 120,
        stepLength: 0.9,
        color: "#ef4444",
      },
      cycle: {
        icon: "🚴‍♂️",
        name: "Cycling",
        caloriesPerKm: 40,
        stepLength: 0,
        color: "#8b5cf6",
      },
    }

    this.init()
  }

  async init() {
    this.showLoading("Initializing FitXjourney...")

    // Initialize Firebase auth listener
    this.initAuthListener()

    // Initialize UI elements
    this.initializeElements()
    this.bindEvents()

    // Initialize map
    await this.initializeMap()

    // Request location and weather
    await this.requestLocationAndWeather()

    // Update display
    this.updateDisplay()
    this.updateGoalProgress()

    this.hideLoading()
    this.showToast("🚀 FitXjourney is ready! Set your goal and start tracking.", "success")
  }

  initAuthListener() {
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user
      this.updateUserInterface(user)
    })
  }

  updateUserInterface(user) {
    const userName = document.getElementById("userName")
    const userAvatar = document.getElementById("userAvatar")
    const dropdownGuest = document.getElementById("dropdownGuest")
    const dropdownUser = document.getElementById("dropdownUser")
    const authBanner = document.getElementById("authBanner")
    const guestSavePrompt = document.getElementById("guestSavePrompt")
    const userSaveOptions = document.getElementById("userSaveOptions")
    const saveToCloudBtn = document.getElementById("saveToCloudBtn")

    if (user) {
      // User is logged in
      userName.textContent = user.displayName || user.email.split("@")[0]

      // Show user avatar (first letter of name)
      const initial = (user.displayName || user.email)[0].toUpperCase()
      userAvatar.innerHTML = initial

      // Show/hide appropriate dropdowns
      dropdownGuest.classList.add("hidden")
      dropdownUser.classList.remove("hidden")

      // Update user info in dropdown
      document.getElementById("profileName").textContent = user.displayName || "User"
      document.getElementById("profileEmail").textContent = user.email

      // Hide auth banner
      authBanner.classList.add("hidden")

      // Update modal content for logged-in users
      if (guestSavePrompt) guestSavePrompt.classList.add("hidden")
      if (userSaveOptions) userSaveOptions.classList.remove("hidden")
      if (saveToCloudBtn) saveToCloudBtn.classList.remove("hidden")
    } else {
      // User is guest
      userName.textContent = "Guest"
      userAvatar.innerHTML = '<i class="fas fa-user"></i>'

      // Show/hide appropriate dropdowns
      dropdownGuest.classList.remove("hidden")
      dropdownUser.classList.add("hidden")

      // Show auth banner
      authBanner.classList.remove("hidden")

      // Update modal content for guests
      if (guestSavePrompt) guestSavePrompt.classList.remove("hidden")
      if (userSaveOptions) userSaveOptions.classList.add("hidden")
      if (saveToCloudBtn) saveToCloudBtn.classList.add("hidden")
    }
  }

  initializeElements() {
    // Goal elements
    this.goalTypeBtns = document.querySelectorAll(".goal-type-btn")
    this.goalInputs = {
      distance: document.getElementById("distanceGoal"),
      time: document.getElementById("timeGoal"),
      calories: document.getElementById("caloriesGoal"),
    }
    this.presetBtns = document.querySelectorAll(".preset-btn")

    // Activity buttons
    this.activityCards = document.querySelectorAll(".activity-card")

    // Control buttons
    this.startBtn = document.getElementById("startBtn")
    this.pauseBtn = document.getElementById("pauseBtn")
    this.resumeBtn = document.getElementById("resumeBtn")
    this.stopBtn = document.getElementById("stopBtn")

    // Display elements
    this.distanceEl = document.getElementById("distance")
    this.durationEl = document.getElementById("duration")
    this.paceEl = document.getElementById("pace")
    this.caloriesEl = document.getElementById("calories")
    this.currentSpeedEl = document.getElementById("currentSpeed")
    this.stepsEl = document.getElementById("steps")
    this.elevationEl = document.getElementById("elevation")
    this.heartRateEl = document.getElementById("heartRate")

    // Progress elements
    this.progressValue = document.getElementById("progressValue")
    this.progressLabel = document.getElementById("progressLabel")
    this.currentProgress = document.getElementById("currentProgress")
    this.remainingProgress = document.getElementById("remainingProgress")
    this.progressCircle = document.getElementById("progressCircle")

    // Weather elements
    this.weatherTemp = document.getElementById("weatherTemp")
    this.weatherDesc = document.getElementById("weatherDesc")
    this.weatherIcon = document.getElementById("weatherIcon")

    // Modal elements
    this.workoutModal = document.getElementById("workoutModal")
    this.voiceSettingsModal = document.getElementById("voiceSettingsModal")

    // Voice coach elements
    this.coachToggle = document.getElementById("coachToggle")
    this.coachStatusText = document.getElementById("coachStatusText")

    // Map controls
    this.centerMapBtn = document.getElementById("centerMapBtn")
    this.layerToggleBtn = document.getElementById("layerToggleBtn")
    this.fullscreenBtn = document.getElementById("fullscreenBtn")
  }

  bindEvents() {
    // Goal type selection
    this.goalTypeBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.selectGoalType(e.target.dataset.type)
      })
    })

    // Goal input changes
    Object.keys(this.goalInputs).forEach((type) => {
      if (this.goalInputs[type]) {
        this.goalInputs[type].addEventListener("input", (e) => {
          this.goals[type] = Number.parseFloat(e.target.value)
          this.updateGoalProgress()
        })
      }
    })

    // Preset buttons
    this.presetBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const value = Number.parseFloat(e.target.dataset.value)
        const activeGoalGroup = document.querySelector(".goal-input-group.active")
        if (activeGoalGroup) {
          const input = activeGoalGroup.querySelector("input")
          if (input) {
            input.value = value
            this.goals[this.currentGoalType] = value
            this.updateGoalProgress()
          }
        }
      })
    })

    // Activity selection
    this.activityCards.forEach((card) => {
      card.addEventListener("click", (e) => {
        this.selectActivity(e.currentTarget.dataset.activity)
      })
    })

    // Control buttons
    if (this.startBtn) this.startBtn.addEventListener("click", () => this.startTracking())
    if (this.pauseBtn) this.pauseBtn.addEventListener("click", () => this.pauseTracking())
    if (this.resumeBtn) this.resumeBtn.addEventListener("click", () => this.resumeTracking())
    if (this.stopBtn) this.stopBtn.addEventListener("click", () => this.stopTracking())

    // Voice coach toggle
    if (this.coachToggle) this.coachToggle.addEventListener("click", () => this.toggleVoiceCoach())

    // Map controls
    if (this.centerMapBtn) this.centerMapBtn.addEventListener("click", () => this.centerMap())
    if (this.layerToggleBtn) this.layerToggleBtn.addEventListener("click", () => this.toggleMapLayer())
    if (this.fullscreenBtn) this.fullscreenBtn.addEventListener("click", () => this.toggleFullscreen())

    // Modal controls
    const modalClose = document.getElementById("modalClose")
    const voiceSettingsClose = document.getElementById("voiceSettingsClose")
    const exportBtn = document.getElementById("exportBtn")
    const newWorkoutBtn = document.getElementById("newWorkoutBtn")
    const discardBtn = document.getElementById("discardBtn")

    if (modalClose) modalClose.addEventListener("click", () => this.closeModal())
    if (voiceSettingsClose) voiceSettingsClose.addEventListener("click", () => this.closeVoiceSettings())
    if (exportBtn) exportBtn.addEventListener("click", () => this.exportWorkoutData())
    if (newWorkoutBtn) newWorkoutBtn.addEventListener("click", () => this.startNewWorkout())
    if (discardBtn) discardBtn.addEventListener("click", () => this.discardWorkout())

    // Voice settings
    const testVoiceBtn = document.getElementById("testVoiceBtn")
    const saveVoiceSettingsBtn = document.getElementById("saveVoiceSettingsBtn")

    if (testVoiceBtn) testVoiceBtn.addEventListener("click", () => this.testVoice())
    if (saveVoiceSettingsBtn) saveVoiceSettingsBtn.addEventListener("click", () => this.saveVoiceSettings())

    // Auth banner close
    const bannerClose = document.getElementById("bannerClose")
    if (bannerClose) {
      bannerClose.addEventListener("click", () => {
        const authBanner = document.getElementById("authBanner")
        if (authBanner) authBanner.classList.add("hidden")
      })
    }

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.code === "Space" && !e.target.matches("input, textarea, button")) {
        e.preventDefault()
        this.handleSpacebarPress()
      }
    })
  }

  selectGoalType(type) {
    this.currentGoalType = type

    // Update UI
    this.goalTypeBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.type === type)
    })

    document.querySelectorAll(".goal-input-group").forEach((group) => {
      group.classList.toggle("active", group.dataset.goal === type)
    })

    this.updateGoalProgress()
    this.showToast(`Goal set to ${type}`, "success")
  }

  updateGoalProgress() {
    const goalValue = this.goals[this.currentGoalType]
    let currentValue = 0
    let unit = ""
    let progress = 0

    switch (this.currentGoalType) {
      case "distance":
        currentValue = this.totalDistance
        unit = "km"
        progress = (currentValue / goalValue) * 100
        break
      case "time":
        currentValue = this.getCurrentDuration() / (1000 * 60) // minutes
        unit = "min"
        progress = (currentValue / goalValue) * 100
        break
      case "calories":
        currentValue = this.calories
        unit = "kcal"
        progress = (currentValue / goalValue) * 100
        break
    }

    progress = Math.min(progress, 100)

    // Update progress circle
    const circumference = 2 * Math.PI * 54 // radius = 54
    const offset = circumference - (progress / 100) * circumference
    if (this.progressCircle) {
      this.progressCircle.style.strokeDasharray = circumference
      this.progressCircle.style.strokeDashoffset = offset
    }

    // Update text
    if (this.progressValue) this.progressValue.textContent = `${Math.round(progress)}%`
    if (this.progressLabel) this.progressLabel.textContent = `of ${goalValue}${unit}`
    if (this.currentProgress) this.currentProgress.textContent = currentValue.toFixed(1)
    if (this.remainingProgress) {
      const remaining = Math.max(0, goalValue - currentValue)
      this.remainingProgress.textContent = remaining.toFixed(1)
    }

    // Check if goal is achieved
    if (progress >= 100 && this.isTracking) {
      this.announceGoalAchieved()
    }
  }

  selectActivity(activity) {
    this.currentActivity = activity

    // Update UI
    this.activityCards.forEach((card) => {
      card.classList.toggle("active", card.dataset.activity === activity)
    })

    const config = this.activityConfig[activity]
    this.showToast(`${config.icon} ${config.name} selected`, "success")
  }

  async initializeMap() {
    try {
      // Initialize Leaflet map
      this.map = L.map("map", {
        zoomControl: true,
        attributionControl: false,
      }).setView([51.505, -0.09], 13)

      // Add OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap contributors",
      }).addTo(this.map)

      // Add custom attribution
      L.control
        .attribution({
          prefix: "FitXjourney",
        })
        .addTo(this.map)

      // Add scale control
      L.control.scale().addTo(this.map)

      this.hideMapOverlay()
    } catch (error) {
      console.error("Error initializing map:", error)
      this.showToast("Failed to initialize map", "error")
    }
  }

  async requestLocationAndWeather() {
    try {
      // Get current position
      const position = await this.getCurrentPosition()
      const { latitude, longitude } = position.coords

      // Update map center
      if (this.map) {
        this.map.setView([latitude, longitude], 15)

        // Add current location marker
        this.currentLocationMarker = L.marker([latitude, longitude], {
          icon: L.divIcon({
            className: "current-location-marker",
            html: '<div class="location-pulse"></div>',
            iconSize: [20, 20],
          }),
        }).addTo(this.map)
      }

      // Get weather data
      await this.fetchWeatherData(latitude, longitude)

      this.showToast("📍 GPS location acquired", "success")
    } catch (error) {
      console.error("Location error:", error)
      this.handleLocationError(error)
    }
  }

  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"))
        return
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      })
    })
  }

  async fetchWeatherData(lat, lng) {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${this.OPENWEATHER_API_KEY}&units=metric`,
      )

      if (!response.ok) throw new Error("Weather API error")

      this.weatherData = await response.json()
      this.updateWeatherDisplay()
    } catch (error) {
      console.error("Weather fetch error:", error)
      if (this.weatherDesc) this.weatherDesc.textContent = "Weather unavailable"
    }
  }

  updateWeatherDisplay() {
    if (!this.weatherData) return

    const temp = Math.round(this.weatherData.main.temp)
    const description = this.weatherData.weather[0].description
    const iconCode = this.weatherData.weather[0].icon

    if (this.weatherTemp) this.weatherTemp.textContent = `${temp}°C`
    if (this.weatherDesc) {
      this.weatherDesc.textContent = description.charAt(0).toUpperCase() + description.slice(1)
    }

    // Update weather icon
    const iconMap = {
      "01d": "fas fa-sun",
      "01n": "fas fa-moon",
      "02d": "fas fa-cloud-sun",
      "02n": "fas fa-cloud-moon",
      "03d": "fas fa-cloud",
      "03n": "fas fa-cloud",
      "04d": "fas fa-clouds",
      "04n": "fas fa-clouds",
      "09d": "fas fa-cloud-rain",
      "09n": "fas fa-cloud-rain",
      "10d": "fas fa-cloud-sun-rain",
      "10n": "fas fa-cloud-moon-rain",
      "11d": "fas fa-bolt",
      "11n": "fas fa-bolt",
      "13d": "fas fa-snowflake",
      "13n": "fas fa-snowflake",
      "50d": "fas fa-smog",
      "50n": "fas fa-smog",
    }

    if (this.weatherIcon && iconMap[iconCode]) {
      const iconEl = this.weatherIcon.querySelector("i")
      if (iconEl) iconEl.className = iconMap[iconCode]
    }
  }

  startTracking() {
    if (this.isPaused) {
      this.resumeTracking()
      return
    }

    // Fresh start
    this.isTracking = true
    this.isPaused = false
    this.startTime = Date.now()
    this.pausedTime = 0
    this.positions = []
    this.totalDistance = 0
    this.currentSpeed = 0
    this.maxSpeed = 0
    this.steps = 0
    this.calories = 0
    this.elevationGain = 0
    this.previousElevation = null
    this.lastAnnouncement = 0
    this.kmSplits = []

    // Update UI
    if (this.startBtn) this.startBtn.classList.add("hidden")
    if (this.pauseBtn) this.pauseBtn.classList.remove("hidden")
    if (this.stopBtn) this.stopBtn.classList.remove("hidden")

    // Add tracking class to body
    document.body.classList.add("tracking-active")

    // Start GPS tracking
    this.startGPSTracking()

    // Start update timer
    this.startUpdateTimer()

    // Voice announcement
    this.announceStart()

    this.showToast("🚀 Workout started! Go crush your goals!", "success")
  }

  pauseTracking() {
    this.isPaused = true
    this.pausedTime = Date.now() - this.startTime

    // Update UI
    if (this.pauseBtn) this.pauseBtn.classList.add("hidden")
    if (this.resumeBtn) this.resumeBtn.classList.remove("hidden")

    // Stop GPS tracking
    this.stopGPSTracking()

    // Stop update timer
    this.stopUpdateTimer()

    this.announceText("Workout paused. Take your time!")
    this.showToast("⏸️ Workout paused", "warning")
  }

  resumeTracking() {
    this.isPaused = false
    this.startTime = Date.now() - this.pausedTime

    // Update UI
    if (this.resumeBtn) this.resumeBtn.classList.add("hidden")
    if (this.pauseBtn) this.pauseBtn.classList.remove("hidden")

    // Resume GPS tracking
    this.startGPSTracking()

    // Resume update timer
    this.startUpdateTimer()

    this.announceText("Let's get back to it! You've got this!")
    this.showToast("▶️ Workout resumed", "success")
  }

  stopTracking() {
    this.isTracking = false
    this.isPaused = false

    // Update UI
    if (this.pauseBtn) this.pauseBtn.classList.add("hidden")
    if (this.resumeBtn) this.resumeBtn.classList.add("hidden")
    if (this.stopBtn) this.stopBtn.classList.add("hidden")
    if (this.startBtn) this.startBtn.classList.remove("hidden")

    // Remove tracking class
    document.body.classList.remove("tracking-active")

    // Stop GPS tracking
    this.stopGPSTracking()

    // Stop update timer
    this.stopUpdateTimer()

    // Final announcement
    this.announceWorkoutComplete()

    // Show workout summary
    this.showWorkoutSummary()

    this.showToast("🏁 Amazing workout completed!", "success")
  }

  startGPSTracking() {
    if (!navigator.geolocation) {
      this.showToast("GPS not available", "error")
      return
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.handlePositionUpdate(position),
      (error) => this.handleGPSError(error),
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 1000,
      },
    )
  }

  stopGPSTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
    }
  }

  async handlePositionUpdate(position) {
    if (!this.isTracking || this.isPaused) return

    const coords = position.coords
    const timestamp = position.timestamp

    // Create position object
    const newPosition = {
      lat: coords.latitude,
      lng: coords.longitude,
      timestamp: timestamp,
      accuracy: coords.accuracy,
      altitude: coords.altitude,
      speed: coords.speed,
    }

    // Add to positions array
    this.positions.push(newPosition)

    // Calculate distance if we have previous position
    if (this.positions.length > 1) {
      const prevPos = this.positions[this.positions.length - 2]
      const distance = this.calculateDistance(prevPos.lat, prevPos.lng, coords.latitude, coords.longitude)

      // Only add distance if accuracy is good and distance is reasonable
      if (coords.accuracy < 50 && distance < 0.1 && distance > 0.001) {
        this.totalDistance += distance
      }
    }

    // Update current speed
    if (coords.speed !== null && coords.speed >= 0) {
      this.currentSpeed = coords.speed * 3.6 // Convert m/s to km/h
      if (this.currentSpeed > this.maxSpeed) {
        this.maxSpeed = this.currentSpeed
      }
    }

    // Update elevation
    if (coords.altitude !== null) {
      this.currentElevation = coords.altitude
      if (this.previousElevation !== null) {
        const elevationDiff = coords.altitude - this.previousElevation
        if (elevationDiff > 0) {
          this.elevationGain += elevationDiff
        }
      }
      this.previousElevation = coords.altitude
    }

    // Update map
    this.updateMapPosition(coords)

    // Update route polyline
    this.updateRoutePolyline()

    // Calculate steps and calories
    this.calculateStepsAndCalories()

    // Check for voice announcements
    this.checkVoiceAnnouncements()
  }

  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371 // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1)
    const dLng = this.toRadians(lng2 - lng1)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180)
  }

  calculateStepsAndCalories() {
    const config = this.activityConfig[this.currentActivity]

    // Calculate steps (only for walking/running activities)
    if (config.stepLength > 0) {
      this.steps = Math.round((this.totalDistance * 1000) / config.stepLength)
    }

    // Calculate calories
    this.calories = Math.round(this.totalDistance * config.caloriesPerKm)

    // Simulate heart rate based on activity intensity
    const baseHeartRate = 70
    const intensityMultiplier = {
      walk: 1.2,
      jog: 1.5,
      run: 1.8,
      cycle: 1.4,
    }

    const simulatedHeartRate = Math.round(
      baseHeartRate * intensityMultiplier[this.currentActivity] + (Math.random() * 10 - 5),
    )

    if (this.heartRateEl) {
      this.heartRateEl.textContent = `${simulatedHeartRate}`
    }
  }

  updateMapPosition(coords) {
    if (!this.map) return

    const latLng = [coords.latitude, coords.longitude]

    // Update current location marker
    if (this.currentLocationMarker) {
      this.currentLocationMarker.setLatLng(latLng)
    }
  }

  updateRoutePolyline() {
    if (!this.map || this.positions.length < 2) return

    // Remove existing polyline
    if (this.routePolyline) {
      this.map.removeLayer(this.routePolyline)
    }

    // Create new polyline from positions
    const latLngs = this.positions.map((pos) => [pos.lat, pos.lng])
    const config = this.activityConfig[this.currentActivity]

    this.routePolyline = L.polyline(latLngs, {
      color: config.color,
      weight: 4,
      opacity: 0.8,
      smoothFactor: 1,
    }).addTo(this.map)
  }

  startUpdateTimer() {
    this.updateTimer = setInterval(() => {
      this.updateDisplay()
      this.updateGoalProgress()
    }, 1000)
  }

  stopUpdateTimer() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer)
      this.updateTimer = null
    }
  }

  updateDisplay() {
    // Update distance
    if (this.distanceEl) this.distanceEl.textContent = this.totalDistance.toFixed(2)

    // Update duration
    const duration = this.getCurrentDuration()
    if (this.durationEl) this.durationEl.textContent = this.formatDuration(duration)

    // Update pace
    const pace = this.calculatePace(duration, this.totalDistance)
    if (this.paceEl) this.paceEl.textContent = pace

    // Update calories
    if (this.caloriesEl) this.caloriesEl.textContent = this.calories

    // Update current speed
    if (this.currentSpeedEl) this.currentSpeedEl.textContent = this.currentSpeed.toFixed(1)

    // Update steps
    if (this.stepsEl) this.stepsEl.textContent = this.steps.toLocaleString()

    // Update elevation
    if (this.elevationEl) {
      this.elevationEl.textContent = this.currentElevation ? `${Math.round(this.currentElevation)}m` : "--"
    }
  }

  getCurrentDuration() {
    if (!this.startTime) return 0
    if (this.isPaused) return this.pausedTime
    return Date.now() - this.startTime
  }

  formatDuration(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  calculatePace(duration, distance) {
    if (distance === 0) return "0:00"

    const minutes = duration / (1000 * 60)
    const paceMinutes = minutes / distance
    const paceMin = Math.floor(paceMinutes)
    const paceSec = Math.round((paceMinutes - paceMin) * 60)

    return `${paceMin}:${paceSec.toString().padStart(2, "0")}`
  }

  // Voice Coaching Methods
  toggleVoiceCoach() {
    this.voiceEnabled = !this.voiceEnabled

    if (this.coachToggle) {
      this.coachToggle.innerHTML = this.voiceEnabled
        ? '<i class="fas fa-volume-up"></i>'
        : '<i class="fas fa-volume-mute"></i>'
    }

    if (this.coachStatusText) {
      this.coachStatusText.textContent = this.voiceEnabled ? "Voice coach enabled" : "Voice coach disabled"
    }

    const message = this.voiceEnabled ? "Voice coach enabled" : "Voice coach disabled"
    this.showToast(message, "success")

    if (this.voiceEnabled) {
      this.announceText("Voice coach activated! I'll guide you through your workout.")
    }
  }

  checkVoiceAnnouncements() {
    if (!this.voiceEnabled || !this.isTracking || this.isPaused) return

    const currentKm = Math.floor(this.totalDistance / this.voiceSettings.frequency)
    const lastKm = Math.floor(this.lastAnnouncement / this.voiceSettings.frequency)

    if (currentKm > lastKm && this.totalDistance >= this.voiceSettings.frequency) {
      this.announceKilometer(currentKm * this.voiceSettings.frequency)
      this.lastAnnouncement = this.totalDistance
    }
  }

  announceStart() {
    if (!this.voiceEnabled) return

    const config = this.activityConfig[this.currentActivity]
    const goalText = `${this.goals[this.currentGoalType]} ${this.currentGoalType === "distance" ? "kilometers" : this.currentGoalType === "time" ? "minutes" : "calories"}`

    this.announceText(`Starting your ${config.name.toLowerCase()} workout! Your goal is ${goalText}. Let's do this!`)
  }

  announceKilometer(distance) {
    if (!this.voiceEnabled) return

    const duration = this.getCurrentDuration()
    const pace = this.calculatePace(duration, this.totalDistance)

    let announcement = `${distance} kilometer${distance !== 1 ? "s" : ""} completed! `

    if (this.voiceSettings.announceTime) {
      const timeText = this.formatDuration(duration)
      announcement += `Total time: ${timeText}. `
    }

    if (this.voiceSettings.announcePace) {
      announcement += `Current pace: ${pace} per kilometer. `
    }

    if (this.voiceSettings.announceGoalProgress) {
      const goalValue = this.goals[this.currentGoalType]
      let currentValue = 0
      let unit = ""

      switch (this.currentGoalType) {
        case "distance":
          currentValue = this.totalDistance
          unit = "kilometers"
          break
        case "time":
          currentValue = duration / (1000 * 60)
          unit = "minutes"
          break
        case "calories":
          currentValue = this.calories
          unit = "calories"
          break
      }

      const remaining = Math.max(0, goalValue - currentValue)
      if (remaining > 0) {
        announcement += `${remaining.toFixed(1)} ${unit} remaining to reach your goal. `
      }
    }

    announcement += "Keep up the great work!"

    this.announceText(announcement)
    this.playMilestoneSound()
  }

  announceGoalAchieved() {
    if (!this.voiceEnabled) return

    const goalText =
      this.currentGoalType === "distance" ? "distance" : this.currentGoalType === "time" ? "time" : "calorie"

    this.announceText(`Congratulations! You've achieved your ${goalText} goal! You're absolutely crushing it!`)
    this.playMilestoneSound()
  }

  announceWorkoutComplete() {
    if (!this.voiceEnabled) return

    const duration = this.getCurrentDuration()
    const timeText = this.formatDuration(duration)

    this.announceText(
      `Workout complete! Amazing job! You covered ${this.totalDistance.toFixed(2)} kilometers in ${timeText}. You should be proud of yourself!`,
    )
  }

  announceText(text) {
    if (!this.voiceEnabled || !this.speechSynthesis) return

    // Cancel any ongoing speech
    this.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.volume = this.voiceSettings.volume
    utterance.rate = this.voiceSettings.rate
    utterance.pitch = 1

    this.speechSynthesis.speak(utterance)
  }

  playMilestoneSound() {
    const audio = document.getElementById("milestoneSound")
    if (audio) {
      audio.currentTime = 0
      audio.play().catch((e) => console.log("Audio play failed:", e))
    }
  }

  testVoice() {
    this.announceText("This is a test of your voice coach settings. You're doing great!")
  }

  saveVoiceSettings() {
    // Get settings from form
    const frequency = document.querySelector('input[name="frequency"]:checked')?.value || 1
    const volume = document.getElementById("voiceVolume")?.value || 0.8
    const rate = document.getElementById("speechRate")?.value || 1

    this.voiceSettings = {
      frequency: Number.parseFloat(frequency),
      volume: Number.parseFloat(volume),
      rate: Number.parseFloat(rate),
      announceDistance: document.getElementById("announceDistance")?.checked || true,
      announceTime: document.getElementById("announceTime")?.checked || true,
      announcePace: document.getElementById("announcePace")?.checked || true,
      announceGoalProgress: document.getElementById("announceGoalProgress")?.checked || true,
    }

    this.closeVoiceSettings()
    this.showToast("Voice settings saved!", "success")
  }

  // Map Controls
  centerMap() {
    if (!this.map || !this.currentLocationMarker) return

    const latLng = this.currentLocationMarker.getLatLng()
    this.map.setView(latLng, 16)
    this.showToast("Map centered on current location", "success")
  }

  toggleMapLayer() {
    this.showToast("Map layer toggle - feature coming soon!", "warning")
  }

  toggleFullscreen() {
    const mapContainer = document.querySelector(".map-container")

    if (!document.fullscreenElement) {
      mapContainer
        .requestFullscreen()
        .then(() => {
          this.showToast("Map in fullscreen mode", "success")
          setTimeout(() => {
            if (this.map) {
              this.map.invalidateSize()
            }
          }, 100)
        })
        .catch(() => {
          this.showToast("Fullscreen not supported", "error")
        })
    } else {
      document.exitFullscreen()
    }
  }

  // Modal Methods
  showWorkoutSummary() {
    const config = this.activityConfig[this.currentActivity]
    const duration = this.getCurrentDuration()
    const pace = this.calculatePace(duration, this.totalDistance)

    // Update summary content
    const summaryEmoji = document.getElementById("summaryEmoji")
    const summaryActivityName = document.getElementById("summaryActivityName")
    const summaryDateTime = document.getElementById("summaryDateTime")

    if (summaryEmoji) summaryEmoji.textContent = config.icon
    if (summaryActivityName) summaryActivityName.textContent = config.name
    if (summaryDateTime) summaryDateTime.textContent = new Date().toLocaleString()

    if (this.weatherData) {
      const temp = Math.round(this.weatherData.main.temp)
      const desc = this.weatherData.weather[0].description
      const summaryWeather = document.getElementById("summaryWeather")
      if (summaryWeather) {
        summaryWeather.innerHTML = `<i class="fas fa-thermometer-half"></i> <span>${temp}°C, ${desc}</span>`
      }
    }

    const summaryDistance = document.getElementById("summaryDistance")
    const summaryDuration = document.getElementById("summaryDuration")
    const summaryPace = document.getElementById("summaryPace")
    const summaryCalories = document.getElementById("summaryCalories")

    if (summaryDistance) summaryDistance.textContent = `${this.totalDistance.toFixed(2)} km`
    if (summaryDuration) summaryDuration.textContent = this.formatDuration(duration)
    if (summaryPace) summaryPace.textContent = `${pace} /km`
    if (summaryCalories) summaryCalories.textContent = `${this.calories} kcal`

    // Check goal achievement
    const goalAchievement = document.getElementById("goalAchievement")
    const goalValue = this.goals[this.currentGoalType]
    let currentValue = 0
    let achieved = false

    switch (this.currentGoalType) {
      case "distance":
        currentValue = this.totalDistance
        achieved = currentValue >= goalValue
        break
      case "time":
        currentValue = duration / (1000 * 60)
        achieved = currentValue >= goalValue
        break
      case "calories":
        currentValue = this.calories
        achieved = currentValue >= goalValue
        break
    }

    if (goalAchievement) {
      if (achieved) {
        goalAchievement.classList.remove("hidden")
        const achievementDescription = document.getElementById("achievementDescription")
        if (achievementDescription) {
          achievementDescription.textContent = `You completed your ${goalValue} ${this.currentGoalType} goal!`
        }
      } else {
        goalAchievement.classList.add("hidden")
      }
    }

    // Show modal
    if (this.workoutModal) this.workoutModal.classList.add("show")
  }

  closeModal() {
    if (this.workoutModal) this.workoutModal.classList.remove("show")
  }

  closeVoiceSettings() {
    if (this.voiceSettingsModal) this.voiceSettingsModal.classList.remove("show")
  }

  exportWorkoutData() {
    const workoutData = {
      activity: this.currentActivity,
      distance: this.totalDistance,
      duration: this.getCurrentDuration(),
      calories: this.calories,
      steps: this.steps,
      maxSpeed: this.maxSpeed,
      elevationGain: this.elevationGain,
      positions: this.positions,
      weather: this.weatherData,
      startTime: new Date(this.startTime),
      endTime: new Date(),
      goal: {
        type: this.currentGoalType,
        value: this.goals[this.currentGoalType],
      },
    }

    // Create and download JSON file
    const dataStr = JSON.stringify(workoutData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement("a")
    link.href = url
    link.download = `fitxjourney-workout-${new Date().toISOString().split("T")[0]}.json`
    link.click()

    URL.revokeObjectURL(url)
    this.showToast("Workout data exported!", "success")
  }

  discardWorkout() {
    this.closeModal()
    this.showToast("Workout discarded", "warning")
  }

  startNewWorkout() {
    // Reset all data
    this.totalDistance = 0
    this.currentSpeed = 0
    this.maxSpeed = 0
    this.steps = 0
    this.calories = 0
    this.elevationGain = 0
    this.positions = []
    this.startTime = null
    this.pausedTime = 0
    this.lastAnnouncement = 0
    this.kmSplits = []

    // Clear route from map
    if (this.routePolyline && this.map) {
      this.map.removeLayer(this.routePolyline)
      this.routePolyline = null
    }

    // Update display
    this.updateDisplay()
    this.updateGoalProgress()

    // Close modal
    this.closeModal()

    this.showToast("Ready for new workout! 🚀", "success")
  }

  handleSpacebarPress() {
    if (!this.isTracking && !this.isPaused) {
      this.startTracking()
    } else if (this.isTracking && !this.isPaused) {
      this.pauseTracking()
    } else if (this.isPaused) {
      this.resumeTracking()
    }
  }

  handleLocationError(error) {
    let message = "Location access failed. "

    switch (error.code) {
      case error.PERMISSION_DENIED:
        message += "Please enable location permissions."
        break
      case error.POSITION_UNAVAILABLE:
        message += "Location information unavailable."
        break
      case error.TIMEOUT:
        message += "Location request timed out."
        break
      default:
        message += "Unknown location error."
        break
    }

    this.showToast(message, "error")
  }

  handleGPSError(error) {
    console.error("GPS tracking error:", error)
    this.showToast("GPS tracking error", "error")
  }

  showToast(message, type = "info") {
    const toastContainer = document.getElementById("toastContainer")
    if (!toastContainer) return

    const toast = document.createElement("div")
    toast.className = `toast ${type}`

    const iconMap = {
      success: "fas fa-check-circle",
      error: "fas fa-exclamation-circle",
      warning: "fas fa-exclamation-triangle",
      info: "fas fa-info-circle",
    }

    toast.innerHTML = `
            <i class="toast-icon ${iconMap[type]}"></i>
            <span class="toast-message">${message}</span>
        `

    toastContainer.appendChild(toast)

    // Auto remove after 4 seconds
    setTimeout(() => {
      toast.remove()
    }, 4000)
  }

  showLoading(message) {
    const mapOverlay = document.getElementById("mapOverlay")
    if (mapOverlay) {
      const loadingText = mapOverlay.querySelector("p")
      if (loadingText) loadingText.textContent = message
      mapOverlay.classList.remove("hidden")
    }
  }

  hideLoading() {
    this.hideMapOverlay()
  }

  hideMapOverlay() {
    const mapOverlay = document.getElementById("mapOverlay")
    if (mapOverlay) {
      mapOverlay.classList.add("hidden")
    }
  }
}

// Initialize the running tracker when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.runningTracker = new EnhancedRunningTracker()
})

// Add custom CSS for location marker
const customStyles = `
.current-location-marker {
    background: transparent !important;
    border: none !important;
}

.location-pulse {
    width: 20px;
    height: 20px;
    background: linear-gradient(45deg, #8b5cf6, #f97316);
    border-radius: 50%;
    position: relative;
    animation: locationPulse 2s ease-in-out infinite;
}

.location-pulse::before {
    content: '';
    position: absolute;
    top: -5px;
    left: -5px;
    right: -5px;
    bottom: -5px;
    border: 2px solid rgba(139, 92, 246, 0.5);
    border-radius: 50%;
    animation: locationRipple 2s ease-in-out infinite;
}

@keyframes locationPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
}

@keyframes locationRipple {
    0% { transform: scale(0.8); opacity: 1; }
    100% { transform: scale(2); opacity: 0; }
}

.toast {
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 8px;
    padding: 12px 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    gap: 8px;
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
}

.toast.success {
    border-left: 4px solid #10b981;
}

.toast.error {
    border-left: 4px solid #ef4444;
}

.toast.warning {
    border-left: 4px solid #f59e0b;
}

.toast.info {
    border-left: 4px solid #3b82f6;
}

.toast-icon {
    font-size: 16px;
}

.toast.success .toast-icon {
    color: #10b981;
}

.toast.error .toast-icon {
    color: #ef4444;
}

.toast.warning .toast-icon {
    color: #f59e0b;
}

.toast.info .toast-icon {
    color: #3b82f6;
}

.toast-message {
    font-size: 14px;
    font-weight: 500;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
`

// Inject custom styles
const styleSheet = document.createElement("style")
styleSheet.textContent = customStyles
document.head.appendChild(styleSheet)
