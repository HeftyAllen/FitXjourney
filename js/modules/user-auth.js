// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js"
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-analytics.js"
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged
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

// Check for saved login credentials
function checkRememberedUser() {
  const rememberedEmail = localStorage.getItem('rememberedEmail')
  const rememberedPassword = localStorage.getItem('rememberedPassword')
  
  if (rememberedEmail) {
    const emailInput = document.getElementById('login-email')
    const rememberCheckbox = document.getElementById('remember-me')
    
    if (emailInput) {
      emailInput.value = rememberedEmail
    }
    
    if (rememberCheckbox) {
      rememberCheckbox.checked = true
    }
    
    // Auto-login if password is remembered (optional - for better UX)
    if (rememberedPassword) {
      // You can implement auto-login here if desired
      console.log('User credentials remembered')
    }
  }
}

// Save or remove remembered credentials
function handleRememberMe(email, password, remember) {
  if (remember) {
    localStorage.setItem('rememberedEmail', email)
    // Note: Storing passwords in localStorage is not recommended for production
    // This is just for demo purposes. In production, use secure token storage
    localStorage.setItem('rememberedPassword', password)
  } else {
    localStorage.removeItem('rememberedEmail')
    localStorage.removeItem('rememberedPassword')
  }
}

/* -------------------------------
   LOGIN FUNCTIONALITY
------------------------------- */
const loginForm = document.querySelector("#login-form")
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault()
    
    const email = document.getElementById("login-email").value.trim()
    const password = document.getElementById("login-password").value
    const rememberMe = document.getElementById("remember-me").checked

    // Validation
    if (!email || !password) {
      displayMessage("Please fill in all fields.", "error")
      return
    }

    // Show loading state
    const submitBtn = loginForm.querySelector('button[type="submit"]')
    const originalBtnText = submitBtn.innerHTML
    submitBtn.disabled = true
    submitBtn.innerHTML = '<i class="material-icons loading">refresh</i> Logging in...'

    try {
      // Set persistence based on remember me checkbox
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence
      await setPersistence(auth, persistence)

      // Sign in user
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      console.log("User logged in:", userCredential.user)

      // Handle remember me functionality
      handleRememberMe(email, password, rememberMe)

      // Display success message
      displayMessage("Login successful! Redirecting to dashboard...", "success")
      
      // Redirect after short delay
      setTimeout(() => {
        window.location.href = "dashboard.html"
      }, 1500)

    } catch (error) {
      console.error("Login Error:", error)
      
      // Handle specific error cases
      let errorMessage = "Login failed. Please try again."
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = "No account found with this email address."
          break
        case 'auth/wrong-password':
          errorMessage = "Incorrect password. Please try again."
          break
        case 'auth/invalid-email':
          errorMessage = "Please enter a valid email address."
          break
        case 'auth/user-disabled':
          errorMessage = "This account has been disabled."
          break
        case 'auth/too-many-requests':
          errorMessage = "Too many failed attempts. Please try again later."
          break
        default:
          errorMessage = error.message
      }
      
      displayMessage(errorMessage, "error")
      
      // Reset button state
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

    try {
      // Get registration values
      const fullName = document.getElementById("full-name").value.trim()
      const email = document.getElementById("reg-email").value.trim()
      const password = document.getElementById("reg-password").value
      const confirmPassword = document.getElementById("confirm-password").value
      const termsAccepted = document.getElementById("terms").checked

      // Validation
      if (!fullName || !email || !password || !confirmPassword) {
        throw new Error("Please fill in all required fields.")
      }

      if (!termsAccepted) {
        throw new Error("Please accept the Terms of Service and Privacy Policy.")
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.")
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters long.")
      }

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

      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      console.log("User registered:", userCredential.user)

      // Update user profile with full name
      await updateProfile(userCredential.user, { 
        displayName: fullName 
      })

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

      console.log("User profile created in Firestore")

      // Display success message
      displayMessage("Registration successful! Welcome to FitJourney! Redirecting...", "success")

      // Clear form
      registerForm.reset()
      
      // Reset to first step
      resetRegistrationSteps()

      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = "dashboard.html"
      }, 2000)

    } catch (error) {
      console.error("Registration Error:", error)
      
      // Handle specific error cases
      let errorMessage = "Registration failed. Please try again."
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = "An account with this email already exists."
          break
        case 'auth/invalid-email':
          errorMessage = "Please enter a valid email address."
          break
        case 'auth/weak-password':
          errorMessage = "Password is too weak. Please choose a stronger password."
          break
        case 'auth/operation-not-allowed':
          errorMessage = "Email/password accounts are not enabled."
          break
        default:
          errorMessage = error.message
      }
      
      displayMessage(errorMessage, "error")
      
      // Reset button state
      submitBtn.disabled = false
      submitBtn.innerHTML = originalBtnText
    }
  })
}

/* -------------------------------
   HELPER FUNCTIONS
------------------------------- */

// Reset registration steps to first step
function resetRegistrationSteps() {
  // Hide all steps
  document.querySelectorAll('.form-step').forEach(step => {
    step.classList.remove('active')
  })
  
  // Show first step
  document.getElementById('step-1').classList.add('active')
  
  // Reset progress indicators
  document.querySelectorAll('.progress-steps .step').forEach(step => {
    step.classList.remove('active')
  })
  
  document.querySelector('.progress-steps .step[data-step="1"]').classList.add('active')
}

// Display message function
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

// Check authentication state on page load
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User is signed in:", user)
    // User is signed in, you can redirect to dashboard if needed
    // Uncomment the line below if you want to auto-redirect logged-in users
    // window.location.href = "dashboard.html"
  } else {
    console.log("User is signed out")
    // Check for remembered credentials
    checkRememberedUser()
  }
})

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  checkRememberedUser()
})

/* -------------------------------
   EXPORT AUTH FUNCTIONS
------------------------------- */
export { auth, db }