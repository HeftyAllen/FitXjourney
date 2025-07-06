// ===========================================================================
// FitJourney Settings Page JavaScript Module with Firebase Integration
// ===========================================================================


// Import Firebase core and modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged, 
  updateProfile, 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider,
  signOut 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js";

// TODO: Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase app if not already initialized
try {
  initializeApp(firebaseConfig);
} catch (e) {
  // Ignore if already initialized
}

class SettingsManager {
  constructor() {
    this.auth = getAuth();
    this.db = getFirestore();
    this.storage = getStorage();
    this.currentUser = null;
    this.userData = null;
    this.init();
  }

  init() {
    this.setupAuthStateListener();
    this.setupEventListeners();
    this.setupThemeToggle();
    this.setupUserDropdown();
    this.setupSidebarNavigation(); // ✅ Sidebar navigation
  }

  setupAuthStateListener() {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.currentUser = user;
        this.loadUserData();
      } else {
        // Redirect to login if not authenticated
        window.location.href = 'index.html';
      }
    });
  }

  async loadUserData() {
    if (!this.currentUser) return;

    try {
      // Get user document from Firestore
      const userDocRef = doc(this.db, 'users', this.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        this.userData = userDoc.data();
      } else {
        // Create default user document if it doesn't exist
        this.userData = {
          fullName: this.currentUser.displayName || 'User',
          email: this.currentUser.email,
          bio: '',
          photoURL: this.currentUser.photoURL || 'images/profile-placeholder.jpg',
          theme: 'dark',
          emailNotifications: true,
          pushNotifications: true,
          workoutReminders: true,
          language: 'en',
          timezone: 'UTC',
          darkMode: true,
          createdAt: serverTimestamp()
        };
        await setDoc(userDocRef, this.userData);
      }

      // Merge with Firebase Auth data
      this.userData = {
        ...this.userData,
        uid: this.currentUser.uid,
        email: this.currentUser.email,
        displayName: this.currentUser.displayName,
        photoURL: this.currentUser.photoURL || this.userData.photoURL
      };

      // Populate form fields and UI
      this.populateUserFields(this.userData);
      this.updateOverviewSection(this.userData);
      
      // Apply saved theme
      this.applyTheme(this.userData.theme || 'dark');
      
    } catch (error) {
      console.error('Error loading user data:', error);
      this.showMessage('Error loading user data', 'error');
    }
  }

  setupEventListeners() {
    // Profile form submission
    const accountForm = document.getElementById('settings-account-form');
    if (accountForm) {
      accountForm.addEventListener('submit', (e) => this.handleAccountUpdate(e));
    }

    // Security form submission
    const authForm = document.getElementById('settings-auth-form');
    if (authForm) {
      authForm.addEventListener('submit', (e) => this.handleSecurityUpdate(e));
    }

    // Preferences form submission
    const preferencesForm = document.getElementById('settings-preferences-form');
    if (preferencesForm) {
      preferencesForm.addEventListener('submit', (e) => this.handlePreferencesUpdate(e));
    }

    // Avatar upload
    const avatarInput = document.getElementById('settings-avatar');
    if (avatarInput) {
      avatarInput.addEventListener('change', (e) => this.handleAvatarUpload(e));
    }

    // Avatar edit button
    const avatarEditBtn = document.querySelector('.btn-avatar-edit');
    if (avatarEditBtn) {
      avatarEditBtn.addEventListener('click', () => {
        document.getElementById('settings-avatar').click();
      });
    }

    // Integration buttons
    this.setupIntegrationButtons();

    // Activity & Data buttons
    this.setupActivityDataButtons();

    // Danger zone buttons
    const logoutBtn = document.getElementById('logout-btn');
    const deleteAccountBtn = document.getElementById('delete-account-btn');
        
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout());
    }
        
    if (deleteAccountBtn) {
      deleteAccountBtn.addEventListener('click', () => this.handleDeleteAccount());
    }

    // Header logout button
    const headerLogoutBtn = document.getElementById('header-logout-btn');
    if (headerLogoutBtn) {
      headerLogoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleLogout();
      });
    }
  }

  populateUserFields(userData) {
    // Populate form fields - CORRECTED IDs to match HTML
    const fields = {
      'settings-email': userData.email,
      'settings-username': userData.fullName || userData.displayName,
      'settings-bio': userData.bio || '',
      'settings-language': userData.language || 'en',
      'settings-timezone': userData.timezone || 'UTC'
    };

    Object.entries(fields).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element && value) {
        element.value = value;
      }
    });

    // Handle checkboxes - CORRECTED names to match HTML
    const checkboxes = {
      'dark-mode': userData.darkMode !== false,
      'workout-notifications': userData.workoutReminders !== false,
      'progress-notifications': userData.progressNotifications || false,
      'email-2fa': userData.email2FA || false,
      'sms-2fa': userData.sms2FA || false
    };

    Object.entries(checkboxes).forEach(([name, checked]) => {
      const element = document.querySelector(`input[name="${name}"]`);
      if (element) {
        element.checked = checked;
      }
    });

    // Update avatar images
    const avatarImages = document.querySelectorAll('#overview-avatar, #header-avatar');
    avatarImages.forEach(img => {
      if (img && userData.photoURL) {
        img.src = userData.photoURL;
      }
    });
  }

  updateOverviewSection(userData) {
    // Update overview section
    const overviewUsername = document.getElementById('overview-username');
    const overviewEmail = document.getElementById('overview-email');
    const headerUsername = document.getElementById('header-username');

    if (overviewUsername) overviewUsername.textContent = userData.fullName || userData.displayName || 'User';
    if (overviewEmail) overviewEmail.textContent = userData.email;
    if (headerUsername) headerUsername.textContent = userData.fullName || userData.displayName || 'User';

    // Update stats if available
    if (userData.stats) {
      const statElements = document.querySelectorAll('.stat-item');
      const stats = ['workouts', 'totalTime', 'calories', 'streak'];
            
      statElements.forEach((element, index) => {
        const valueElement = element.querySelector('.stat-value');
        if (valueElement && stats[index] && userData.stats[stats[index]]) {
          valueElement.textContent = userData.stats[stats[index]];
        }
      });
    }
  }

  async handleAccountUpdate(e) {
    e.preventDefault();
    
    if (!this.currentUser) return;

    const formData = new FormData(e.target);
    const newUsername = formData.get('username');
    const newEmail = formData.get('email');
    const newBio = formData.get('bio');

    try {
      // Update Firebase Auth profile
      await updateProfile(this.currentUser, {
        displayName: newUsername
      });

      // Update Firestore document
      const userDocRef = doc(this.db, 'users', this.currentUser.uid);
      await updateDoc(userDocRef, {
        fullName: newUsername,
        bio: newBio,
        lastUpdatedAt: serverTimestamp()
      });

      // Update local userData
      this.userData.fullName = newUsername;
      this.userData.bio = newBio;

      // Update UI
      this.updateOverviewSection(this.userData);

      this.showMessage('Profile updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      this.showMessage('Error updating profile: ' + error.message, 'error');
    }
  }

  async handleSecurityUpdate(e) {
    e.preventDefault();
    
    if (!this.currentUser) return;

    const formData = new FormData(e.target);
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');

    // Validation
    if (!currentPassword || !newPassword) {
      this.showMessage('Please fill in all password fields', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      this.showMessage('New passwords do not match', 'error');
      return;
    }

    if (newPassword.length < 6) {
      this.showMessage('New password must be at least 6 characters long', 'error');
      return;
    }

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(this.currentUser.email, currentPassword);
      await reauthenticateWithCredential(this.currentUser, credential);

      // Update password
      await updatePassword(this.currentUser, newPassword);

      // Update 2FA settings
      const email2FA = formData.has('email-2fa');
      const sms2FA = formData.has('sms-2fa');

      const userDocRef = doc(this.db, 'users', this.currentUser.uid);
      await updateDoc(userDocRef, {
        email2FA,
        sms2FA,
        lastUpdatedAt: serverTimestamp()
      });

      this.showMessage('Security settings updated successfully!', 'success');
      e.target.reset();
    } catch (error) {
      console.error('Error updating security:', error);
      let errorMessage = 'Error updating security settings';
      
      switch (error.code) {
        case 'auth/wrong-password':
          errorMessage = 'Current password is incorrect';
          break;
        case 'auth/weak-password':
          errorMessage = 'New password is too weak';
          break;
        default:
          errorMessage = error.message;
      }
      
      this.showMessage(errorMessage, 'error');
    }
  }

  async handlePreferencesUpdate(e) {
    e.preventDefault();
    
    if (!this.currentUser) return;

    const formData = new FormData(e.target);
    
    const preferences = {
      darkMode: formData.has('dark-mode'),
      workoutReminders: formData.has('workout-notifications'),
      progressNotifications: formData.has('progress-notifications'),
      language: formData.get('language'),
      timezone: formData.get('timezone')
    };

    try {
      // Update Firestore document
      const userDocRef = doc(this.db, 'users', this.currentUser.uid);
      await updateDoc(userDocRef, {
        ...preferences,
        lastUpdatedAt: serverTimestamp()
      });

      // Update local userData
      Object.assign(this.userData, preferences);

      // Apply theme change
      this.applyTheme(preferences.darkMode ? 'dark' : 'light');

      this.showMessage('Preferences saved successfully!', 'success');
    } catch (error) {
      console.error('Error updating preferences:', error);
      this.showMessage('Error saving preferences: ' + error.message, 'error');
    }
  }

  async handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file || !this.currentUser) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.showMessage('Please select a valid image file', 'error');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.showMessage('Image size must be less than 5MB', 'error');
      return;
    }

    try {
      this.showMessage('Uploading profile picture...', 'info');

      // Create storage reference
      const storageRef = ref(this.storage, `avatars/${this.currentUser.uid}/${Date.now()}_${file.name}`);
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update Firebase Auth profile
      await updateProfile(this.currentUser, {
        photoURL: downloadURL
      });

      // Update Firestore document
      const userDocRef = doc(this.db, 'users', this.currentUser.uid);
      await updateDoc(userDocRef, {
        photoURL: downloadURL,
        lastUpdatedAt: serverTimestamp()
      });

      // Update local userData
      this.userData.photoURL = downloadURL;

      // Update avatar images in UI
      const avatarImages = document.querySelectorAll('#overview-avatar, #header-avatar');
      avatarImages.forEach(img => {
        img.src = downloadURL;
      });

      this.showMessage('Profile picture updated successfully!', 'success');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      this.showMessage('Error uploading profile picture: ' + error.message, 'error');
    }
  }

  // ✅ PRESERVED - Integration buttons functionality
  setupIntegrationButtons() {
    const integrationCards = document.querySelectorAll('.integration-card');
        
    integrationCards.forEach(card => {
      const button = card.querySelector('button');
      if (button && !card.classList.contains('connected')) {
        button.addEventListener('click', (e) => {
          const integrationName = card.querySelector('h4').textContent.trim();
          this.handleIntegrationConnect(integrationName, button, card);
        });
      }
    });
  }

  // ✅ PRESERVED - Integration connect handler
  handleIntegrationConnect(integrationName, button, card) {
    // Simulate connection process
    const originalText = button.textContent;
    button.textContent = 'Connecting...';
    button.disabled = true;
        
    setTimeout(() => {
      button.textContent = 'Connected';
      button.classList.remove('btn-secondary');
      button.classList.add('btn-primary');
      card.classList.add('connected');
      button.disabled = false;
      this.showMessage(`${integrationName} connected successfully!`, 'success');
    }, 2000);
  }

  // ✅ PRESERVED - Activity data buttons functionality
  setupActivityDataButtons() {
    const dataActionItems = document.querySelectorAll('.data-action-item');
        
    dataActionItems.forEach(item => {
      const button = item.querySelector('button');
      const title = item.querySelector('h4').textContent.trim();
            
      if (button) {
        button.addEventListener('click', () => {
          if (title.includes('Download')) {
            this.handleDataDownload();
          } else if (title.includes('Clear')) {
            this.handleClearHistory();
          }
        });
      }
    });
  }

  async handleDataDownload() {
    if (!this.currentUser) return;

    try {
      // Get user data from Firestore
      const userDocRef = doc(this.db, 'users', this.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      const exportData = {
        profile: userDoc.exists() ? userDoc.data() : {},
        authInfo: {
          uid: this.currentUser.uid,
          email: this.currentUser.email,
          displayName: this.currentUser.displayName,
          creationTime: this.currentUser.metadata.creationTime,
          lastSignInTime: this.currentUser.metadata.lastSignInTime
        },
        exportDate: new Date().toISOString()
      };

      const dataBlob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(dataBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fitjourney-data-${this.currentUser.uid}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.showMessage('Data download started!', 'success');
    } catch (error) {
      console.error('Error downloading data:', error);
      this.showMessage('Error downloading data: ' + error.message, 'error');
    }
  }

  // ✅ PRESERVED - Clear history functionality
  handleClearHistory() {
    if (confirm('Are you sure you want to clear your workout history? This action cannot be undone.')) {
      // Clear workout history from localStorage and potentially Firestore
      localStorage.removeItem('fitjourney_workouts');
      this.showMessage('Workout history cleared successfully!', 'success');
    }
  }

  async handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
      try {
        await signOut(this.auth);
        // Clear any local storage
        localStorage.removeItem('fitjourney_session');
        // Redirect to login page
        window.location.href = 'index.html';
      } catch (error) {
        console.error('Error signing out:', error);
        this.showMessage('Error signing out: ' + error.message, 'error');
      }
    }
  }

  handleDeleteAccount() {
    const confirmation = prompt('Type "DELETE" to confirm account deletion:');
        
    if (confirmation === 'DELETE') {
      if (confirm('This will permanently delete your account and all data. Are you absolutely sure?')) {
        // Note: Account deletion requires recent authentication
        // You might want to implement re-authentication before deletion
        this.showMessage('Account deletion requires recent authentication. Please contact support.', 'error');
      }
    } else if (confirmation !== null) {
      this.showMessage('Account deletion cancelled - confirmation text did not match', 'error');
    }
  }

  // ✅ PRESERVED - Complete theme toggle functionality
  setupThemeToggle() {
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => this.toggleTheme());
    }
  }

  // ✅ PRESERVED - Theme toggle handler
  async toggleTheme() {
    if (!this.userData) return;
    const currentTheme = this.userData.darkMode ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    const newDarkMode = newTheme === 'dark';
    this.userData.darkMode = newDarkMode;

    // Update in Firestore
    if (this.currentUser) {
      try {
        const userDocRef = doc(this.db, 'users', this.currentUser.uid);
        await updateDoc(userDocRef, { 
          darkMode: newDarkMode,
          lastUpdatedAt: serverTimestamp()
        });
      } catch (error) {
        console.error('Error updating theme:', error);
      }
    }

    this.applyTheme(newTheme);

    // Update dark mode checkbox in preferences
    const darkModeCheckbox = document.querySelector('input[name="dark-mode"]');
    if (darkModeCheckbox) {
      darkModeCheckbox.checked = newDarkMode;
    } else {
      console.warn('Theme toggler: dark mode checkbox not found.');
    }

    // Update theme toggle button icon
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
      const icon = themeToggleBtn.querySelector('i');
      if (icon) {
        icon.textContent = newTheme === 'dark' ? 'light_mode' : 'dark_mode';
      }
    } else {
      console.warn('Theme toggler: theme-toggle-btn not found.');
    }
  }

  // ✅ PRESERVED - Theme application functionality
  applyTheme(theme) {
    // Remove both classes first
    document.body.classList.remove('light-mode', 'dark-mode');
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.add('dark-mode');
    }
    // Always update theme toggle button icon
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
      const icon = themeToggleBtn.querySelector('i');
      if (icon) {
        icon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
      }
    }
    // Also update dark mode checkbox if present
    const darkModeCheckbox = document.querySelector('input[name="dark-mode"]');
    if (darkModeCheckbox) {
      darkModeCheckbox.checked = theme === 'dark';
    }
  }

  // ✅ PRESERVED - User dropdown functionality
  setupUserDropdown() {
    const userProfile = document.querySelector('.user-profile');
    if (userProfile) {
      userProfile.addEventListener('click', (e) => {
        e.stopPropagation();
        userProfile.classList.toggle('active');
      });
            
      // Close dropdown when clicking outside
      document.addEventListener('click', () => {
        userProfile.classList.remove('active');
      });
    }
  }

  // ✅ PRESERVED - Complete sidebar navigation functionality
  setupSidebarNavigation() {
    const navItems = document.querySelectorAll('.settings-nav .nav-item');
    const sections = document.querySelectorAll('.content-section');
    if (!navItems.length || !sections.length) {
      console.warn('Sidebar navigation: nav items or sections missing in HTML.');
      return;
    }

    // Ensure one nav item and one section is active by default
    let anyActive = false;
    navItems.forEach((item, idx) => {
      if (item.classList.contains('active')) anyActive = true;
    });
    if (!anyActive) {
      navItems[0].classList.add('active');
      sections[0].classList.add('active');
    }

    navItems.forEach(item => {
      item.addEventListener('click', function () {
        navItems.forEach(i => i.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active'));
        this.classList.add('active');
        const sectionId = this.getAttribute('data-section') + '-section';
        const section = document.getElementById(sectionId);
        if (section) {
          section.classList.add('active');
        } else {
          // fallback: activate first section
          sections[0].classList.add('active');
        }
      });
    });
  }

  // ✅ PRESERVED - Message display functionality
  showMessage(text, type = 'info') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.settings-message');
    existingMessages.forEach(msg => msg.remove());
        
    // Create new message
    const message = document.createElement('div');
    message.className = `settings-message ${type}`;
    message.textContent = text;
    
    // Add some basic styling
    message.style.cssText = `
      padding: 12px 16px;
      margin: 16px 0;
      border-radius: 8px;
      font-weight: 500;
      ${type === 'success' ? 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;' : ''}
      ${type === 'error' ? 'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;' : ''}
      ${type === 'info' ? 'background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb;' : ''}
    `;
        
    // Insert at the top of settings content
    const settingsContent = document.querySelector('.settings-content');
    if (settingsContent) {
      settingsContent.insertBefore(message, settingsContent.firstChild);
            
      // Auto-remove after 5 seconds
      setTimeout(() => {
        if (message.parentNode) {
          message.remove();
        }
      }, 5000);
    }
  }
}

// Initialize settings manager when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  // Ensure all elements are present before initializing
  setTimeout(() => {
    new SettingsManager();
  }, 0);
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SettingsManager;
}