// Import Leaflet ES module (latest version)
import L from "https://unpkg.com/leaflet@1.9.4/dist/leaflet-src.esm.js";

class EnhancedRunningTracker {
  constructor() {
    // Core tracking state
    this.isTracking = false;
    this.isPaused = false;
    this.startTime = null;
    this.pausedTime = 0;
    this.currentActivity = "walk";
    this.watchId = null;
    this.positions = [];
    this.routePolyline = null;

    // Stats
    this.totalDistance = 0;
    this.currentSpeed = 0;
    this.maxSpeed = 0;
    this.steps = 0;
    this.calories = 0;
    this.elevationGain = 0;
    this.currentElevation = 0;
    this.previousElevation = null;
    this.lastKmTime = 0;
    this.kmSplits = [];

    // Goals
    this.currentGoalType = "distance";
    this.goals = {
      distance: 5,
      time: 30,
      calories: 300,
    };

    // Voice coaching
    this.voiceEnabled = true;
    this.voiceSettings = {
      frequency: 1, // km
      volume: 0.8,
      rate: 1,
      announceDistance: true,
      announceTime: true,
      announcePace: true,
      announceGoalProgress: true,
    };
    this.lastAnnouncement = 0;
    this.speechSynthesis = window.speechSynthesis;

    // Map and weather
    this.map = null;
    this.currentLocationMarker = null;
    this.weatherData = null;

    // API Keys
    this.OPENWEATHER_API_KEY = "f21d67a9e459162a06695902e69f9f90d";

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
    };

    this.init();
  }

  async init() {
    this.showLoading("Initializing FitXjourney...");

    // Initialize UI elements
    this.initializeElements();
    this.bindEvents();

    // Initialize map
    await this.initializeMap();

    // Request location and weather
    await this.requestLocationAndWeather();

    // Update display
    this.updateDisplay();
    this.updateGoalProgress();

    this.hideLoading();
    this.showToast("🚀 FitXjourney is ready! Set your goal and start tracking.", "success");
  }

  initializeElements() {
    // Goal elements
    this.goalTypeBtns = document.querySelectorAll(".goal-type-btn");
    this.goalInputs = {
      distance: document.getElementById("distanceGoal"),
      time: document.getElementById("timeGoal"),
      calories: document.getElementById("caloriesGoal"),
    };
    this.presetBtns = document.querySelectorAll(".preset-btn");

    // Activity buttons
    this.activityCards = document.querySelectorAll(".activity-card");

    // Control buttons
    this.startBtn = document.getElementById("startBtn");
    this.pauseBtn = document.getElementById("pauseBtn");
    this.resumeBtn = document.getElementById("resumeBtn");
    this.stopBtn = document.getElementById("stopBtn");

    // Display elements
    this.distanceEl = document.getElementById("distance");
    this.durationEl = document.getElementById("duration");
    this.paceEl = document.getElementById("pace");
    this.caloriesEl = document.getElementById("calories");
    this.currentSpeedEl = document.getElementById("currentSpeed");
    this.stepsEl = document.getElementById("steps");
    this.elevationEl = document.getElementById("elevation");
    this.heartRateEl = document.getElementById("heartRate");

    // Progress elements
    this.progressValue = document.getElementById("progressValue");
    this.progressLabel = document.getElementById("progressLabel");
    this.currentProgress = document.getElementById("currentProgress");
    this.remainingProgress = document.getElementById("remainingProgress");
    this.progressCircle = document.getElementById("progressCircle");

    // Weather elements
    this.weatherTemp = document.getElementById("weatherTemp");
    this.weatherDesc = document.getElementById("weatherDesc");
    this.weatherIcon = document.getElementById("weatherIcon");

    // Modal elements
    this.workoutModal = document.getElementById("workoutModal");
    this.voiceSettingsModal = document.getElementById("voiceSettingsModal");

    // Voice coach elements
    this.coachToggle = document.getElementById("coachToggle");
    this.coachStatusText = document.getElementById("coachStatusText");

    // Map controls
    this.centerMapBtn = document.getElementById("centerMapBtn");
    this.layerToggleBtn = document.getElementById("layerToggleBtn");
    this.fullscreenBtn = document.getElementById("fullscreenBtn");
  }

  bindEvents() {
    // Goal type selection
    if (this.goalTypeBtns) {
      this.goalTypeBtns.forEach((btn) => {
        btn.addEventListener("click", (e) => {
          this.selectGoalType(e.currentTarget.dataset.type);
        });
      });
    }

    // Goal input changes
    Object.keys(this.goalInputs).forEach((type) => {
      if (this.goalInputs[type]) {
        this.goalInputs[type].addEventListener("input", (e) => {
          this.goals[type] = Number.parseFloat(e.target.value);
          this.updateGoalProgress();
        });
      }
    });

    // Preset buttons
    if (this.presetBtns) {
      this.presetBtns.forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const value = Number.parseFloat(e.currentTarget.dataset.value);
          const activeGoalGroup = document.querySelector(".goal-input-group.active");
          if (activeGoalGroup) {
            const input = activeGoalGroup.querySelector("input");
            if (input) {
              input.value = value;
              this.goals[this.currentGoalType] = value;
              this.updateGoalProgress();
            }
          }
        });
      });
    }

    // Activity selection
    if (this.activityCards) {
      this.activityCards.forEach((card) => {
        card.addEventListener("click", (e) => {
          this.selectActivity(e.currentTarget.dataset.activity);
        });
      });
    }

    // Control buttons
    if (this.startBtn) this.startBtn.addEventListener("click", () => this.startTracking());
    if (this.pauseBtn) this.pauseBtn.addEventListener("click", () => this.pauseTracking());
    if (this.resumeBtn) this.resumeBtn.addEventListener("click", () => this.resumeTracking());
    if (this.stopBtn) this.stopBtn.addEventListener("click", () => this.stopTracking());

    // Voice coach toggle
    if (this.coachToggle) this.coachToggle.addEventListener("click", () => this.toggleVoiceCoach());

    // Map controls
    if (this.centerMapBtn) this.centerMapBtn.addEventListener("click", () => this.centerMap());
    if (this.layerToggleBtn) this.layerToggleBtn.addEventListener("click", () => this.toggleMapLayer());
    if (this.fullscreenBtn) this.fullscreenBtn.addEventListener("click", () => this.toggleFullscreen());

    // Modal controls
    const modalClose = document.getElementById("modalClose");
    const voiceSettingsClose = document.getElementById("voiceSettingsClose");
    const exportBtn = document.getElementById("exportBtn");
    const newWorkoutBtn = document.getElementById("newWorkoutBtn");
    const discardBtn = document.getElementById("discardBtn");

    if (modalClose) modalClose.addEventListener("click", () => this.closeModal());
    if (voiceSettingsClose) voiceSettingsClose.addEventListener("click", () => this.closeVoiceSettings());
    if (exportBtn) exportBtn.addEventListener("click", () => this.exportWorkoutData());
    if (newWorkoutBtn) newWorkoutBtn.addEventListener("click", () => this.startNewWorkout());
    if (discardBtn) discardBtn.addEventListener("click", () => this.discardWorkout());

    // Voice settings
    const testVoiceBtn = document.getElementById("testVoiceBtn");
    const saveVoiceSettingsBtn = document.getElementById("saveVoiceSettingsBtn");

    if (testVoiceBtn) testVoiceBtn.addEventListener("click", () => this.testVoice());
    if (saveVoiceSettingsBtn) saveVoiceSettingsBtn.addEventListener("click", () => this.saveVoiceSettings());

    // Auth banner close (still visible for guests)
    const bannerClose = document.getElementById("bannerClose");
    if (bannerClose) {
      bannerClose.addEventListener("click", () => {
        const authBanner = document.getElementById("authBanner");
        if (authBanner) authBanner.classList.add("hidden");
      });
    }

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.code === "Space" && !e.target.matches("input, textarea, button")) {
        e.preventDefault();
        this.handleSpacebarPress();
      }
    });
  }

  selectGoalType(type) {
    this.currentGoalType = type;
    // Update UI
    if (this.goalTypeBtns) {
      this.goalTypeBtns.forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.type === type);
      });
    }
    document.querySelectorAll(".goal-input-group").forEach((group) => {
      group.classList.toggle("active", group.dataset.goal === type);
    });

    this.updateGoalProgress();
    this.showToast(`Goal set to ${type}`, "success");
  }

  updateGoalProgress() {
    const goalValue = this.goals[this.currentGoalType];
    let currentValue = 0;
    let unit = "";
    let progress = 0;

    switch (this.currentGoalType) {
      case "distance":
        currentValue = this.totalDistance;
        unit = "km";
        progress = (currentValue / goalValue) * 100;
        break;
      case "time":
        currentValue = this.getCurrentDuration() / (1000 * 60); // minutes
        unit = "min";
        progress = (currentValue / goalValue) * 100;
        break;
      case "calories":
        currentValue = this.calories;
        unit = "kcal";
        progress = (currentValue / goalValue) * 100;
        break;
    }

    progress = Math.min(progress, 100);

    // Update progress circle
    const circumference = 2 * Math.PI * 54; // radius = 54
    const offset = circumference - (progress / 100) * circumference;
    if (this.progressCircle) {
      this.progressCircle.style.strokeDasharray = circumference;
      this.progressCircle.style.strokeDashoffset = offset;
    }

    if (this.progressValue) this.progressValue.textContent = `${Math.round(progress)}%`;
    if (this.progressLabel) this.progressLabel.textContent = `of ${goalValue}${unit}`;
    if (this.currentProgress) this.currentProgress.textContent = currentValue.toFixed(1);
    if (this.remainingProgress) {
      const remaining = Math.max(0, goalValue - currentValue);
      this.remainingProgress.textContent = remaining.toFixed(1);
    }

    // Check if goal is achieved
    if (progress >= 100 && this.isTracking) {
      this.announceGoalAchieved();
    }
  }

  selectActivity(activity) {
    this.currentActivity = activity;
    // Update UI
    if (this.activityCards) {
      this.activityCards.forEach((card) => {
        card.classList.toggle("active", card.dataset.activity === activity);
      });
    }
    const config = this.activityConfig[activity];
    this.showToast(`${config.icon} ${config.name} selected`, "success");
  }

  async initializeMap() {
    try {
      this.map = L.map("map", {
        zoomControl: true,
        attributionControl: false,
      }).setView([51.505, -0.09], 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap contributors",
      }).addTo(this.map);

      L.control
        .attribution({
          prefix: "FitXjourney",
        })
        .addTo(this.map);

      L.control.scale().addTo(this.map);

      this.hideMapOverlay();
    } catch (error) {
      console.error("Error initializing map:", error);
      this.showToast("Failed to initialize map", "error");
    }
  }

  async requestLocationAndWeather() {
    try {
      const position = await this.getCurrentPosition();
      const { latitude, longitude } = position.coords;

      // Update map center
      if (this.map) {
        this.map.setView([latitude, longitude], 15);

        // Add current location marker
        this.currentLocationMarker = L.marker([latitude, longitude], {
          icon: L.divIcon({
            className: "current-location-marker",
            html: '<div class="location-pulse"></div>',
            iconSize: [20, 20],
          }),
        }).addTo(this.map);
      }

      // Get weather data
      await this.fetchWeatherData(latitude, longitude);

      this.showToast("📍 GPS location acquired", "success");
    } catch (error) {
      console.error("Location error:", error);
      this.handleLocationError(error);
    }
  }

  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      });
    });
  }

  async fetchWeatherData(lat, lng) {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${this.OPENWEATHER_API_KEY}&units=metric`
      );

      if (!response.ok) throw new Error("Weather API error");

      this.weatherData = await response.json();
      this.updateWeatherDisplay();
    } catch (error) {
      console.error("Weather fetch error:", error);
      if (this.weatherDesc) this.weatherDesc.textContent = "Weather unavailable";
    }
  }

  updateWeatherDisplay() {
    if (!this.weatherData) return;

    const temp = Math.round(this.weatherData.main.temp);
    const description = this.weatherData.weather[0].description;
    const iconCode = this.weatherData.weather[0].icon;

    if (this.weatherTemp) this.weatherTemp.textContent = `${temp}°C`;
    if (this.weatherDesc) {
      this.weatherDesc.textContent = description.charAt(0).toUpperCase() + description.slice(1);
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
    };

    if (this.weatherIcon && iconMap[iconCode]) {
      const iconEl = this.weatherIcon.querySelector("i");
      if (iconEl) iconEl.className = iconMap[iconCode];
    }
  }

  // ... rest of class unchanged (tracking, stats, modals, etc.) ...

  // All other methods (startTracking, pauseTracking, resumeTracking, etc.)
  // remain unchanged from your current implementation.

  // At the end, initialize the running tracker when DOM is loaded:
}

document.addEventListener("DOMContentLoaded", () => {
  window.runningTracker = new EnhancedRunningTracker();
});

// Inject custom styles for location marker and toast
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
`;

const styleSheet = document.createElement("style");
styleSheet.textContent = customStyles;
document.head.appendChild(styleSheet);
