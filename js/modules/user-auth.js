// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js"
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-analytics.js"
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js"
import {
  getFirestore,
  doc,
  setDoc,
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

// Initialize Firebase and Analytics
const app = initializeApp(firebaseConfig)
const analytics = getAnalytics(app)

// Initialize Firebase Authentication and Firestore
const auth = getAuth(app)
const db = getFirestore(app)

/* -------------------------------
   LOGIN FUNCTIONALITY
------------------------------- */
const loginForm = document.querySelector("#login-form")
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault()
    const email = document.getElementById("login-email").value
    const password = document.getElementById("login-password").value

    // Show loading state
    const submitBtn = loginForm.querySelector('button[type="submit"]')
    const originalBtnText = submitBtn.innerHTML
    submitBtn.disabled = true
    submitBtn.innerHTML = '<i class="material-icons loading">refresh</i> Logging in...'

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      console.log("User logged in:", userCredential.user)
      displayMessage("Login successful! Redirecting...", "success")
      setTimeout(() => {
        window.location.href = "dashboard.html"
      }, 1500)
    } catch (error) {
      console.error("Login Error:", error)
      displayMessage("Login error: " + error.message, "error")
      submitBtn.disabled = false
      submitBtn.innerHTML = originalBtnText
    }
  })
}

/* -------------------------------
   REGISTRATION FUNCTIONALITY
------------------------------- */
const registerForm = document.querySelector("#register-form")
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    // Show loading state
    const submitBtn = registerForm.querySelector('button[type="submit"]')
    const originalBtnText = submitBtn.innerHTML
    submitBtn.disabled = true
    submitBtn.innerHTML = '<i class="material-icons loading">refresh</i> Creating account...'

    // Get registration values
    const fullName = document.getElementById("full-name").value
    const email = document.getElementById("reg-email").value
    const password = document.getElementById("reg-password").value
    const confirmPassword = document.getElementById("confirm-password").value

    // Get additional profile data if available
    const dob = document.getElementById("dob")?.value || null
    const weight = document.getElementById("weight")?.value
      ? parseFloat(document.getElementById("weight").value)
      : null
    const height = document.getElementById("height")?.value
      ? parseFloat(document.getElementById("height").value)
      : null
    const gender = document.getElementById("gender")?.value || null
    const fitnessLevel = document.getElementById("fitness-level")?.value || null
    const activityLevel = document.getElementById("activity-level")?.value || null
    const fitnessGoals = document.getElementById("fitness-goals")?.value || null

    // Check if passwords match
    if (password !== confirmPassword) {
      displayMessage("Passwords do not match.", "error")
      submitBtn.disabled = false
      submitBtn.innerHTML = originalBtnText
      return
    }

    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      console.log("User registered:", userCredential.user)

      // Update user profile with full name
      await updateProfile(userCredential.user, { displayName: fullName })

      // Calculate BMI if weight and height are available
      let bmi = null
      if (weight && height) {
        bmi = (weight / Math.pow(height / 100, 2)).toFixed(1)
      }

      // Create user document in Firestore with all profile data
      await setDoc(doc(db, "users", userCredential.user.uid), {
        fullName,
        email,
        dob,
        weight,
        height,
        gender,
        fitnessLevel,
        activityLevel,
        fitnessGoals,
        bmi: bmi ? parseFloat(bmi) : null,
        emailNotifications: false,
        pushNotifications: false,
        workoutReminders: false,
        createdAt: serverTimestamp(),
        lastUpdatedAt: serverTimestamp(),
      })

      // Display success message and redirect
      displayMessage("Registration successful! You are now logged in.", "success")

      setTimeout(() => {
        window.location.href = "dashboard.html"
      }, 1500)
    } catch (error) {
      console.error("Registration Error:", error)
      displayMessage("Registration error: " + error.message, "error")
      submitBtn.disabled = false
      submitBtn.innerHTML = originalBtnText
    }
  })
}

/* -------------------------------
   DISPLAY MESSAGE FUNCTION
------------------------------- */
function displayMessage(message, type) {
  const msgContainer = document.getElementById("auth-message")
  if (msgContainer) {
    msgContainer.textContent = message
    msgContainer.className = `auth-message ${type}`
    msgContainer.classList.remove("hidden")

    // Scroll to message
    msgContainer.scrollIntoView({ behavior: "smooth", block: "center" })

    // Clear the message after 5 seconds
    setTimeout(() => {
      msgContainer.textContent = ""
      msgContainer.className = "auth-message hidden"
    }, 5000)
  }
}

/* -------------------------------
   EXPORT AUTH FUNCTIONS
------------------------------- */
export { auth, db }