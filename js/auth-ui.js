// Enhanced Auth UI with Theme Integration
document.addEventListener("DOMContentLoaded", () => {
  // Initialize theme toggle
  themeToggle = new AuthThemeToggle()

  // Initialize mobile menu
  initializeMobileMenu()

  // Tab switching with enhanced animations
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      switchTab(tab.dataset.tab)
    })
  })

  // Password strength monitoring
  const regPasswordInput = document.getElementById("reg-password")
  if (regPasswordInput) {
    regPasswordInput.addEventListener("input", (e) => {
      updatePasswordStrength(e.target.value)
    })
  }

  // Real-time password confirmation validation
  const confirmPasswordInput = document.getElementById("confirm-password")
  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener("input", (e) => {
      const password = document.getElementById("reg-password").value
      const confirmPassword = e.target.value

      if (confirmPassword && password !== confirmPassword) {
        e.target.style.borderColor = "var(--error)"
        e.target.style.boxShadow = "0 0 0 3px rgba(244, 67, 54, 0.2)"
      } else {
        e.target.style.borderColor = ""
        e.target.style.boxShadow = ""
      }
    })
  }

  // Enhanced field focus effects
  document.querySelectorAll("input, select, textarea").forEach((field) => {
    field.addEventListener("focus", () => {
      field.style.borderColor = ""
      field.style.boxShadow = ""
      field.style.transform = "scale(1.02)"

      // Remove field error message
      const errorMsg = field.parentNode.querySelector(".field-error")
      if (errorMsg) {
        errorMsg.style.opacity = "0"
        errorMsg.style.transform = "translateY(-10px)"
        setTimeout(() => {
          errorMsg.remove()
        }, 300)
      }
    })

    field.addEventListener("blur", () => {
      field.style.transform = "scale(1)"
    })
  })

  // Form submission prevention for demo social buttons
  document.querySelectorAll(".social-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault()
    })
  })

  // Add CSS for animations
  const style = document.createElement("style")
  style.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
      20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    .auth-section {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .form-step {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    input, select, textarea {
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .strength-segment {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .step-number {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .theme-toggle-animate {
      animation: themeToggleRotate 0.3s ease-in-out;
    }
    
    @keyframes themeToggleRotate {
      0% { transform: rotate(0deg) scale(1); }
      50% { transform: rotate(180deg) scale(1.1); }
      100% { transform: rotate(360deg) scale(1); }
    }
  `
  document.head.appendChild(style)

  // Show welcome toast
  setTimeout(() => {
    showToast("Welcome to FitJourney! 🎯", "success")
  }, 1000)
})

let currentStep = 1
const totalSteps = 3

// Theme Toggle Variables
let themeToggle = null
const STORAGE_KEY = "fitjourney-theme"

// ==========================================================================
// THEME TOGGLE FUNCTIONALITY
// ==========================================================================
class AuthThemeToggle {
  constructor() {
    this.themeToggleBtn = document.getElementById("theme-toggle-btn")
    this.body = document.body
    this.themeIcon = this.themeToggleBtn?.querySelector("i")
    this.storageKey = STORAGE_KEY
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
  }

  toggleTheme() {
    const currentTheme = this.body.classList.contains("light-mode") ? "light" : "dark"
    const newTheme = currentTheme === "light" ? "dark" : "light"

    // Add animation class
    this.themeToggleBtn?.classList.add("theme-toggle-animate")

    // Set new theme
    this.setTheme(newTheme)

    // Remove animation class after animation completes
    setTimeout(() => {
      this.themeToggleBtn?.classList.remove("theme-toggle-animate")
    }, 300)

    // Show toast notification
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

// ==========================================================================
// ENHANCED TOAST NOTIFICATIONS
// ==========================================================================
function showToast(message, type = "info", icon = null) {
  // Remove existing toasts
  const existingToasts = document.querySelectorAll(".theme-toast")
  existingToasts.forEach((toast) => toast.remove())

  // Create toast container if it doesn't exist
  let toastContainer = document.querySelector(".toast-container")
  if (!toastContainer) {
    toastContainer = document.createElement("div")
    toastContainer.className = "toast-container"
    toastContainer.style.cssText = `
      position: fixed;
      top: 1.5rem;
      right: 1.5rem;
      z-index: 1080;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      pointer-events: none;
    `
    document.body.appendChild(toastContainer)
  }

  // Set icon based on type or custom icon
  let toastIcon = icon || "info"
  if (!icon) {
    if (type === "success") toastIcon = "check_circle"
    if (type === "error") toastIcon = "error"
    if (type === "warning") toastIcon = "warning"
  }

  // Create toast element
  const toast = document.createElement("div")
  toast.className = `toast theme-toast toast-${type}`
  toast.style.cssText = `
    background: var(--card-bg);
    border: 1px solid var(--border-light);
    border-radius: var(--border-radius);
    padding: 1rem;
    box-shadow: var(--elevated-shadow);
    display: flex;
    align-items: center;
    gap: 0.75rem;
    transform: translateX(400px);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    max-width: 300px;
    backdrop-filter: blur(10px);
    pointer-events: auto;
    border-left: 4px solid var(--info);
  `

  if (type === "success") {
    toast.style.borderLeftColor = "var(--success)"
  } else if (type === "error") {
    toast.style.borderLeftColor = "var(--error)"
  } else if (type === "warning") {
    toast.style.borderLeftColor = "var(--warning)"
  }

  toast.innerHTML = `
    <i class="material-icons" style="font-size: 1.25rem; color: var(--info); flex-shrink: 0;">${toastIcon}</i>
    <div class="toast-content" style="flex: 1; color: var(--text-color); font-size: 0.9rem; font-weight: 500;">
      <span>${message}</span>
    </div>
    <button class="toast-close" aria-label="Close notification" style="background: none; border: none; color: var(--light-text); cursor: pointer; padding: 0.25rem; border-radius: 4px; transition: all var(--transition-fast); display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; flex-shrink: 0;">
      <i class="material-icons" style="font-size: 1rem; color: inherit;">close</i>
    </button>
  `

  // Add to container
  toastContainer.appendChild(toast)

  // Show toast
  setTimeout(() => {
    toast.style.transform = "translateX(0)"
  }, 100)

  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.style.transform = "translateX(400px)"
    setTimeout(() => toast.remove(), 300)
  }, 3000)

  // Close button functionality
  const closeBtn = toast.querySelector(".toast-close")
  closeBtn.addEventListener("click", () => {
    toast.style.transform = "translateX(400px)"
    setTimeout(() => toast.remove(), 300)
  })

  closeBtn.addEventListener("mouseenter", () => {
    closeBtn.style.background = "var(--surface-bg)"
    closeBtn.style.color = "var(--text-color)"
    closeBtn.style.transform = "rotate(90deg)"
  })

  closeBtn.addEventListener("mouseleave", () => {
    closeBtn.style.background = "none"
    closeBtn.style.color = "var(--light-text)"
    closeBtn.style.transform = "rotate(0deg)"
  })
}

// ==========================================================================
// ENHANCED TAB SWITCHING WITH ANIMATIONS
// ==========================================================================
function switchTab(tabName) {
  // Remove active class from all tabs and sections
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"))
  document.querySelectorAll(".auth-section").forEach((section) => {
    section.classList.remove("active")
    section.style.opacity = "0"
    section.style.transform = "translateY(20px)"
  })

  // Add active class to clicked tab and corresponding section
  document.querySelector(`[data-tab="${tabName}"]`).classList.add("active")
  const targetSection = document.getElementById(tabName)
  targetSection.classList.add("active")

  // Animate section entrance
  setTimeout(() => {
    targetSection.style.opacity = "1"
    targetSection.style.transform = "translateY(0)"
  }, 50)

  // Clear any messages
  const msgContainer = document.getElementById("auth-message")
  if (msgContainer) {
    msgContainer.classList.add("hidden")
  }

  // Show success toast for tab switch
  const tabText = tabName === "login" ? "Login" : "Register"
  showToast(`Switched to ${tabText}`, "info")
}

// ==========================================================================
// ENHANCED MULTI-STEP FORM NAVIGATION WITH ANIMATIONS
// ==========================================================================
function nextStep() {
  if (currentStep < totalSteps) {
    // Validate current step before proceeding
    if (validateCurrentStep()) {
      // Animate current step out
      const currentStepElement = document.getElementById(`step-${currentStep}`)
      currentStepElement.style.transform = "translateX(-100%)"
      currentStepElement.style.opacity = "0"

      setTimeout(() => {
        // Hide current step
        currentStepElement.classList.remove("active")
        currentStepElement.style.transform = ""
        currentStepElement.style.opacity = ""

        document.querySelector(`.progress-steps .step[data-step="${currentStep}"]`).classList.remove("active")

        // Show next step
        currentStep++
        const nextStepElement = document.getElementById(`step-${currentStep}`)
        nextStepElement.classList.add("active")
        nextStepElement.style.transform = "translateX(100%)"
        nextStepElement.style.opacity = "0"

        // Animate next step in
        setTimeout(() => {
          nextStepElement.style.transform = "translateX(0)"
          nextStepElement.style.opacity = "1"
        }, 50)

        document.querySelector(`.progress-steps .step[data-step="${currentStep}"]`).classList.add("active")

        // Update progress indicators
        updateProgressSteps()

        // Show progress toast
        showToast(`Step ${currentStep} of ${totalSteps}`, "info")
      }, 200)
    }
  }
}

function prevStep() {
  if (currentStep > 1) {
    // Animate current step out
    const currentStepElement = document.getElementById(`step-${currentStep}`)
    currentStepElement.style.transform = "translateX(100%)"
    currentStepElement.style.opacity = "0"

    setTimeout(() => {
      // Hide current step
      currentStepElement.classList.remove("active")
      currentStepElement.style.transform = ""
      currentStepElement.style.opacity = ""

      document.querySelector(`.progress-steps .step[data-step="${currentStep}"]`).classList.remove("active")

      // Show previous step
      currentStep--
      const prevStepElement = document.getElementById(`step-${currentStep}`)
      prevStepElement.classList.add("active")
      prevStepElement.style.transform = "translateX(-100%)"
      prevStepElement.style.opacity = "0"

      // Animate previous step in
      setTimeout(() => {
        prevStepElement.style.transform = "translateX(0)"
        prevStepElement.style.opacity = "1"
      }, 50)

      document.querySelector(`.progress-steps .step[data-step="${currentStep}"]`).classList.add("active")

      // Update progress indicators
      updateProgressSteps()

      // Show progress toast
      showToast(`Back to Step ${currentStep}`, "info")
    }, 200)
  }
}

function updateProgressSteps() {
  document.querySelectorAll(".progress-steps .step").forEach((step, index) => {
    const stepElement = step.querySelector(".step-number")

    if (index + 1 <= currentStep) {
      step.classList.add("active")
      // Add completion animation
      if (index + 1 < currentStep) {
        stepElement.style.transform = "scale(1.1)"
        setTimeout(() => {
          stepElement.style.transform = "scale(1)"
        }, 200)
      }
    } else {
      step.classList.remove("active")
    }
  })
}

// ==========================================================================
// ENHANCED FORM VALIDATION WITH BETTER UX
// ==========================================================================
function validateCurrentStep() {
  const currentStepElement = document.getElementById(`step-${currentStep}`)
  const requiredFields = currentStepElement.querySelectorAll("input[required], select[required]")

  let isValid = true
  let firstInvalidField = null

  requiredFields.forEach((field) => {
    if (!field.value.trim()) {
      isValid = false
      if (!firstInvalidField) {
        firstInvalidField = field
      }

      // Add enhanced error styling with animation
      field.style.borderColor = "var(--error)"
      field.style.boxShadow = "0 0 0 3px rgba(244, 67, 54, 0.2)"
      field.style.animation = "shake 0.5s ease-in-out"

      // Remove animation after completion
      setTimeout(() => {
        field.style.animation = ""
      }, 500)
    } else {
      // Remove error styling
      field.style.borderColor = ""
      field.style.boxShadow = ""
    }
  })

  // Special validation for step 1 (password confirmation)
  if (currentStep === 1) {
    const password = document.getElementById("reg-password").value
    const confirmPassword = document.getElementById("confirm-password").value

    if (password !== confirmPassword) {
      isValid = false
      const confirmField = document.getElementById("confirm-password")
      confirmField.style.borderColor = "var(--error)"
      confirmField.style.boxShadow = "0 0 0 3px rgba(244, 67, 54, 0.2)"
      confirmField.style.animation = "shake 0.5s ease-in-out"

      showFieldError(confirmField, "Passwords do not match")

      setTimeout(() => {
        confirmField.style.animation = ""
      }, 500)
    }

    // Validate password strength
    if (password.length < 6) {
      isValid = false
      const passwordField = document.getElementById("reg-password")
      passwordField.style.borderColor = "var(--error)"
      passwordField.style.boxShadow = "0 0 0 3px rgba(244, 67, 54, 0.2)"
      passwordField.style.animation = "shake 0.5s ease-in-out"

      showFieldError(passwordField, "Password must be at least 6 characters")

      setTimeout(() => {
        passwordField.style.animation = ""
      }, 500)
    }
  }

  if (!isValid && firstInvalidField) {
    firstInvalidField.focus()
    showValidationMessage("Please fill in all required fields correctly.")
    showToast("Please check the form for errors", "error")
  } else if (isValid) {
    showToast("Step completed successfully!", "success")
  }

  return isValid
}

function showFieldError(field, message) {
  // Remove existing error message
  const existingError = field.parentNode.querySelector(".field-error")
  if (existingError) {
    existingError.remove()
  }

  // Create and show error message with animation
  const errorDiv = document.createElement("div")
  errorDiv.className = "field-error"
  errorDiv.style.cssText = `
    color: var(--error);
    font-size: 0.8rem;
    margin-top: 0.25rem;
    opacity: 0;
    transform: translateY(-10px);
    transition: all 0.3s ease;
  `
  errorDiv.textContent = message

  field.parentNode.appendChild(errorDiv)

  // Animate in
  setTimeout(() => {
    errorDiv.style.opacity = "1"
    errorDiv.style.transform = "translateY(0)"
  }, 50)

  // Remove error after 5 seconds
  setTimeout(() => {
    if (errorDiv.parentNode) {
      errorDiv.style.opacity = "0"
      errorDiv.style.transform = "translateY(-10px)"
      setTimeout(() => {
        errorDiv.remove()
      }, 300)
    }
  }, 5000)
}

function showValidationMessage(message) {
  const msgContainer = document.getElementById("auth-message")
  if (msgContainer) {
    msgContainer.textContent = message
    msgContainer.className = "auth-message error"
    msgContainer.classList.remove("hidden")

    // Add entrance animation
    msgContainer.style.transform = "translateY(-20px)"
    msgContainer.style.opacity = "0"

    setTimeout(() => {
      msgContainer.style.transform = "translateY(0)"
      msgContainer.style.opacity = "1"
    }, 50)

    setTimeout(() => {
      msgContainer.style.opacity = "0"
      msgContainer.style.transform = "translateY(-20px)"
      setTimeout(() => {
        msgContainer.classList.add("hidden")
        msgContainer.style.transform = ""
        msgContainer.style.opacity = ""
      }, 300)
    }, 3000)
  }
}

// ==========================================================================
// ENHANCED PASSWORD FUNCTIONALITY
// ==========================================================================
function togglePassword(inputId) {
  const input = document.getElementById(inputId)
  const toggleIcon = input.parentNode.querySelector(".toggle-password")

  // Add animation to toggle
  toggleIcon.style.transform = "scale(0.8)"

  setTimeout(() => {
    if (input.type === "password") {
      input.type = "text"
      toggleIcon.textContent = "visibility_off"
    } else {
      input.type = "password"
      toggleIcon.textContent = "visibility"
    }

    toggleIcon.style.transform = "scale(1)"
  }, 100)
}

function updatePasswordStrength(password) {
  const strengthMeter = document.querySelector(".strength-meter")
  const strengthText = document.querySelector(".strength-text")
  const segments = strengthMeter.querySelectorAll(".strength-segment")

  // Reset segments with animation
  segments.forEach((segment, index) => {
    setTimeout(() => {
      segment.classList.remove("active")
    }, index * 50)
  })

  let strength = 0
  let strengthLabel = "Password strength"

  if (password.length >= 6) strength++
  if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++
  if (password.match(/[0-9]/)) strength++
  if (password.match(/[^a-zA-Z0-9]/)) strength++

  // Update segments with staggered animation
  setTimeout(() => {
    for (let i = 0; i < strength; i++) {
      setTimeout(() => {
        segments[i].classList.add("active")
      }, i * 100)
    }
  }, 200)

  // Update text
  switch (strength) {
    case 0:
    case 1:
      strengthLabel = "Weak"
      strengthText.className = "strength-text weak"
      break
    case 2:
      strengthLabel = "Fair"
      strengthText.className = "strength-text fair"
      break
    case 3:
      strengthLabel = "Good"
      strengthText.className = "strength-text good"
      break
    case 4:
      strengthLabel = "Strong"
      strengthText.className = "strength-text strong"
      break
  }

  strengthText.textContent = strengthLabel
}

// ==========================================================================
// ENHANCED SOCIAL LOGIN WITH BETTER FEEDBACK
// ==========================================================================
function socialLogin(provider) {
  console.log(`Social login with ${provider} - Feature coming soon!`)

  // Show loading state
  const button = event.target.closest(".social-btn")
  const originalContent = button.innerHTML

  button.innerHTML = `
    <i class="material-icons loading" style="animation: spin 1s linear infinite;">autorenew</i>
    Connecting...
  `
  button.disabled = true

  setTimeout(() => {
    button.innerHTML = originalContent
    button.disabled = false

    showToast(`${provider} login coming soon!`, "warning")
  }, 2000)
}

// ==========================================================================
// ENHANCED MOBILE MENU WITH ANIMATIONS
// ==========================================================================
function initializeMobileMenu() {
  const mobileMenuToggle = document.querySelector(".mobile-menu-toggle")
  const nav = document.querySelector(".nav")

  if (mobileMenuToggle && nav) {
    mobileMenuToggle.addEventListener("click", () => {
      const isOpen = nav.classList.contains("mobile-open")
      const icon = mobileMenuToggle.querySelector("i")

      if (isOpen) {
        // Close menu
        nav.style.transform = "translateY(-100%)"
        nav.style.opacity = "0"
        icon.textContent = "menu"

        setTimeout(() => {
          nav.classList.remove("mobile-open")
          nav.style.transform = ""
          nav.style.opacity = ""
        }, 200)
      } else {
        // Open menu
        nav.classList.add("mobile-open")
        nav.style.transform = "translateY(-100%)"
        nav.style.opacity = "0"
        icon.textContent = "close"

        setTimeout(() => {
          nav.style.transform = "translateY(0)"
          nav.style.opacity = "1"
        }, 50)
      }
    })

    // Close mobile menu when clicking outside
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".nav") && !e.target.closest(".mobile-menu-toggle")) {
        if (nav.classList.contains("mobile-open")) {
          nav.style.transform = "translateY(-100%)"
          nav.style.opacity = "0"

          setTimeout(() => {
            nav.classList.remove("mobile-open")
            nav.style.transform = ""
            nav.style.opacity = ""
            mobileMenuToggle.querySelector("i").textContent = "menu"
          }, 200)
        }
      }
    })
  }
}

// ==========================================================================
// GLOBAL FUNCTIONS (for inline onclick handlers)
// ==========================================================================
window.togglePassword = togglePassword
window.nextStep = nextStep
window.prevStep = prevStep
window.socialLogin = socialLogin
window.showToast = showToast
window.themeToggle = themeToggle
