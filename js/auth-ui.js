// Auth UI functionality
let currentStep = 1;

// Tab switching functionality
document.addEventListener('DOMContentLoaded', function() {
  const tabs = document.querySelectorAll('.auth-tabs .tab');
  const sections = document.querySelectorAll('.auth-section');

  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const targetTab = this.getAttribute('data-tab');
      
      // Remove active class from all tabs and sections
      tabs.forEach(t => t.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));
      
      // Add active class to clicked tab and corresponding section
      this.classList.add('active');
      document.getElementById(targetTab).classList.add('active');
      
      // Reset registration form to step 1 when switching to register
      if (targetTab === 'register') {
        resetToStep(1);
      }
    });
  });

  // Password strength checker
  const passwordInput = document.getElementById('reg-password');
  if (passwordInput) {
    passwordInput.addEventListener('input', checkPasswordStrength);
  }
});

// Password visibility toggle
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const toggleIcon = input.parentElement.querySelector('.toggle-password');
  
  if (input.type === 'password') {
    input.type = 'text';
    toggleIcon.textContent = 'visibility_off';
  } else {
    input.type = 'password';
    toggleIcon.textContent = 'visibility';
  }
}

// Step navigation functions
function nextStep() {
  if (validateCurrentStep()) {
    if (currentStep < 3) {
      currentStep++;
      showStep(currentStep);
    }
  }
}

function prevStep() {
  if (currentStep > 1) {
    currentStep--;
    showStep(currentStep);
  }
}

function showStep(step) {
  // Hide all steps
  document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.progress-steps .step').forEach(s => s.classList.remove('active'));
  
  // Show current step
  document.getElementById(`step-${step}`).classList.add('active');
  document.querySelector(`.progress-steps .step[data-step="${step}"]`).classList.add('active');
}

function resetToStep(step) {
  currentStep = step;
  showStep(step);
}

// Form validation
function validateCurrentStep() {
  const currentStepElement = document.getElementById(`step-${currentStep}`);
  const requiredFields = currentStepElement.querySelectorAll('input[required], select[required]');
  
  let isValid = true;
  
  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      field.style.borderColor = '#ff5252';
      isValid = false;
    } else {
      field.style.borderColor = '';
    }
  });
  
  // Additional validation for step 1
  if (currentStep === 1) {
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (password !== confirmPassword) {
      document.getElementById('confirm-password').style.borderColor = '#ff5252';
      displayMessage('Passwords do not match.', 'error');
      isValid = false;
    }
    
    if (password.length < 6) {
      document.getElementById('reg-password').style.borderColor = '#ff5252';
      displayMessage('Password must be at least 6 characters long.', 'error');
      isValid = false;
    }
  }
  
  if (!isValid) {
    displayMessage('Please fill in all required fields correctly.', 'error');
  }
  
  return isValid;
}

// Password strength checker
function checkPasswordStrength() {
  const password = document.getElementById('reg-password').value;
  const strengthMeter = document.querySelector('.strength-meter');
  const strengthText = document.querySelector('.strength-text');
  const segments = strengthMeter.querySelectorAll('.strength-segment');
  
  // Reset segments
  segments.forEach(segment => segment.classList.remove('active'));
  
  let strength = 0;
  let strengthLabel = 'Password strength';
  
  // Check password criteria
  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  
  // Update visual indicators
  for (let i = 0; i < Math.min(strength, 4); i++) {
    segments[i].classList.add('active');
  }
  
  // Update strength text
  switch (strength) {
    case 0:
    case 1:
      strengthLabel = 'Weak';
      strengthText.className = 'strength-text weak';
      break;
    case 2:
      strengthLabel = 'Fair';
      strengthText.className = 'strength-text fair';
      break;
    case 3:
      strengthLabel = 'Good';
      strengthText.className = 'strength-text good';
      break;
    case 4:
    case 5:
      strengthLabel = 'Strong';
      strengthText.className = 'strength-text strong';
      break;
  }
  
  strengthText.textContent = strengthLabel;
}

// Social login placeholder functions
function socialLogin(provider) {
  displayMessage(`${provider} login is not implemented yet.`, 'error');
}

// Display message function (if not already defined)
function displayMessage(message, type) {
  const msgContainer = document.getElementById("auth-message");
  if (msgContainer) {
    msgContainer.textContent = message;
    msgContainer.className = `auth-message ${type}`;
    msgContainer.classList.remove("hidden");

    // Scroll to message
    msgContainer.scrollIntoView({ behavior: "smooth", block: "center" });

    // Clear the message after 5 seconds
    setTimeout(() => {
      msgContainer.textContent = "";
      msgContainer.className = "auth-message hidden";
    }, 5000);
  }
}

// Mobile menu toggle (if needed)
function toggleMobileMenu() {
  const nav = document.querySelector('.nav');
  nav.classList.toggle('active');
}