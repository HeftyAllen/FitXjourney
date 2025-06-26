// ============================
// Firebase & API Initialization
// ============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js"
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-analytics.js"
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-auth.js"
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-firestore.js"

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAHEvRJuOyZ8SagrmioDFmrWH8rAqCu5Vk",
  authDomain: "fit-x-journey.firebaseapp.com",
  projectId: "fit-x-journey",
  storageBucket: "fit-x-journey.firebasestorage.app",
  messagingSenderId: "583991205621",
  appId: "1:583991205621:web:6db1600a16b23590c3efbc",
  measurementId: "G-XT12JJNNC3",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const analytics = getAnalytics(app)
const auth = getAuth(app)
const db = getFirestore(app)

// Listen for auth state changes and update the logged-in user's name.
onAuthStateChanged(auth, (user) => {
  const userProfileEl = document.querySelector(".user-profile span")
  if (user) {
    const name = user.displayName || user.email
    userProfileEl.textContent = name
    localStorage.setItem("loggedInUser", JSON.stringify({ name }))
  } else {
    userProfileEl.textContent = "Guest"
  }
})

// ============================
// API configuration
// ============================
const exerciseDBKey = "02e5919d7cmshe07914db7605532p164aa8jsn0cde2d877db5"
const exerciseDBHost = "exercisedb.p.rapidapi.com"
const spoonacularAPIKey = "488cc67173af4756920a77b77c93c0f2"

// ============================
// Dashboard Functions
// ============================

// 1. Display Login Name
function displayLoginName() {
  const user = JSON.parse(localStorage.getItem("loggedInUser"))
  document.querySelector(".user-profile span").textContent = user && user.name ? user.name : "Guest"
}

// 2. Render Charts with Plotly
function renderWeeklyWorkoutChart() {
  const data = [
    {
      x: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      y: [1, 0, 1, 1, 0, 1, 1],
      type: "bar",
      marker: { color: "rgba(75,192,192,0.6)" },
    },
  ]
  const layout = {
    title: "Weekly Workout Chart",
    xaxis: { title: "Day" },
    yaxis: { title: "Workouts Completed", dtick: 1 },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#e0e0e0" },
  }
  const config = { responsive: true }
  Plotly.newPlot("weekly-workout-chart", data, layout, config)
}

function renderProgressChart() {
  const data = [
    {
      x: ["Week 1", "Week 2", "Week 3", "Week 4"],
      y: [200, 250, 180, 300],
      type: "scatter",
      mode: "lines+markers",
      marker: { color: "rgba(153,102,255,0.6)" },
    },
  ]
  const layout = {
    title: "Progress Chart - Total Workout Time (min)",
    xaxis: { title: "Week" },
    yaxis: { title: "Workout Time (min)" },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#e0e0e0" },
  }
  const config = { responsive: true }
  Plotly.newPlot("progress-chart", data, layout, config)
}

function renderTrendAnalysisChart() {
  const data = [
    {
      x: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      y: [65, 67, 70, 68, 72, 75],
      type: "scatter",
      mode: "lines+markers",
      name: "Weight (kg)",
      marker: { color: "#ff6f00" },
    },
  ]
  const layout = {
    title: "Weight Trend Analysis",
    xaxis: { title: "Month" },
    yaxis: { title: "Weight (kg)" },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#e0e0e0" },
  }
  const config = { responsive: true }
  Plotly.newPlot("trend-analysis-chart", data, layout, config)
}

 //3. Populate "My Workouts" Section
 function populateMyWorkouts() {
   const savedWorkouts = JSON.parse(localStorage.getItem("savedWorkouts")) || []
   const container = document.querySelector(".workouts-container")

   if (savedWorkouts.length === 0) {
     container.innerHTML = `
       <div class="empty-state">
         <p>No workouts created yet. Create your first workout to get started!</p>
         <button class="btn btn-primary">Create Workout</button>
       </div>
     `
     return
   }

   container.innerHTML = ""
   savedWorkouts.forEach((workout, index) => {
     const card = document.createElement("div")
     card.classList.add("workout-card")
     card.innerHTML = `
       <h2>${workout.name}</h2>
       <p><strong>Duration:</strong> ${workout.totalTime} | <strong>Exercises:</strong> ${workout.exercisesCompleted || "N/A"}</p>
      <div class="workout-actions">    
           <button class="btn btn-secondary edit-btn" data-index="${index}">Edit</button>         <button class="btn btn-secondary delete-btn" data-index="${index}">Delete</button>
        <button class="btn btn-primary start-btn" data-index="${index}">Start</button>
      </div>
    `
    container.appendChild(card)
   })

   document   
     .querySelectorAll(".edit-btn")
     .forEach((btn) => btn.addEventListener("click", (e) => editWorkout(e.target.getAttribute("data-index"))))
   document
     .querySelectorAll(".delete-btn")
     .forEach((btn) => btn.addEventListener("click", (e) => deleteWorkout(e.target.getAttribute("data-index"))))
   document
     .querySelectorAll(".start-btn")
     .forEach((btn) => btn.addEventListener("click", (e) => startWorkout(e.target.getAttribute("data-index"))))
 }

 function editWorkout(index) {
   window.location.href = `workout-session.html?edit=${index}`
 }

 function deleteWorkout(index) {
   const savedWorkouts = JSON.parse(localStorage.getItem("savedWorkouts")) || []
   savedWorkouts.splice(index, 1)
   localStorage.setItem("savedWorkouts", JSON.stringify(savedWorkouts))
  populateMyWorkouts()
 }

 function startWorkout(index) {
   window.location.href = `workout-session.html?workout=${index}`
 }

// 4. AI Coaching & Recommendations
function generateAICoachingRecommendations() {
  fetchRandomWorkouts().then((workouts) => {
    const container = document.querySelector("#ai-coaching-recommendations .ai-suggestions")
    container.innerHTML = ""
    workouts.forEach((workout) => {
      const card = document.createElement("div")
      card.classList.add("suggestion-card")
      card.innerHTML = `
        <h2>${workout.name || workout.bodyPart || "Exercise"}</h2>
        <p><strong>Target:</strong> ${workout.target || "N/A"}</p>
        <p><strong>Equipment:</strong> ${workout.equipment || "None"}</p>
        <button class="btn btn-primary start-btn" data-workout-id="${workout.id}">Start Workout</button>
      `
      card.querySelector(".start-btn").addEventListener("click", () => {
        startAICoachedWorkout(workout.id)
      })
      container.appendChild(card)
    })
  })
}

function fetchRandomWorkouts() {
  // Mock data for when API is not available
  const mockExercises = [
    {
      id: "ex001",
      name: "Upper Body Strength",
      target: "Chest, Arms, Shoulders",
      equipment: "Dumbbells",
      bodyPart: "upper body",
    },
    {
      id: "ex002",
      name: "Core Stability",
      target: "Abs, Lower Back",
      equipment: "Bodyweight",
      bodyPart: "core",
    },
  ]

  // Try to fetch from API, fallback to mock data
  const url = `https://${exerciseDBHost}/exercises`
  return fetch(url, {
    method: "GET",
    headers: {
      "x-rapidapi-key": exerciseDBKey,
      "x-rapidapi-host": exerciseDBHost,
    },
  })
    .then((response) => response.json())
    .then((exercises) => {
      const randomExercises = []
      if (exercises.length > 0) {
        for (let i = 0; i < 2; i++) {
          const randomIndex = Math.floor(Math.random() * exercises.length)
          randomExercises.push(exercises[randomIndex])
        }
        return randomExercises
      }
      return mockExercises
    })
    .catch((error) => {
      console.error("Error fetching random exercises:", error)
      return mockExercises
    })
}

function startAICoachedWorkout(workoutId) {
  window.location.href = `workout-session.html?aiWorkoutId=${workoutId}`
}

// 5. Populate Workout History
function calculateCalories(timeStr) {
  const seconds = convertTimeToSeconds(timeStr)
  return Math.round((seconds / 60) * 10)
}

function convertTimeToSeconds(timeStr) {
  if (!timeStr) return 0
  const parts = timeStr.split(":").map(Number)
  if (parts.length !== 3) return 0
  return parts[0] * 3600 + parts[1] * 60 + parts[2]
}

// 6. Update Progress Analytics

// 7. Update Nutrition & Hydration

// ============================
// Enhanced Challenges & Rewards Module
// ============================

// ----- MASTER CHALLENGE POOL (20 challenges) -----
const challengePool = [
  {
    id: 1,
    title: "Workout 5 Days This Week",
    description: "Complete at least one workout on 5 different days this week.",
    trackingMethod: "manual",
    type: "workout",
    target: 5,
    progress: 0,
    reward: "Badge: Consistency",
    days: { Mon: false, Tue: false, Wed: false, Thu: false, Fri: false, Sat: false, Sun: false },
  },
  {
    id: 2,
    title: "10 Chest Workouts a Week",
    description: "Perform at least 10 chest workouts this week. Automatically tracked from your logs.",
    trackingMethod: "auto",
    type: "auto",
    target: 10,
    progress: 0,
    reward: "Badge: Chest Champion",
    muscleGroup: "chest",
  },
  {
    id: 3,
    title: "Start a Cardio Challenge",
    description: "Begin a cardio challenge by starting a timed session and track your cardio minutes.",
    trackingMethod: "startable",
    type: "startable",
    target: 30,
    progress: 0,
    reward: "Badge: Cardio Starter",
    isStarted: false,
  },
  // Additional challenges omitted for brevity
]

// Active challenges array (subset of the master pool)
const activeChallenges = []

// Completed rewards array (persisted separately)
const completedRewards = []

/**
 * Initializes active challenges.
 * If none are stored, select the first 3
 */

// ============================
// Dashboard UI Enhancement
// ============================

document.addEventListener("DOMContentLoaded", () => {
  // Initialize the dashboard UI
  initDashboard()

  // Set up event listeners
  setupEventListeners()

  // Render dynamic content
  renderDynamicContent()
})

// ============================
// Dashboard Initialization
// ============================

function initDashboard() {
  // Apply theme based on localStorage preference
  const savedTheme = localStorage.getItem("theme")
  if (savedTheme === "light") {
    document.body.classList.add("light-mode")
  } else {
    document.body.classList.add("dark-mode")
  }

  // Update theme toggle icon
  const themeIcon = document.querySelector(".theme-toggle i")
  if (themeIcon) {
    themeIcon.textContent = document.body.classList.contains("light-mode") ? "dark_mode" : "light_mode"
  }

  // Initialize Plotly charts with proper styling
  initCharts()

  // Fix layout issues
  fixLayoutIssues()
}

// ============================
// Event Listeners Setup
// ============================

function setupEventListeners() {
  // Theme toggle
  const themeToggle = document.querySelector(".theme-toggle")
  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme)
  }

  // Dropdown menus
  setupDropdowns()

  // Challenge cards expansion
  setupChallengeCards()

  // Chat toggle
  const chatButton = document.querySelector(".chat-button")
  if (chatButton) {
    chatButton.addEventListener("click", toggleChat)
  }

  // Modal close buttons
  setupModalCloseButtons()

  // Chart period buttons
  setupChartPeriodButtons()

  // Chart tabs
  setupChartTabs()

  // Action buttons
  setupActionButtons()
}

// ============================
// Layout Fixes
// ============================

function fixLayoutIssues() {
  // Fix AI recommendations layout
  fixAIRecommendationsLayout()

  // Fix challenges and rewards layout
  fixChallengesLayout()

  // Fix responsive issues
  fixResponsiveLayout()

  // Fix chart container heights
  fixChartContainers()
}

function fixAIRecommendationsLayout() {
  const aiSuggestions = document.querySelector(".ai-suggestions")
  if (!aiSuggestions) return

  // Ensure proper grid layout for AI recommendation cards
  aiSuggestions.style.display = "grid"
  aiSuggestions.style.gridTemplateColumns = "repeat(auto-fit, minmax(300px, 1fr))"
  aiSuggestions.style.gap = "1.5rem"
}

function fixChallengesLayout() {
  // Fix challenges grid layout
  const challengesGrid = document.querySelector(".challenges-grid")
  if (!challengesGrid) return

  challengesGrid.style.display = "grid"
  challengesGrid.style.gridTemplateColumns = "repeat(auto-fit, minmax(400px, 1fr))"
  challengesGrid.style.gap = "1.5rem"
}

function fixResponsiveLayout() {
  // Fix header responsiveness
  const header = document.querySelector(".dashboard-header")
  if (header) {
    header.style.position = "sticky"
    header.style.top = "0"
    header.style.zIndex = "1000"
  }

  // Add media query handling in JS
  const handleResize = () => {
    const topNav = document.querySelector(".main-nav")
    if (topNav) {
      if (window.innerWidth <= 768) {
        topNav.style.order = "3"
        topNav.style.width = "100%"
      } else {
        topNav.style.order = ""
        topNav.style.width = ""
      }
    }
  }

  // Initial call and event listener
  handleResize()
  window.addEventListener("resize", handleResize)
}

function fixChartContainers() {
  // Ensure charts have proper height
  const charts = document.querySelectorAll(".chart")
  charts.forEach((chart) => {
    chart.style.height = "calc(100% - 50px)"
    chart.style.width = "100%"
  })

  // Fix chart card heights
  const chartCards = document.querySelectorAll(".chart-card")
  chartCards.forEach((card) => {
    card.style.height = "400px"
  })
}

// ============================
// UI Component Setup
// ============================

function setupDropdowns() {
  const dropdowns = document.querySelectorAll(".dropdown")

  dropdowns.forEach((dropdown) => {
    const link = dropdown.querySelector("a")

    if (link) {
      link.addEventListener("click", (e) => {
        e.preventDefault()

        // Close all other dropdowns
        dropdowns.forEach((d) => {
          if (d !== dropdown) {
            d.classList.remove("active")
          }
        })

        // Toggle current dropdown
        dropdown.classList.toggle("active")
      })
    }
  })

  // Close dropdowns when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".dropdown")) {
      dropdowns.forEach((d) => d.classList.remove("active"))
    }
  })
}

// Challenges & Rewards Functionality
document.addEventListener('DOMContentLoaded', function() {
  // Challenge expansion functionality
  const challengeHeaders = document.querySelectorAll('.challenge-header');
  
  challengeHeaders.forEach(header => {
    header.addEventListener('click', function() {
      const challengeItem = this.closest('.challenge-item');
      
      // Toggle expanded class
      challengeItem.classList.toggle('expanded');
      
      // Update icon
      const icon = this.querySelector('.challenge-toggle i');
      if (challengeItem.classList.contains('expanded')) {
        icon.textContent = 'expand_less';
      } else {
        icon.textContent = 'expand_more';
      }
    });
  });
  
  // Mark challenge as complete
  const completeButtons = document.querySelectorAll('.mark-complete-btn');
  
  completeButtons.forEach(button => {
    button.addEventListener('click', function() {
      const challengeId = this.getAttribute('data-challenge');
      const progressIndicator = document.querySelector(`.challenge-header[data-challenge="${challengeId}"] .challenge-progress-indicator span`);
      const progressBar = this.closest('.challenge-details').querySelector('.progress-bar');
      
      // Update progress (in a real app, this would be saved to a database)
      if (challengeId === '1') {
        progressIndicator.textContent = '5/5';
        progressBar.style.width = '100%';
        
        // Show success message
        showNotification('Challenge completed! You earned the Consistency badge.');
        
        // Disable button
        this.disabled = true;
        this.textContent = 'Completed';
      }
    });
  });
  
  // Start challenge button
  const startButtons = document.querySelectorAll('.start-challenge-btn');
  
  startButtons.forEach(button => {
    button.addEventListener('click', function() {
      const challengeId = this.getAttribute('data-challenge');
      
      // In a real app, this would start a timer or redirect to a workout page
      showNotification('Cardio challenge started! Complete 30 minutes to earn your badge.');
      
      // Change button text
      this.textContent = 'Challenge in Progress';
      this.disabled = true;
    });
  });
  
  // Browse challenges button
  const browseButton = document.getElementById('browse-challenges-btn');
  
  if (browseButton) {
    browseButton.addEventListener('click', function() {
      showNotification('More challenges coming soon!');
    });
  }
  
  // View all rewards button
  const viewAllButton = document.getElementById('view-all-rewards-btn');
  
  if (viewAllButton) {
    viewAllButton.addEventListener('click', function() {
      showNotification('All rewards will be displayed here soon!');
    });
  }
  
  // Helper function to show notifications
  function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
      <div class="notification-content">
        <i class="material-icons">notifications</i>
        <span>${message}</span>
      </div>
      <button class="notification-close">
        <i class="material-icons">close</i>
      </button>
    `;
    
    document.body.appendChild(notification);
    
    // Show notification with animation
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      hideNotification(notification);
    }, 5000);
    
    // Close button functionality
    const closeButton = notification.querySelector('.notification-close');
    closeButton.addEventListener('click', function() {
      hideNotification(notification);
    });
  }
  
  function hideNotification(notification) {
    notification.classList.remove('show');
    
    // Remove from DOM after animation completes
    setTimeout(() => {
      notification.remove();
    }, 300);
  }
});
function setupChallengeCards() {
  const challengeCards = document.querySelectorAll(".challenge-card")

  challengeCards.forEach((card) => {
    const header = card.querySelector(".challenge-header")
    const details = card.querySelector(".challenge-details")
    const toggle = card.querySelector(".challenge-toggle i")

    if (header && details && toggle) {
      header.addEventListener("click", () => {
        card.classList.toggle("expanded")
        toggle.textContent = card.classList.contains("expanded") ? "expand_less" : "expand_more"
      })
    }
  })
}

function setupModalCloseButtons() {
  const closeButtons = document.querySelectorAll(".modal-close")

  closeButtons.forEach((button) => {
    const modal = button.closest(".modal")

    if (modal) {
      button.addEventListener("click", () => {
        modal.classList.remove("active")
      })
    }
  })

  // Close modal when clicking outside content
  const modals = document.querySelectorAll(".modal")
  modals.forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("active")
        setTimeout(() => {
          modal.remove()
        }, 300)
      }
    })
  })
}

function setupChartPeriodButtons() {
  const chartPeriodButtons = document.querySelectorAll(".btn-chart-period")

  chartPeriodButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // Remove active class from siblings
      const siblings = Array.from(this.parentElement.children)
      siblings.forEach((sibling) => sibling.classList.remove("active"))

      // Add active class to clicked button
      this.classList.add("active")

      // Update chart data
      const chartContainer = this.closest(".chart-card")
      if (chartContainer) {
        const chart = chartContainer.querySelector(".chart")
        if (chart) {
          const period = this.textContent.toLowerCase()
          updateChartData(chart.id, period)
        }
      }
    })
  })
}

function setupChartTabs() {
  const chartTabs = document.querySelectorAll(".chart-tab")

  chartTabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      // Remove active class from all tabs
      chartTabs.forEach((t) => t.classList.remove("active"))

      // Add active class to clicked tab
      this.classList.add("active")

      // Show corresponding chart
      const chartId = this.textContent.toLowerCase()
      updateProgressChart(chartId)
    })
  })
}

function setupActionButtons() {
  // New Workout button
  const newWorkoutBtn = document.querySelector("#new-workout")
  if (newWorkoutBtn) {
    newWorkoutBtn.addEventListener("click", () => {
      window.location.href = "workout-planner.html"
    })
  }

  // Start Session button
  const startSessionBtn = document.querySelector("#start-session")
  if (startSessionBtn) {
    startSessionBtn.addEventListener("click", () => {
      const savedWorkouts = JSON.parse(localStorage.getItem("savedWorkouts") || "[]")
      if (savedWorkouts.length > 0) {
        // Use the most recent workout
        localStorage.setItem("currentWorkout", JSON.stringify(savedWorkouts[0]))
        window.location.href = "workout-session.html"
      } else {
        alert("Please create a workout first")
        window.location.href = "workout-planner.html"
      }
    })
  }

  // Log Meal button
  const logMealBtn = document.querySelector("#log-meal")
  if (logMealBtn) {
    logMealBtn.addEventListener("click", () => {
      alert("Meal logging feature coming soon!")
    })
  }

  // Log Water button
  const logWaterBtn = document.querySelector("#log-water")
  if (logWaterBtn) {
    logWaterBtn.addEventListener("click", () => {
      alert("Water logging feature coming soon!")
    })
  }

  // View Progress button
  const viewProgressBtn = document.querySelector("#view-progress")
  if (viewProgressBtn) {
    viewProgressBtn.addEventListener("click", () => {
      // Scroll to progress analytics section
      const progressSection = document.querySelector("#progress-analytics")
      if (progressSection) {
        progressSection.scrollIntoView({ behavior: "smooth" })
      }
    })
  }
}

// ============================
// Theme Toggle
// ============================

function toggleTheme() {
  document.body.classList.toggle("light-mode")
  document.body.classList.toggle("dark-mode")

  // Update theme icon
  const themeIcon = document.querySelector(".theme-toggle i")
  if (themeIcon) {
    themeIcon.textContent = document.body.classList.contains("light-mode") ? "dark_mode" : "light_mode"
  }

  // Save theme preference
  localStorage.setItem("theme", document.body.classList.contains("light-mode") ? "light" : "dark")

  // Update charts for theme
  updateChartsForTheme()
}

// ============================
// Chat Functions
// ============================

function toggleChat() {
  const chatbot = document.createElement("div")
  chatbot.id = "ai-chatbot"
  chatbot.className = "chatbot-container"

  chatbot.innerHTML = `
    <div class="chatbot-header">
      <h3>AI Coach</h3>
      <div class="chatbot-actions">
        <button id="minimize-chat" class="btn-icon"><i class="material-icons">remove</i></button>
        <button id="close-chat" class="btn-icon"><i class="material-icons">close</i></button>
      </div>
    </div>
    <div id="chat-body" class="chatbot-body">
      <div class="chat-message bot">
        <div class="message-avatar">
          <img src="/placeholder.svg?height=40&width=40" alt="AI Coach">
        </div>
        <div class="message-content">
          <p>Hello! I'm your AI fitness coach. How can I help you today?</p>
          <span class="message-time">${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      </div>
    </div>
    <div class="chatbot-suggestions">
      <span class="suggestion-chip">How to improve my form?</span>
      <span class="suggestion-chip">Recommend a workout</span>
      <span class="suggestion-chip">Nutrition advice</span>
    </div>
    <div class="chatbot-input">
      <input type="text" id="chat-input" placeholder="Type your message...">
      <button id="send-chat" class="btn-icon"><i class="material-icons">send</i></button>
    </div>
  `

  // Check if chatbot already exists
  const existingChatbot = document.getElementById("ai-chatbot")
  if (existingChatbot) {
    existingChatbot.remove()
  } else {
    document.body.appendChild(chatbot)

    // Add event listeners
    document.getElementById("close-chat").addEventListener("click", () => {
      chatbot.remove()
    })

    document.getElementById("minimize-chat").addEventListener("click", () => {
      chatbot.classList.toggle("minimized")
    })

    document.getElementById("send-chat").addEventListener("click", sendChatMessage)

    document.getElementById("chat-input").addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        sendChatMessage()
      }
    })

    // Add event listeners to suggestion chips
    document.querySelectorAll(".suggestion-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        document.getElementById("chat-input").value = chip.textContent
        sendChatMessage()
      })
    })
  }
}

function sendChatMessage() {
  const chatInput = document.getElementById("chat-input")
  const chatBody = document.getElementById("chat-body")

  if (!chatInput || !chatBody || !chatInput.value.trim()) return

  const message = chatInput.value.trim()

  // Add user message
  const userMessage = document.createElement("div")
  userMessage.className = "chat-message user"

  const now = new Date()
  const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  userMessage.innerHTML = `
    <div class="message-avatar">
      <img src="/placeholder.svg?height=40&width=40" alt="User">
    </div>
    <div class="message-content">
      <p>${message}</p>
      <span class="message-time">${timeString}</span>
    </div>
  `

  chatBody.appendChild(userMessage)

  // Clear input
  chatInput.value = ""

  // Scroll to bottom
  chatBody.scrollTop = chatBody.scrollHeight

  // Add AI response (simulated)
  setTimeout(() => {
    const aiResponse = getAIResponse(message)

    const botMessage = document.createElement("div")
    botMessage.className = "chat-message bot"

    const responseTime = new Date()
    const responseTimeString = responseTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

    botMessage.innerHTML = `
      <div class="message-avatar">
        <img src="/placeholder.svg?height=40&width=40" alt="AI Coach">
      </div>
      <div class="message-content">
        <p>${aiResponse}</p>
        <span class="message-time">${responseTimeString}</span>
      </div>
    `

    chatBody.appendChild(botMessage)

    // Scroll to bottom
    chatBody.scrollTop = chatBody.scrollHeight
  }, 1000)
}

function getAIResponse(message) {
  message = message.toLowerCase()

  if (message.includes("workout") && message.includes("recommend")) {
    return "Based on your recent activity, I'd recommend trying a HIIT workout today. It will help boost your metabolism and improve cardiovascular health."
  } else if (message.includes("nutrition") || message.includes("diet") || message.includes("eat")) {
    return "For optimal fitness results, focus on a balanced diet with lean proteins, complex carbs, and healthy fats. Try to eat within 30 minutes after your workout to maximize recovery."
  } else if (message.includes("form") || message.includes("technique")) {
    return "Good form is crucial! For most exercises, keep your back straight, engage your core, and move through the full range of motion. Would you like specific advice for a particular exercise?"
  } else if (message.includes("progress") || message.includes("track")) {
    return "You're making great progress! Your workout consistency has improved by 15% this month. Keep it up!"
  } else if (message.includes("hello") || message.includes("hi") || message.includes("hey")) {
    return "Hello! How can I help with your fitness journey today?"
  } else {
    return "I'm here to help with your fitness journey. You can ask me about workout recommendations, nutrition advice, or tracking your progress."
  }
}

// ============================
// Chart Initialization
// ============================

function initCharts() {
  // Check if Plotly is available
  if (typeof Plotly === "undefined") {
    console.error("Plotly is not loaded. Charts will not be rendered.")
    return
  }

  try {
    // Initialize weekly workout chart
    initWeeklyWorkoutChart()

    // Initialize progress chart
    initProgressChart()

    // Initialize trend analysis chart
    initTrendAnalysisChart()
  } catch (error) {
    console.error("Error initializing charts:", error)
  }
}

function initWeeklyWorkoutChart() {
  const chartElement = document.getElementById("weekly-workout-chart")
  if (!chartElement) return

  // Get workout data from localStorage
  const savedWorkouts = JSON.parse(localStorage.getItem("savedWorkouts") || "[]")

  // Create a map of days with workout counts
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const workoutsByDay = days.map((day) => {
    // Count workouts for each day (simplified)
    return savedWorkouts.filter((workout) => {
      if (!workout.date) return false
      const workoutDate = new Date(workout.date)
      const dayName = workoutDate.toLocaleDateString("en-US", { weekday: "short" }).substring(0, 3)
      return dayName === day
    }).length
  })

  // If no data, use sample data
  const yValues = workoutsByDay.some((count) => count > 0) ? workoutsByDay : [1, 0, 1, 1, 0, 1, 1]

  const isDarkMode = document.body.classList.contains("dark-mode")
  const textColor = isDarkMode ? "#e0e0e0" : "#212121"
  const gridColor = isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"

  const data = [
    {
      x: days,
      y: yValues,
      type: "bar",
      marker: {
        color: "#6A1B9A",
        opacity: 0.8,
      },
    },
  ]

  const layout = {
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: {
      color: textColor,
    },
    margin: {
      l: 50,
      r: 30,
      t: 30,
      b: 50,
    },
    xaxis: {
      gridcolor: gridColor,
      zerolinecolor: gridColor,
    },
    yaxis: {
      gridcolor: gridColor,
      zerolinecolor: gridColor,
      dtick: 1,
    },
  }

  const config = {
    responsive: true,
    displayModeBar: false,
  }

  Plotly.newPlot(chartElement, data, layout, config)
}

function initProgressChart() {
  const chartElement = document.getElementById("progress-chart")
  if (!chartElement) return

  // Get workout data from localStorage
  const savedWorkouts = JSON.parse(localStorage.getItem("savedWorkouts") || "[]")

  // Group workouts by week
  const workoutsByWeek = {}
  const currentDate = new Date()

  // Process real data if available
  if (savedWorkouts.length > 0) {
    savedWorkouts.forEach((workout) => {
      if (!workout.date) return

      const workoutDate = new Date(workout.date)
      const weekDiff = Math.floor((currentDate - workoutDate) / (7 * 24 * 60 * 60 * 1000))
      const weekLabel = weekDiff <= 3 ? `Week ${4 - weekDiff}` : "Earlier"

      if (!workoutsByWeek[weekLabel]) {
        workoutsByWeek[weekLabel] = 0
      }

      // Add workout duration in minutes
      const duration = workout.duration || 30
      workoutsByWeek[weekLabel] += duration
    })
  }

  // If no data, use sample data
  let weeks = Object.keys(workoutsByWeek)
  let durations = weeks.map((week) => workoutsByWeek[week])

  if (weeks.length === 0) {
    weeks = ["Week 1", "Week 2", "Week 3", "Week 4"]
    durations = [200, 250, 180, 300]
  }

  const isDarkMode = document.body.classList.contains("dark-mode")
  const textColor = isDarkMode ? "#e0e0e0" : "#212121"
  const gridColor = isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"

  const data = [
    {
      x: weeks,
      y: durations,
      type: "scatter",
      mode: "lines+markers",
      line: {
        color: "#FF6F00",
        width: 3,
      },
      marker: {
        color: "#FF6F00",
        size: 8,
      },
    },
  ]

  const layout = {
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: {
      color: textColor,
    },
    margin: {
      l: 50,
      r: 30,
      t: 30,
      b: 50,
    },
    xaxis: {
      gridcolor: gridColor,
      zerolinecolor: gridColor,
    },
    yaxis: {
      gridcolor: gridColor,
      zerolinecolor: gridColor,
    },
  }

  const config = {
    responsive: true,
    displayModeBar: false,
  }

  Plotly.newPlot(chartElement, data, layout, config)
}

function initTrendAnalysisChart() {
  const chartElement = document.getElementById("trend-analysis-chart")
  if (!chartElement) return

  // Get workout data from localStorage
  const savedWorkouts = JSON.parse(localStorage.getItem("savedWorkouts") || "[]")

  // If no data, use sample data
  if (savedWorkouts.length < 5) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May"]
    const weights = [75, 74, 73, 72, 71]
    const bodyFat = [20, 19, 18, 17, 16]

    const isDarkMode = document.body.classList.contains("dark-mode")
    const textColor = isDarkMode ? "#e0e0e0" : "#212121"
    const gridColor = isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"

    const data = [
      {
        x: months,
        y: weights,
        type: "scatter",
        mode: "lines+markers",
        name: "Weight (kg)",
        line: {
          color: "#6A1B9A",
          width: 3,
        },
        marker: {
          color: "#6A1B9A",
          size: 8,
        },
      },
      {
        x: months,
        y: bodyFat,
        type: "scatter",
        mode: "lines+markers",
        name: "Body Fat %",
        line: {
          color: "#FF6F00",
          width: 3,
        },
        marker: {
          color: "#FF6F00",
          size: 8,
        },
      },
    ]

    const layout = {
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: {
        color: textColor,
      },
      legend: {
        orientation: "h",
        y: 1.1,
      },
      margin: {
        l: 50,
        r: 30,
        t: 30,
        b: 50,
      },
      xaxis: {
        gridcolor: gridColor,
        zerolinecolor: gridColor,
      },
      yaxis: {
        gridcolor: gridColor,
        zerolinecolor: gridColor,
      },
    }

    const config = {
      responsive: true,
      displayModeBar: false,
    }

    Plotly.newPlot(chartElement, data, layout, config)
  } else {
    // Process real workout data
    // This would require more complex processing of your actual data
    console.log("Real trend analysis would be implemented here with actual workout data")
  }
}

function updateChartData(chartId, period) {
  // This function would update the chart data based on the selected period
  // For now, we'll just log the action
  console.log(`Updating chart ${chartId} with period: ${period}`)

  // In a real implementation, you would fetch data for the selected period
  // and update the chart using Plotly.react()
}

function updateProgressChart(chartType) {
  // This function would update the progress chart based on the selected type
  // For now, we'll just log the action
  console.log(`Updating progress chart to show: ${chartType}`)

  // In a real implementation, you would fetch data for the selected chart type
  // and update the chart using Plotly.react()
}

function updateChartsForTheme() {
  // Update all charts based on current theme
  const isDarkMode = document.body.classList.contains("dark-mode")
  const textColor = isDarkMode ? "#e0e0e0" : "#212121"
  const gridColor = isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"

  const chartIds = ["weekly-workout-chart", "progress-chart", "trend-analysis-chart"]

  chartIds.forEach((id) => {
    const chart = document.getElementById(id)
    if (chart && typeof Plotly !== "undefined") {
      Plotly.relayout(chart, {
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        font: { color: textColor },
        "xaxis.gridcolor": gridColor,
        "xaxis.zerolinecolor": gridColor,
        "yaxis.gridcolor": gridColor,
        "yaxis.zerolinecolor": gridColor,
      })
    }
  })
}

// ============================
// Dynamic Content Rendering
// ============================

function renderDynamicContent() {
  // Load user data
  loadUserData()

  // Load workout data
  loadWorkoutData()

  // Load challenge data
  loadChallengeData()

  // Update progress analytics
  updateProgressAnalyticsFunc()

  // Update nutrition & hydration
  updateNutritionHydrationFunc()
}

function loadUserData() {
  // Get user data from localStorage
  const user = JSON.parse(localStorage.getItem("loggedInUser") || '{"name": "Guest"}')

  // Update user name in header
  const userNameElement = document.querySelector(".user-name")
  if (userNameElement) {
    userNameElement.textContent = user.name
  }
}

function loadWorkoutData() {
  // Get workout data from localStorage
  const savedWorkouts = JSON.parse(localStorage.getItem("savedWorkouts") || "[]")

  // Update stats cards
  updateStatsCards(savedWorkouts)

  // Populate "My Workouts" section
  populateMyWorkoutsSection(savedWorkouts)

  // Populate workout history
  populateWorkoutHistoryFunc(savedWorkouts)
}

function updateStatsCards(workouts) {
  // Calculate total workouts
  const totalWorkouts = workouts.length
  const totalWorkoutsElement = document.querySelector(".stats-grid .stat-card:nth-child(1) .stat-value")
  if (totalWorkoutsElement) {
    totalWorkoutsElement.textContent = totalWorkouts
  }

  // Calculate total workout time
  let totalMinutes = 0
  workouts.forEach((workout) => {
    totalMinutes += workout.duration || 0
  })

  const totalHours = Math.floor(totalMinutes / 60)
  const remainingMinutes = totalMinutes % 60

  const workoutTimeElement = document.querySelector(".stats-grid .stat-card:nth-child(2) .stat-value")
  if (workoutTimeElement) {
    workoutTimeElement.textContent = `${totalHours}.${remainingMinutes} hrs`
  }

  // Calculate calories burned
  const totalCalories = workouts.reduce((sum, workout) => sum + (workout.calories || 0), 0)

  const caloriesElement = document.querySelector(".stats-grid .stat-card:nth-child(3) .stat-value")
  if (caloriesElement) {
    caloriesElement.textContent = totalCalories.toLocaleString()
  }

  // Calculate achievements
  const achievementsElement = document.querySelector(".stats-grid .stat-card:nth-child(4) .stat-value")
  if (achievementsElement) {
    // For now, just use a placeholder value
    achievementsElement.textContent = "8"
  }

  // Update dashboard overview stats
  updateDashboardOverview(workouts)
}

function updateDashboardOverview(workouts) {
  // Total Workouts
  const totalWorkoutsElement = document.querySelector(
    "#dashboard-overview .stats-grid .stat-card:nth-child(1) .stat-value",
  )
  if (totalWorkoutsElement) {
    totalWorkoutsElement.textContent = workouts.length
  }

  // This Week's Workouts
  const thisWeek = getThisWeekWorkouts(workouts)
  const thisWeekElement = document.querySelector("#dashboard-overview .stats-grid .stat-card:nth-child(2) .stat-value")
  if (thisWeekElement) {
    thisWeekElement.textContent = thisWeek.length
  }

  // Total Time
  let totalMinutes = 0
  workouts.forEach((workout) => {
    totalMinutes += workout.duration || 0
  })

  const totalHours = Math.floor(totalMinutes / 60)
  const remainingMinutes = totalMinutes % 60

  const totalTimeElement = document.querySelector("#dashboard-overview .stats-grid .stat-card:nth-child(3) .stat-value")
  if (totalTimeElement) {
    totalTimeElement.textContent = `${totalHours} hrs ${remainingMinutes} min`
  }

  // Calories Burned
  const totalCalories = workouts.reduce((sum, workout) => sum + (workout.calories || 0), 0)

  const caloriesElement = document.querySelector("#dashboard-overview .stats-grid .stat-card:nth-child(4) .stat-value")
  if (caloriesElement) {
    caloriesElement.textContent = `${totalCalories.toLocaleString()} kcal`
  }
}

function getThisWeekWorkouts(workouts) {
  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay()) // Start of week (Sunday)
  startOfWeek.setHours(0, 0, 0, 0)

  return workouts.filter((workout) => {
    if (!workout.date) return false
    const workoutDate = new Date(workout.date)
    return workoutDate >= startOfWeek
  })
}

function populateMyWorkoutsSection(workouts) {
  const container = document.querySelector(".workouts-container")
  if (!container) return

  // Clear container
  container.innerHTML = ""

  if (workouts.length === 0) {
    // If no workouts, show empty state
    container.innerHTML = `
      <div class="empty-state">
        <p>No workouts created yet. Create your first workout to get started!</p>
        <button class="btn btn-primary" id="create-workout-btn">
          <i class="material-icons btn-icon">add</i> Create Workout
        </button>
      </div>
    `

    // Add event listener to the create workout button
    const createWorkoutBtn = document.getElementById("create-workout-btn")
    if (createWorkoutBtn) {
      createWorkoutBtn.addEventListener("click", () => {
        window.location.href = "workout-planner.html"
      })
    }

    return
  }

  // Show the most recent 3 workouts
  const recentWorkouts = [...workouts]
    .sort((a, b) => {
      return new Date(b.date || 0) - new Date(a.date || 0)
    })
    .slice(0, 3)

  recentWorkouts.forEach((workout, index) => {
    const card = document.createElement("div")
    card.className = "workout-card"

    const workoutDate = workout.date ? new Date(workout.date).toLocaleDateString() : "N/A"
    const exerciseCount = workout.exercises ? workout.exercises.length : 0

    card.innerHTML = `
      <h2>${workout.name || "Unnamed Workout"}</h2>
      <p><strong>Date:</strong> ${workoutDate} | <strong>Exercises:</strong> ${exerciseCount}</p>
      <div class="workout-actions">
        <button class="btn btn-secondary edit-btn" data-index="${index}">Edit</button>
        <button class="btn btn-secondary delete-btn" data-index="${index}">Delete</button>
        <button class="btn btn-primary start-btn" data-index="${index}">Start</button>
      </div>
    `

    container.appendChild(card)
  })

  // Add event listeners to buttons
  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const index = this.getAttribute("data-index")
      editWorkoutSection(index)
    })
  })

  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const index = this.getAttribute("data-index")
      deleteWorkoutSection(index)
    })
  })

  document.querySelectorAll(".start-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const index = this.getAttribute("data-index")
      startWorkoutSection(index)
    })
  })
}

function editWorkoutSection(index) {
  // Redirect to workout planner with the workout index
  window.location.href = `workout-planner.html?edit=${index}`
}

function deleteWorkoutSection(index) {
  // Confirm deletion
  if (!confirm("Are you sure you want to delete this workout?")) return

  // Get saved workouts
  const savedWorkouts = JSON.parse(localStorage.getItem("savedWorkouts") || "[]")

  // Remove the workout at the specified index
  savedWorkouts.splice(index, 1)

  // Save the updated workouts
  localStorage.setItem("savedWorkouts", JSON.stringify(savedWorkouts))

  // Reload the page to reflect changes
  location.reload()
}

function startWorkoutSection(index) {
  // Get saved workouts
  const savedWorkouts = JSON.parse(localStorage.getItem("savedWorkouts") || "[]")

  // Get the workout at the specified index
  const workout = savedWorkouts[index]

  if (!workout) return

  // Set as current workout
  localStorage.setItem("currentWorkout", JSON.stringify(workout))

  // Redirect to workout session
  window.location.href = "workout-session.html"
}

function populateWorkoutHistoryFunc(workouts) {
  const tbody = document.querySelector(".history-table tbody")
  if (!tbody) return

  // Clear table body
  tbody.innerHTML = ""

  if (workouts.length === 0) {
    // If no workouts, add a message row
    const row = document.createElement("tr")
    row.innerHTML = `
      <td colspan="5" style="text-align: center;">No workout history available</td>
    `
    tbody.appendChild(row)
    return
  }

  // Sort workouts by date (newest first)
  const sortedWorkouts = [...workouts].sort((a, b) => {
    return new Date(b.date || 0) - new Date(a.date || 0)
  })

  // Add each workout as a row (limit to 5 for UI)
  sortedWorkouts.slice(0, 5).forEach((workout) => {
    const workoutDate = workout.date ? new Date(workout.date).toLocaleDateString() : "N/A"

    const row = document.createElement("tr")
    row.innerHTML = `
      <td>${workoutDate}</td>
      <td>${workout.name || "Unnamed Workout"}</td>
      <td>${workout.duration || "N/A"} min</td>
      <td>${workout.calories || "N/A"} kcal</td>
      <td>${workout.feedback || ""}</td>
    `

    tbody.appendChild(row)
  })
}

function loadChallengeData() {
  // Get challenge data from localStorage
  const activeChallenges = JSON.parse(localStorage.getItem("activeChallenges") || "[]")
  const completedRewards = JSON.parse(localStorage.getItem("completedRewards") || "[]")

  // Populate challenges
  populateChallenges(activeChallenges)

  // Populate rewards
  populateRewards(completedRewards)
}

function populateChallenges(challenges) {
  const container = document.querySelector(".challenge-overview")
  if (!container) return

  // Clear container
  container.innerHTML = ""

  if (challenges.length === 0) {
    // If no challenges, create default ones
    const defaultChallenges = [
      {
        id: 1,
        title: "Workout 5 Days This Week",
        description: "Complete at least one workout on 5 different days this week.",
        progress: 3,
        target: 5,
        reward: "Badge: Consistency",
      },
      {
        id: 2,
        title: "10 Chest Workouts",
        description: "Perform at least 10 chest workouts this week.",
        progress: 4,
        target: 10,
        reward: "Badge: Chest Champion",
      },
      {
        id: 3,
        title: "Cardio Challenge",
        description: "Complete 30 minutes of cardio in one session.",
        progress: 0,
        target: 30,
        reward: "Badge: Cardio Master",
      },
    ]

    // Save default challenges
    localStorage.setItem("activeChallenges", JSON.stringify(defaultChallenges))

    // Use default challenges
    challenges = defaultChallenges
  }

  // Add each challenge as a card
  challenges.forEach((challenge) => {
    const card = document.createElement("div")
    card.className = "challenge-card"

    // Calculate progress percentage
    const progressPercent = Math.min(100, Math.round((challenge.progress / challenge.target) * 100))

    card.innerHTML = `
      <div class="challenge-header">
        <div class="challenge-icon"><i class="material-icons">fitness_center</i></div>
        <div class="challenge-title-reward">
          <h3>${challenge.title}</h3>
          <p class="reward">${challenge.reward}</p>
        </div>
        <div class="challenge-progress">${challenge.progress}/${challenge.target}</div>
        <div class="challenge-toggle"><i class="material-icons">expand_more</i></div>
      </div>
      <div class="challenge-details">
        <p>${challenge.description}</p>
        <div class="challenge-progress-bar">
          <div class="progress-bar" style="width: ${progressPercent}%"></div>
        </div>
        <button class="btn-primary complete-challenge" data-id="${challenge.id}">
          <i class="material-icons">check</i> Mark as Complete
        </button>
      </div>
    `

    container.appendChild(card)
  })

  // Add event listeners to challenge cards
  setupChallengeCards()

  // Add event listeners to complete buttons
  document.querySelectorAll(".complete-challenge").forEach((btn) => {
    btn.addEventListener("click", function () {
      const id = this.getAttribute("data-id")
      completeChallenge(id)
    })
  })
}

function completeChallenge(id) {
  // Get active challenges
  const activeChallenges = JSON.parse(localStorage.getItem("activeChallenges") || "[]")

  // Find the challenge with the specified id
  const challenge = activeChallenges.find((c) => c.id == id)

  if (!challenge) return

  // Mark as completed
  challenge.progress = challenge.target

  // Save the updated challenges
  localStorage.setItem("activeChallenges", JSON.stringify(activeChallenges))

  // Add to completed rewards
  const completedRewards = JSON.parse(localStorage.getItem("completedRewards") || "[]")
  completedRewards.push(challenge)
  localStorage.setItem("completedRewards", JSON.stringify(completedRewards))

  // Show success message
  alert(`Challenge "${challenge.title}" completed! You earned: ${challenge.reward}`)

  // Reload the page to reflect changes
  location.reload()
}

function populateRewards(rewards) {
  const container = document.querySelector(".rewards")
  if (!container) return

  // Clear container
  container.innerHTML = ""

  if (rewards.length === 0) {
    // If no rewards, show message
    container.innerHTML = `
      <p>No rewards earned yet. Complete challenges to earn badges!</p>
    `
    return
  }

  // Array of badge icon names (Material Icons) for rewards
  const badgeIcons = [
    "emoji_events",
    "star",
    "military_tech",
    "verified",
    "workspace_premium",
    "thumb_up",
    "whatshot",
    "local_fire_department",
    "grade",
    "emoji_emotions",
  ]

  // Display rewards (limit to 5 for UI)
  const displayRewards = rewards.slice(0, 5)

  displayRewards.forEach((reward) => {
    const iconIndex = Number.parseInt(reward.id, 10) % badgeIcons.length
    const iconName = badgeIcons[iconIndex]

    const rewardCard = document.createElement("div")
    rewardCard.className = "reward-card"
    rewardCard.innerHTML = `
      <div class="reward-icon"><i class="material-icons">${iconName}</i></div>
      <h4>${reward.reward.replace("Badge: ", "")}</h4>
      <p>${reward.title} completed!</p>
    `

    container.appendChild(rewardCard)
  })

  // Add "View All" button if there are more than 5 rewards
  if (rewards.length > 5) {
    const viewAllBtn = document.createElement("button")
    viewAllBtn.className = "btn btn-secondary"
    viewAllBtn.textContent = "View All Rewards"
    viewAllBtn.addEventListener("click", showAllRewards)

    container.appendChild(viewAllBtn)
  }
}

function showAllRewards() {
  // Get all rewards
  const rewards = JSON.parse(localStorage.getItem("completedRewards") || "[]")

  // Create a modal to display all rewards
  const modal = document.createElement("div")
  modal.className = "modal"
  modal.id = "rewards-modal"

  // Array of badge icon names (Material Icons) for rewards
  const badgeIcons = [
    "emoji_events",
    "star",
    "military_tech",
    "verified",
    "workspace_premium",
    "thumb_up",
    "whatshot",
    "local_fire_department",
    "grade",
    "emoji_emotions",
  ]

  // Create modal content
  modal.innerHTML = `
    <div class="modal-content">
      <span class="modal-close">&times;</span>
      <h3>All Earned Rewards</h3>
      <div class="rewards-grid">
        ${rewards
          .map((reward) => {
            const iconIndex = Number.parseInt(reward.id, 10) % badgeIcons.length
            const iconName = badgeIcons[iconIndex]

            return `
            <div class="reward-card">
              <div class="reward-icon"><i class="material-icons">${iconName}</i></div>
              <h4>${reward.reward.replace("Badge: ", "")}</h4>
              <p>${reward.title} completed!</p>
            </div>
          `
          })
          .join("")}
      </div>
    </div>
  `

  // Add modal to the page
  document.body.appendChild(modal)

  // Show the modal
  modal.classList.add("active")

  // Add event listener to close button
  const closeBtn = modal.querySelector(".modal-close")
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.classList.remove("active")
      setTimeout(() => {
        modal.remove()
      }, 300)
    })
  }

  // Close modal when clicking outside content
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("active")
      setTimeout(() => {
        modal.remove()
      }, 300)
    }
  })
}

function updateProgressAnalyticsFunc() {
  // Get workout data from localStorage
  const savedWorkouts = JSON.parse(localStorage.getItem("savedWorkouts") || "[]")

  if (savedWorkouts.length === 0) return

  // Calculate metrics
  let totalMinutes = 0
  let totalCalories = 0
  const workoutDays = new Set()

  savedWorkouts.forEach((workout) => {
    if (workout.date) {
      const date = new Date(workout.date)
      workoutDays.add(date.toISOString().split("T")[0])
    }

    totalMinutes += workout.duration || 0
    totalCalories += workout.calories || 0
  })

  // Calculate average duration
  const avgDuration = Math.round(totalMinutes / savedWorkouts.length)

  // Calculate weekly consistency (workouts in the last 7 days)
  const today = new Date()
  const lastWeek = new Date(today)
  lastWeek.setDate(today.getDate() - 7)

  let daysWorkedOutLastWeek = 0
  workoutDays.forEach((day) => {
    const date = new Date(day)
    if (date >= lastWeek && date <= today) {
      daysWorkedOutLastWeek++
    }
  })

  // Update the UI
  const durationElement = document.querySelector(".progress-metrics .metric-card:nth-child(1) .metric-value")
  const consistencyElement = document.querySelector(".progress-metrics .metric-card:nth-child(2) .metric-value")
  const caloriesElement = document.querySelector(".progress-metrics .metric-card:nth-child(3) .metric-value")

  if (durationElement) durationElement.textContent = `${avgDuration} min`
  if (consistencyElement) consistencyElement.textContent = `${daysWorkedOutLastWeek}/7 days`
  if (caloriesElement) caloriesElement.textContent = `${totalCalories.toLocaleString()} kcal`

  // Update progress bars
  const durationBar = document.querySelector(".progress-metrics .metric-card:nth-child(1) .progress-bar")
  const consistencyBar = document.querySelector(".progress-metrics .metric-card:nth-child(2) .progress-bar")
  const caloriesBar = document.querySelector(".progress-metrics .metric-card:nth-child(3) .progress-bar")

  // Calculate percentages (based on targets)
  const durationTarget = 60 // 60 minutes target
  const durationPercentage = Math.min(100, Math.round((avgDuration / durationTarget) * 100))

  const consistencyPercentage = Math.round((daysWorkedOutLastWeek / 7) * 100)

  const caloriesTarget = 5000 // 5,000 calories target
  const caloriesPercentage = Math.min(100, Math.round((totalCalories / caloriesTarget) * 100))

  // Update progress bars
  if (durationBar) durationBar.style.width = `${durationPercentage}%`
  if (consistencyBar) consistencyBar.style.width = `${consistencyPercentage}%`
  if (caloriesBar) caloriesBar.style.width = `${caloriesPercentage}%`
}

function updateNutritionHydrationFunc() {
  // For now, just use placeholder data
  const nutritionAdvice = document.querySelector("#nutrition-hydration .nutrition-advice p")
  const mealTracking = document.querySelector("#nutrition-hydration .meal-tracking p")
  const hydrationAlerts = document.querySelector("#nutrition-hydration .hydration-alerts p")

  if (nutritionAdvice) {
    nutritionAdvice.textContent =
      "Focus on protein intake after your strength workouts. Aim for 1.6-2.2g per kg of bodyweight daily."
  }

  if (mealTracking) {
    mealTracking.textContent = "Try: Grilled Chicken Quinoa Bowl with Avocado"
  }

  if (hydrationAlerts) {
    hydrationAlerts.textContent = "You're 2 glasses behind your water goal today. Aim for at least 2 liters total."
  }
}
