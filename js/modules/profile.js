// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js"
import {
  getAuth,
  onAuthStateChanged,
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js"
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js"
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js"

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

// Initialize Firebase and services
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)

// Global variables
let currentUser = null

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
  initializeUI()
})

// Auth state observer
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user
    console.log("User is signed in:", user.uid)
    loadUserProfile(user)
    showLoggedInView()
  } else {
    currentUser = null
    console.log("User is signed out")
    showGuestView()
  }
})

/**
 * Initialize UI components
 */
function initializeUI() {
  // Tab navigation
  const tabLinks = document.querySelectorAll('.profile-nav-link')
  const tabContents = document.querySelectorAll('.profile-tab-content')
  
  tabLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault()
      const tabId = this.getAttribute('data-tab')
      
      // Update active tab link
      tabLinks.forEach(l => l.classList.remove('active'))
      this.classList.add('active')
      
      // Show active tab content
      tabContents.forEach(content => {
        if (content.id === tabId) {
          content.classList.add('active')
        } else {
          content.classList.remove('active')
        }
      })
      
      // Update URL hash
      window.location.hash = tabId
    })
  })
  
  // Check for URL hash on page load
  if (window.location.hash) {
    const hash = window.location.hash.substring(1)
    const tabLink = document.querySelector(`.profile-nav-link[data-tab="${hash}"]`)
    if (tabLink) {
      tabLink.click()
    }
  }
  
  // Modal handling
  initializeModals()
  
  // Password visibility toggles
  initializePasswordToggles()
  
  // Profile image upload
  initializeProfileImageUpload()
  
  // Form handlers
  initializeFormHandlers()
  
  // Chat functionality
  initializeChatbot()
}

/**
 * Initialize modal functionality
 */
function initializeModals() {
  const modals = document.querySelectorAll('.modal')
  const modalCloseButtons = document.querySelectorAll('.modal-close')
  
  // Open add goal modal
  const addGoalBtn = document.getElementById('add-goal-btn')
  const goalModal = document.getElementById('goal-modal')
  
  if (addGoalBtn && goalModal) {
    addGoalBtn.addEventListener('click', function() {
      goalModal.style.display = 'flex'
      document.body.style.overflow = 'hidden'
    })
  }
  
  // Open delete account modal
  const deleteAccountBtn = document.getElementById('delete-account-btn')
  const deleteAccountModal = document.getElementById('delete-account-modal')
  
  if (deleteAccountBtn && deleteAccountModal) {
    deleteAccountBtn.addEventListener('click', function() {
      deleteAccountModal.style.display = 'flex'
      document.body.style.overflow = 'hidden'
    })
  }
  
  // Close modal buttons
  modalCloseButtons.forEach(button => {
    button.addEventListener('click', function() {
      const modal = this.closest('.modal')
      if (modal) {
        modal.style.display = 'none'
        document.body.style.overflow = ''
      }
    })
  })
  
  // Close modal when clicking outside
  modals.forEach(modal => {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.style.display = 'none'
        document.body.style.overflow = ''
      }
    })
  })
  
  // Close modal on ESC key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      modals.forEach(modal => {
        if (modal.style.display === 'flex') {
          modal.style.display = 'none'
          document.body.style.overflow = ''
        }
      })
    }
  })
}

/**
 * Initialize password visibility toggles
 */
function initializePasswordToggles() {
  const toggleButtons = document.querySelectorAll('.toggle-password')
  
  toggleButtons.forEach(button => {
    button.addEventListener('click', function() {
      const inputId = this.getAttribute('data-for')
      const input = document.getElementById(inputId)
      
      if (input) {
        if (input.type === 'password') {
          input.type = 'text'
          this.textContent = 'visibility'
        } else {
          input.type = 'password'
          this.textContent = 'visibility_off'
        }
      }
    })
  })
}

/**
 * Initialize profile image upload
 */
function initializeProfileImageUpload() {
  const avatarUploadBtn = document.getElementById('avatar-upload-btn')
  const profileImage = document.getElementById('profile-image')
  
  if (avatarUploadBtn) {
    avatarUploadBtn.addEventListener('click', handleProfileImageUpload)
  }
  
  if (profileImage) {
    profileImage.addEventListener('click', handleProfileImageUpload)
  }
}

/**
 * Handle profile image upload
 */
async function handleProfileImageUpload() {
  if (!currentUser) {
    showMessage('Please log in to upload a profile image', 'error')
    return
  }
  
  // Create hidden file input
  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.accept = 'image/*'
  fileInput.style.display = 'none'
  document.body.appendChild(fileInput)
  
  // Trigger click on file input
  fileInput.click()
  
  // Handle file selection
  fileInput.addEventListener('change', async (e) => {
    if (fileInput.files.length === 0) {
      document.body.removeChild(fileInput)
      return
    }
    
    try {
      const file = fileInput.files[0]
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showMessage('Image size must be less than 5MB', 'error')
        return
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showMessage('Please select a valid image file', 'error')
        return
      }
      
      // Show loading state
      const profileImage = document.getElementById('profile-image')
      const headerAvatar = document.getElementById('header-avatar')
      
      if (profileImage) profileImage.style.opacity = '0.5'
      if (headerAvatar) headerAvatar.style.opacity = '0.5'
      
      showMessage('Uploading profile image...', 'info')
      
      // Upload file to Firebase Storage
      const storageRef = ref(storage, `profile_images/${currentUser.uid}`)
      await uploadBytes(storageRef, file)
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef)
      
      // Update user profile
      await updateProfile(currentUser, {
        photoURL: downloadURL,
      })
      
      // Update profile images in UI
      if (profileImage) {
        profileImage.src = downloadURL
        profileImage.style.opacity = '1'
      }
      if (headerAvatar) {
        headerAvatar.src = downloadURL
        headerAvatar.style.opacity = '1'
      }
      
      // Show success message
      showMessage('Profile image updated successfully!', 'success')
    } catch (error) {
      console.error('Error uploading profile image:', error)
      showMessage('Error uploading profile image: ' + error.message, 'error')
      
      // Reset opacity
      const profileImage = document.getElementById('profile-image')
      const headerAvatar = document.getElementById('header-avatar')
      if (profileImage) profileImage.style.opacity = '1'
      if (headerAvatar) headerAvatar.style.opacity = '1'
    } finally {
      // Remove file input
      document.body.removeChild(fileInput)
    }
  })
}

/**
 * Initialize form handlers
 */
function initializeFormHandlers() {
  // Personal info form
  const personalInfoForm = document.getElementById('personal-info-form')
  if (personalInfoForm) {
    personalInfoForm.addEventListener('submit', handlePersonalInfoSubmit)
  }
  
  // Change password form
  const changePasswordForm = document.getElementById('change-password-form')
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', handlePasswordChangeSubmit)
  }
  
  // Notification settings form
  const notificationForm = document.getElementById('notification-settings-form')
  if (notificationForm) {
    notificationForm.addEventListener('submit', handleNotificationSettingsSubmit)
  }
  
  // Add goal form
  const saveGoalBtn = document.getElementById('save-goal-btn')
  if (saveGoalBtn) {
    saveGoalBtn.addEventListener('click', handleAddGoal)
  }
  
  // Delete account
  const confirmDeleteBtn = document.getElementById('confirm-delete-btn')
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', handleDeleteAccount)
  }
  
  // Logout button
  const logoutBtn = document.getElementById('logout-btn')
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout)
  }
  
  // Header logout button
  const headerLogoutBtn = document.getElementById('header-logout-btn')
  if (headerLogoutBtn) {
    headerLogoutBtn.addEventListener('click', handleLogout)
  }
}

/**
 * Initialize chatbot functionality
 */
function initializeChatbot() {
  const chatToggle = document.getElementById('chat-toggle')
  const chatbot = document.getElementById('ai-chatbot')
  const closeChat = document.getElementById('close-chat')
  const sendChat = document.getElementById('send-chat')
  const chatInput = document.getElementById('chat-input')
  
  if (chatToggle && chatbot) {
    chatToggle.addEventListener('click', function() {
      chatbot.classList.toggle('hidden')
    })
  }
  
  if (closeChat && chatbot) {
    closeChat.addEventListener('click', function() {
      chatbot.classList.add('hidden')
    })
  }
  
  if (sendChat && chatInput) {
    sendChat.addEventListener('click', sendChatMessage)
    chatInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        sendChatMessage()
      }
    })
  }
}

/**
 * Send chat message
 */
function sendChatMessage() {
  const chatInput = document.getElementById('chat-input')
  const chatBody = document.getElementById('chat-body')
  
  if (!chatInput || !chatBody) return
  
  const message = chatInput.value.trim()
  if (!message) return
  
  // Add user message
  const userMessage = document.createElement('div')
  userMessage.className = 'chat-message user'
  userMessage.textContent = message
  chatBody.appendChild(userMessage)
  
  // Clear input
  chatInput.value = ''
  
  // Simulate bot response
  setTimeout(() => {
    const botMessage = document.createElement('div')
    botMessage.className = 'chat-message bot'
    botMessage.textContent = 'Thanks for your message! This is a demo chatbot. Full AI functionality will be available soon.'
    chatBody.appendChild(botMessage)
    
    // Scroll to bottom
    chatBody.scrollTop = chatBody.scrollHeight
  }, 1000)
  
  // Scroll to bottom
  chatBody.scrollTop = chatBody.scrollHeight
}

/**
 * Show the logged-in user view
 */
function showLoggedInView() {
  const guestProfile = document.getElementById('guest-profile')
  const userProfile = document.getElementById('user-profile')
  
  if (guestProfile) guestProfile.style.display = 'none'
  if (userProfile) userProfile.style.display = 'grid'
}

/**
 * Show the guest user view
 */
function showGuestView() {
  const guestProfile = document.getElementById('guest-profile')
  const userProfile = document.getElementById('user-profile')
  
  if (guestProfile) guestProfile.style.display = 'block'
  if (userProfile) userProfile.style.display = 'none'
}

/**
 * Load user profile data
 */
async function loadUserProfile(user) {
  try {
    // Update basic profile information
    updateBasicProfileInfo(user)
    
    // Get additional user data from Firestore
    const userDocRef = doc(db, 'users', user.uid)
    const userDoc = await getDoc(userDocRef)
    
    if (userDoc.exists()) {
      const userData = userDoc.data()
      
      // Load fitness profile
      loadFitnessProfile(userData)
      
      // Load workout stats
      loadWorkoutStats(user.uid)
      
      // Load form fields in settings tab
      loadSettingsFormData(userData)
    } else {
      console.log('User document does not exist. Creating one.')
      
      // Create a basic user document if it doesn't exist
      await setDoc(userDocRef, {
        fullName: user.displayName || 'User',
        email: user.email,
        createdAt: serverTimestamp(),
        lastUpdatedAt: serverTimestamp(),
      })
    }
    
    // Load recent activity
    loadRecentActivity(user.uid)
  } catch (error) {
    console.error('Error loading user profile:', error)
    showMessage('Failed to load profile data. Please try again later.', 'error')
  }
}

/**
 * Update basic profile information
 */
function updateBasicProfileInfo(user) {
  const profileName = document.getElementById('profile-name')
  const profileEmail = document.getElementById('profile-email')
  const profileImage = document.getElementById('profile-image')
  const headerAvatar = document.getElementById('header-avatar')
  const headerUsername = document.getElementById('header-username')
  
  if (profileName) profileName.textContent = user.displayName || 'User'
  if (profileEmail) profileEmail.textContent = user.email
  if (headerUsername) headerUsername.textContent = user.displayName || 'User'
  
  // Set profile images if available
  if (user.photoURL) {
    if (profileImage) profileImage.src = user.photoURL
    if (headerAvatar) headerAvatar.src = user.photoURL
  }
}

/**
 * Load fitness profile data
 */
function loadFitnessProfile(userData) {
  const fitnessProfileContainer = document.getElementById('fitness-profile-data')
  if (!fitnessProfileContainer) return
  
  if (!userData.weight && !userData.height && !userData.fitnessLevel) {
    fitnessProfileContainer.innerHTML = `
      <p class="text-center">No fitness profile data available. Update your profile in the settings tab.</p>
    `
    return
  }
  
  // Calculate BMI if weight and height are available
  let bmi = ''
  if (userData.weight && userData.height) {
    const bmiValue = (userData.weight / Math.pow(userData.height / 100, 2)).toFixed(1)
    let bmiCategory = ''
    
    if (bmiValue < 18.5) bmiCategory = 'Underweight'
    else if (bmiValue < 25) bmiCategory = 'Normal weight'
    else if (bmiValue < 30) bmiCategory = 'Overweight'
    else bmiCategory = 'Obese'
    
    bmi = `<div class="fitness-stat">
      <div class="fitness-stat-label">BMI</div>
      <div class="fitness-stat-value">${bmiValue}</div>
      <div class="fitness-stat-description">${bmiCategory}</div>
    </div>`
  }
  
  // Build HTML for fitness profile
  fitnessProfileContainer.innerHTML = `
    <div class="fitness-profile-grid">
      ${userData.weight ? `
        <div class="fitness-stat">
          <div class="fitness-stat-label">Weight</div>
          <div class="fitness-stat-value">${userData.weight} kg</div>
        </div>
      ` : ''}
      
      ${userData.height ? `
        <div class="fitness-stat">
          <div class="fitness-stat-label">Height</div>
          <div class="fitness-stat-value">${userData.height} cm</div>
        </div>
      ` : ''}
      
      ${bmi}
      
      ${userData.fitnessLevel ? `
        <div class="fitness-stat">
          <div class="fitness-stat-label">Fitness Level</div>
          <div class="fitness-stat-value">${capitalizeFirstLetter(userData.fitnessLevel)}</div>
        </div>
      ` : ''}
      
      ${userData.activityLevel ? `
        <div class="fitness-stat">
          <div class="fitness-stat-label">Activity Level</div>
          <div class="fitness-stat-value">${formatActivityLevel(userData.activityLevel)}</div>
        </div>
      ` : ''}
    </div>
    
    ${userData.fitnessGoals ? `
      <div class="fitness-goals">
        <h4>Fitness Goals</h4>
        <p>${userData.fitnessGoals}</p>
      </div>
    ` : ''}
  `
}

/**
 * Load workout statistics
 */
async function loadWorkoutStats(userId) {
  try {
    const workoutCount = document.getElementById('workout-count')
    const totalTime = document.getElementById('total-time')
    const caloriesBurned = document.getElementById('calories-burned')
    const currentStreak = document.getElementById('current-streak')
    
    if (!workoutCount || !totalTime || !caloriesBurned || !currentStreak) {
      return
    }
    
    // Query workouts collection to get stats
    const workoutsRef = collection(db, 'workouts')
    const q = query(workoutsRef, where('userId', '==', userId), orderBy('completedAt', 'desc'))
    
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      workoutCount.textContent = '0'
      totalTime.textContent = '0h'
      caloriesBurned.textContent = '0'
      currentStreak.textContent = '0'
      return
    }
    
    // Calculate statistics
    let totalWorkouts = 0
    let totalMinutes = 0
    let totalCalories = 0
    const workoutDates = new Set()
    
    querySnapshot.forEach((doc) => {
      const workout = doc.data()
      totalWorkouts++
      
      if (workout.duration) {
        totalMinutes += workout.duration
      }
      
      if (workout.caloriesBurned) {
        totalCalories += workout.caloriesBurned
      }
      
      if (workout.completedAt) {
        const date = new Date(workout.completedAt.toDate()).toDateString()
        workoutDates.add(date)
      }
    })
    
    // Calculate streak
    const streak = calculateStreak(workoutDates)
    
    // Update UI with stats
    workoutCount.textContent = totalWorkouts
    totalTime.textContent = formatTime(totalMinutes)
    caloriesBurned.textContent = totalCalories
    currentStreak.textContent = streak
    
    // Load workout history
    loadWorkoutHistory(querySnapshot)
  } catch (error) {
    console.error('Error loading workout stats:', error)
  }
}

/**
 * Load recent activity
 */
async function loadRecentActivity(userId) {
  try {
    const activityContainer = document.getElementById('recent-activity-data')
    if (!activityContainer) return
    
    // Query recent workouts
    const workoutsRef = collection(db, 'workouts')
    const workoutsQuery = query(workoutsRef, where('userId', '==', userId), orderBy('completedAt', 'desc'), limit(5))
    
    const workoutsSnapshot = await getDocs(workoutsQuery)
    
    if (workoutsSnapshot.empty) {
      activityContainer.innerHTML = `
        <p class="text-center">No recent activity found. Start a workout to see your activity here!</p>
      `
      return
    }
    
    // Build activity feed
    let activityHTML = '<div class="activity-feed">'
    
    workoutsSnapshot.forEach((doc) => {
      const workout = doc.data()
      const workoutDate = workout.completedAt ? new Date(workout.completedAt.toDate()) : new Date()
      
      activityHTML += `
        <div class="activity-item">
          <div class="activity-icon">
            <i class="material-icons">fitness_center</i>
          </div>
          <div class="activity-content">
            <div class="activity-header">
              <span class="activity-title">${workout.name || 'Workout'}</span>
              <span class="activity-time">${formatTimeAgo(workoutDate)}</span>
            </div>
            <div class="activity-details">
              ${workout.duration ? `<span>${workout.duration} min</span>` : ''}
              ${workout.caloriesBurned ? `<span>${workout.caloriesBurned} calories</span>` : ''}
            </div>
          </div>
        </div>
      `
    })
    
    activityHTML += '</div>'
    activityContainer.innerHTML = activityHTML
  } catch (error) {
    console.error('Error loading recent activity:', error)
  }
}

/**
 * Load workout history
 */
function loadWorkoutHistory(querySnapshot) {
  const historyTableBody = document.getElementById('workout-history')
  
  if (!historyTableBody) return
  
  if (querySnapshot.empty) {
    historyTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center">No workout history found.</td>
      </tr>
    `
    return
  }
  
  // Clear table
  historyTableBody.innerHTML = ''
  
  // Add workout data
  querySnapshot.forEach((doc) => {
    const workout = doc.data()
    const workoutDate = workout.completedAt ? new Date(workout.completedAt.toDate()) : new Date()
    
    const row = document.createElement('tr')
    row.innerHTML = `
      <td>${workoutDate.toLocaleDateString()}</td>
      <td>${workout.name || 'Workout'}</td>
      <td>${workout.duration ? workout.duration + ' min' : '-'}</td>
      <td>${workout.caloriesBurned || '-'}</td>
      <td>
        <button class="action-btn view-workout" data-id="${doc.id}">
          <i class="material-icons">visibility</i>
        </button>
      </td>
    `
    
    historyTableBody.appendChild(row)
  })
  
  // Add event listeners for workout view buttons
  document.querySelectorAll('.view-workout').forEach((button) => {
    button.addEventListener('click', () => {
      const workoutId = button.getAttribute('data-id')
      showMessage(`View workout ${workoutId} - Feature coming soon!`, 'info')
    })
  })
}

/**
 * Load settings form data
 */
function loadSettingsFormData(userData) {
  // Personal info form
  const settingsName = document.getElementById('settings-name')
  const settingsEmail = document.getElementById('settings-email')
  const settingsDob = document.getElementById('settings-dob')
  const settingsGender = document.getElementById('settings-gender')
  const settingsWeight = document.getElementById('settings-weight')
  const settingsHeight = document.getElementById('settings-height')
  
  // Safely set values if elements exist
  if (settingsName) settingsName.value = userData.fullName || ''
  if (settingsEmail) settingsEmail.value = userData.email || ''
  if (settingsDob) settingsDob.value = userData.dob || ''
  if (settingsGender) settingsGender.value = userData.gender || ''
  if (settingsWeight) settingsWeight.value = userData.weight || ''
  if (settingsHeight) settingsHeight.value = userData.height || ''
  
  // Notification settings
  const emailNotifications = document.getElementById('email-notifications')
  const pushNotifications = document.getElementById('push-notifications')
  const workoutReminders = document.getElementById('workout-reminders')
  
  if (emailNotifications) emailNotifications.checked = userData.emailNotifications || false
  if (pushNotifications) pushNotifications.checked = userData.pushNotifications || false
  if (workoutReminders) workoutReminders.checked = userData.workoutReminders || false
}

/* =================================================================
   FORM HANDLERS
   ================================================================= */

/**
 * Handle personal info form submission
 */
async function handlePersonalInfoSubmit(e) {
  e.preventDefault()
  
  if (!currentUser) {
    showMessage('Please log in to update your profile', 'error')
    return
  }
  
  try {
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]')
    const originalBtnText = submitBtn.innerHTML
    submitBtn.disabled = true
    submitBtn.innerHTML = '<i class="material-icons loading">refresh</i> Saving...'
    
    // Get form values
    const fullName = document.getElementById('settings-name').value
    const email = document.getElementById('settings-email').value
    const dob = document.getElementById('settings-dob').value
    const gender = document.getElementById('settings-gender').value
    const weight = parseFloat(document.getElementById('settings-weight').value) || null
    const height = parseFloat(document.getElementById('settings-height').value) || null
    
    // Calculate BMI if weight and height are available
    let bmi = null
    if (weight && height) {
      bmi = weight / Math.pow(height / 100, 2)
    }
    
    // Update Firebase Auth profile
    if (currentUser.displayName !== fullName) {
      await updateProfile(currentUser, { displayName: fullName })
    }
    
    // Update email if changed
    if (currentUser.email !== email) {
      await updateEmail(currentUser, email)
    }
    
    // Update Firestore document
    const userDocRef = doc(db, 'users', currentUser.uid)
    await updateDoc(userDocRef, {
      fullName,
      email,
      dob,
      gender,
      weight,
      height,
      bmi,
      lastUpdatedAt: serverTimestamp(),
    })
    
    // Show success message
    showMessage('Profile updated successfully!', 'success')
    
    // Reset button state
    submitBtn.disabled = false
    submitBtn.innerHTML = originalBtnText
    
    // Reload profile data
    loadUserProfile(currentUser)
  } catch (error) {
    console.error('Error updating profile:', error)
    showMessage('Error updating profile: ' + error.message, 'error')
    
    // Reset button state
    const submitBtn = e.target.querySelector('button[type="submit"]')
    submitBtn.disabled = false
    submitBtn.innerHTML = '<i class="material-icons">save</i> Save Changes'
  }
}

/**
 * Handle password change form submission
 */
async function handlePasswordChangeSubmit(e) {
  e.preventDefault()
  
  if (!currentUser) {
    showMessage('Please log in to change your password', 'error')
    return
  }
  
  // Get form values
  const currentPassword = document.getElementById('current-password').value
  const newPassword = document.getElementById('new-password').value
  const confirmNewPassword = document.getElementById('confirm-new-password').value
  
  // Validate passwords
  if (newPassword !== confirmNewPassword) {
    showMessage('New passwords do not match', 'error')
    return
  }
  
  try {
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]')
    const originalBtnText = submitBtn.innerHTML
    submitBtn.disabled = true
    submitBtn.innerHTML = '<i class="material-icons loading">refresh</i> Updating...'
    
    // Re-authenticate user
    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword)
    await reauthenticateWithCredential(currentUser, credential)
    
    // Update password
    await updatePassword(currentUser, newPassword)
    
    // Show success message
    showMessage('Password updated successfully!', 'success')
    
    // Reset form
    e.target.reset()
    
    // Reset button state
    submitBtn.disabled = false
    submitBtn.innerHTML = originalBtnText
  } catch (error) {
    console.error('Error updating password:', error)
    
    if (error.code === 'auth/wrong-password') {
      showMessage('Incorrect current password', 'error')
    } else if (error.code === 'auth/weak-password') {
      showMessage('New password is too weak', 'error')
    } else {
      showMessage('Error updating password: ' + error.message, 'error')
    }
    
    // Reset button state
    const submitBtn = e.target.querySelector('button[type="submit"]')
    submitBtn.disabled = false
    submitBtn.innerHTML = '<i class="material-icons">lock</i> Update Password'
  }
}

/**
 * Handle notification settings form submission
 */
async function handleNotificationSettingsSubmit(e) {
  e.preventDefault()
  
  if (!currentUser) {
    showMessage('Please log in to update notification settings', 'error')
    return
  }
  
  try {
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]')
    const originalBtnText = submitBtn.innerHTML
    submitBtn.disabled = true
    submitBtn.innerHTML = '<i class="material-icons loading">refresh</i> Saving...'
    
    // Get form values
    const emailNotifications = document.getElementById('email-notifications').checked
    const pushNotifications = document.getElementById('push-notifications').checked
    const workoutReminders = document.getElementById('workout-reminders').checked
    
    // Update Firestore document
    const userDocRef = doc(db, 'users', currentUser.uid)
    await updateDoc(userDocRef, {
      emailNotifications,
      pushNotifications,
      workoutReminders,
      lastUpdatedAt: serverTimestamp(),
    })
    
    // Show success message
    showMessage('Notification preferences updated!', 'success')
    
    // Reset button state
    submitBtn.disabled = false
    submitBtn.innerHTML = originalBtnText
  } catch (error) {
    console.error('Error updating notification settings:', error)
    showMessage('Error updating notification settings: ' + error.message, 'error')
    
    // Reset button state
    const submitBtn = e.target.querySelector('button[type="submit"]')
    submitBtn.disabled = false
    submitBtn.innerHTML = '<i class="material-icons">notifications</i> Save Preferences'
  }
}

/**
 * Handle add goal
 */
async function handleAddGoal() {
  if (!currentUser) {
    showMessage('Please log in to add goals', 'error')
    return
  }
  
  const form = document.getElementById('add-goal-form')
  
  // Get form values
  const goalType = document.getElementById('goal-type').value
  const goalName = document.getElementById('goal-name').value
  const goalTarget = parseFloat(document.getElementById('goal-target').value)
  const goalDeadline = document.getElementById('goal-deadline').value
  const goalDescription = document.getElementById('goal-description').value
  
  // Validate inputs
  if (!goalType || !goalName || !goalTarget || !goalDeadline) {
    showMessage('Please fill all required fields', 'error')
    return
  }
  
  try {
    // Show loading state
    const saveGoalBtn = document.getElementById('save-goal-btn')
    const originalBtnText = saveGoalBtn.textContent
    saveGoalBtn.disabled = true
    saveGoalBtn.innerHTML = '<i class="material-icons loading">refresh</i> Saving...'
    
    // Create goal object
    const goalData = {
      userId: currentUser.uid,
      type: goalType,
      name: goalName,
      target: goalTarget,
      deadline: new Date(goalDeadline),
      description: goalDescription,
      currentValue: 0,
      progress: 0,
      completed: false,
      createdAt: serverTimestamp(),
    }
    
    // Add to Firestore
    const goalsRef = collection(db, 'goals')
    await addDoc(goalsRef, goalData)
    
    // Show success message
    showMessage('Goal added successfully!', 'success')
    
    // Close modal and reset form
    form.reset()
    document.getElementById('goal-modal').style.display = 'none'
    document.body.style.overflow = ''
    
    // Reset button state
    saveGoalBtn.disabled = false
    saveGoalBtn.innerHTML = originalBtnText
  } catch (error) {
    console.error('Error adding goal:', error)
    showMessage('Error adding goal: ' + error.message, 'error')
    
    // Reset button state
    const saveGoalBtn = document.getElementById('save-goal-btn')
    saveGoalBtn.disabled = false
    saveGoalBtn.innerHTML = 'Save Goal'
  }
}

/**
 * Handle delete account
 */
async function handleDeleteAccount() {
  if (!currentUser) {
    showMessage('Please log in to delete your account', 'error')
    return
  }
  
  const password = document.getElementById('delete-password').value
  
  if (!password) {
    showMessage('Please enter your password to confirm', 'error')
    return
  }
  
  try {
    // Show loading state
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn')
    const originalBtnText = confirmDeleteBtn.textContent
    confirmDeleteBtn.disabled = true
    confirmDeleteBtn.innerHTML = '<i class="material-icons loading">refresh</i> Deleting...'
    
    // Re-authenticate user
    const credential = EmailAuthProvider.credential(currentUser.email, password)
    await reauthenticateWithCredential(currentUser, credential)
    
    // Delete user data from Firestore
    const userDocRef = doc(db, 'users', currentUser.uid)
    await deleteDoc(userDocRef)
    
    // Delete user account
    await deleteUser(currentUser)
    
    // Show success message and redirect
    alert('Your account has been deleted. You will be redirected to the home page.')
    window.location.href = 'index.html'
  } catch (error) {
    console.error('Error deleting account:', error)
    
    if (error.code === 'auth/wrong-password') {
      showMessage('Incorrect password', 'error')
    } else {
      showMessage('Error deleting account: ' + error.message, 'error')
    }
    
    // Reset button state
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn')
    confirmDeleteBtn.disabled = false
    confirmDeleteBtn.innerHTML = 'Delete Account'
  }
}

/**
 * Handle logout
 */
async function handleLogout() {
  try {
    await signOut(auth)
    window.location.href = 'index.html'
  } catch (error) {
    console.error('Error signing out:', error)
    showMessage('Error signing out: ' + error.message, 'error')
  }
}

/* =================================================================
   UTILITY FUNCTIONS
   ================================================================= */

/**
 * Show a message to the user
 */
function showMessage(message, type) {
  let messageElement = document.getElementById('profile-message')
  
  if (!messageElement) {
    messageElement = document.createElement('div')
    messageElement.id = 'profile-message'
    messageElement.className = 'message'
    
    // Add to DOM at the top of the profile content
    const profileContent = document.querySelector('.profile-content')
    if (profileContent) {
      profileContent.insertBefore(messageElement, profileContent.firstChild)
    }
  }
  
  // Update message
  messageElement.textContent = message
  messageElement.className = `message ${type}`
  messageElement.classList.remove('hidden')
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    messageElement.classList.add('hidden')
  }, 5000)
}

/**
 * Format time from minutes to hours and minutes
 */
function formatTime(minutes) {
  if (minutes < 60) {
    return `${minutes}m`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (remainingMinutes === 0) {
    return `${hours}h`
  }
  
  return `${hours}h ${remainingMinutes}m`
}

/**
 * Calculate workout streak
 */
function calculateStreak(workoutDates) {
  if (workoutDates.size === 0) {
    return 0
  }
  
  // Convert dates to Date objects and sort
  const dates = Array.from(workoutDates)
    .map((dateStr) => new Date(dateStr))
    .sort((a, b) => b - a) // Sort descending (newest first)
  
  // Check if the most recent workout was today or yesterday
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const mostRecentDate = new Date(dates[0])
  mostRecentDate.setHours(0, 0, 0, 0)
  
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  const isRecentWorkout =
    mostRecentDate.getTime() === today.getTime() || mostRecentDate.getTime() === yesterday.getTime()
  
  if (!isRecentWorkout) {
    return 0 // Streak broken
  }
  
  // Calculate streak
  let streak = 1
  let currentDate = mostRecentDate
  
  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i])
    prevDate.setHours(0, 0, 0, 0)
    
    const expectedPrevDate = new Date(currentDate)
    expectedPrevDate.setDate(expectedPrevDate.getDate() - 1)
    
    if (prevDate.getTime() === expectedPrevDate.getTime()) {
      streak++
      currentDate = prevDate
    } else {
      break
    }
  }
  
  return streak
}

/**
 * Format time ago string
 */
function formatTimeAgo(date) {
  const now = new Date()
  const diffInSeconds = Math.floor((now - date) / 1000)
  
  if (diffInSeconds < 60) {
    return 'just now'
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}h ago`
  }
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays}d ago`
  }
  
  return date.toLocaleDateString()
}

/**
 * Format activity level
 */
function formatActivityLevel(level) {
  switch (level) {
    case 'sedentary':
      return 'Sedentary'
    case 'lightly_active':
      return 'Lightly Active'
    case 'moderately_active':
      return 'Moderately Active'
    case 'very_active':
      return 'Very Active'
    case 'extremely_active':
      return 'Extremely Active'
    default:
      return capitalizeFirstLetter(level)
  }
}

/**
 * Capitalize first letter of a string
 */
function capitalizeFirstLetter(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}