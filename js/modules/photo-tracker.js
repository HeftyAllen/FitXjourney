// photo-tracker.js - Enhanced functionality

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize all components
  initializeUI();
  initializePhotoUpload();
  initializePhotoTimeline();
  initializeBeforeAfterComparison();
  initializeWeightLogging();
  initializeMeasurements();
  initializeProgressGraphs();
  initializeAIFeedback();
  initializeChatBot();
  
  // Update dashboard stats
  updateDashboardStats();
});

// =====================================================================
// UI INITIALIZATION
// =====================================================================

function initializeUI() {
  // Quick action buttons
  document.getElementById('upload-photo-btn').addEventListener('click', function() {
    document.getElementById('upload-photo').scrollIntoView({ behavior: 'smooth' });
  });
  
  document.getElementById('compare-photos-btn').addEventListener('click', function() {
    document.getElementById('before-after').scrollIntoView({ behavior: 'smooth' });
  });
  
  document.getElementById('log-weight-btn').addEventListener('click', function() {
    document.getElementById('weight-tracking').scrollIntoView({ behavior: 'smooth' });
  });
  
  document.getElementById('view-charts-btn').addEventListener('click', function() {
    document.getElementById('progress-graphs').scrollIntoView({ behavior: 'smooth' });
  });
  
  // Mobile menu toggle
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const nav = document.querySelector('.tracker-nav');
  
  if (mobileMenuToggle && nav) {
    mobileMenuToggle.addEventListener('click', function() {
      nav.classList.toggle('active');
      this.querySelector('i').textContent = nav.classList.contains('active') ? 'close' : 'menu';
    });
  }
  
  // Upload first photo button
  const uploadFirstPhotoBtn = document.getElementById('upload-first-photo');
  if (uploadFirstPhotoBtn) {
    uploadFirstPhotoBtn.addEventListener('click', function() {
      document.getElementById('upload-photo').scrollIntoView({ behavior: 'smooth' });
    });
  }
  
  // Chart tabs
  const chartTabs = document.querySelectorAll('.chart-tab');
  chartTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      // Remove active class from all tabs
      chartTabs.forEach(t => t.classList.remove('active'));
      
      // Add active class to clicked tab
      this.classList.add('active');
      
      // Update chart based on selected tab
      const chartType = this.getAttribute('data-chart');
      updateChart(chartType);
    });
  });
  
  // Set today's date as default for date inputs
  const today = new Date().toISOString().split('T')[0];
  const dateInputs = document.querySelectorAll('input[type="date"]');
  dateInputs.forEach(input => {
    input.value = today;
  });
}

// Update dashboard stats
function updateDashboardStats() {
  // Get all data
  const photos = getPhotos();
  const weightLogs = getWeightLogs();
  const measurements = getMeasurements();
  
  // Update total photos
  const totalPhotosEl = document.getElementById('total-photos');
  if (totalPhotosEl) {
    totalPhotosEl.textContent = photos.length;
  }
  
  // Update tracking since
  const trackingSinceEl = document.getElementById('tracking-since');
  if (trackingSinceEl && photos.length > 0) {
    // Sort photos by date (oldest first)
    const sortedPhotos = [...photos].sort((a, b) => new Date(a.date) - new Date(b.date));
    const firstPhotoDate = new Date(sortedPhotos[0].date);
    trackingSinceEl.textContent = firstPhotoDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
  
  // Update latest weight
  const latestWeightEl = document.getElementById('latest-weight');
  if (latestWeightEl && weightLogs.length > 0) {
    // Sort weight logs by date (newest first)
    const sortedLogs = [...weightLogs].sort((a, b) => new Date(b.date) - new Date(a.date));
    latestWeightEl.textContent = `${sortedLogs[0].weight} ${sortedLogs[0].unit}`;
  }
  
  // Calculate progress score (simplified example)
  const progressScoreEl = document.getElementById('progress-score');
  if (progressScoreEl) {
    if (photos.length > 0 && weightLogs.length > 0) {
      // Simple scoring: photos + weight logs + consistency
      const photoScore = Math.min(photos.length * 5, 50); // Max 50 points for photos
      const weightScore = Math.min(weightLogs.length * 2, 30); // Max 30 points for weight logs
      
      // Consistency score - check if logs are regular
      let consistencyScore = 0;
      if (weightLogs.length > 3) {
        consistencyScore = 20; // Max 20 points for consistency
      }
      
      const totalScore = photoScore + weightScore + consistencyScore;
      progressScoreEl.textContent = `${totalScore}/100`;
    } else {
      progressScoreEl.textContent = 'N/A';
    }
  }
}

// =====================================================================
// UTILITY FUNCTIONS
// =====================================================================

// Generate a unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Format date to readable string
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Convert a File to a Base64 string
function getBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function() {
      const fullData = reader.result;
      resolve(fullData);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

// Show toast notification
function showToast(message, type = 'info') {
  // Create toast container if it doesn't exist
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  // Set icon based on type
  let icon = 'info';
  if (type === 'success') icon = 'check_circle';
  if (type === 'error') icon = 'error';
  if (type === 'warning') icon = 'warning';
  
  toast.innerHTML = `
    <i class="material-icons">${icon}</i>
    <div class="toast-content">${message}</div>
    <button class="toast-close">&times;</button>
  `;
  
  // Add toast to container
  toastContainer.appendChild(toast);
  
  // Remove toast after 5 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 5000);
  
  // Allow manual closing
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  });
}

// =====================================================================
// PHOTO UPLOAD & GALLERY
// =====================================================================

function initializePhotoUpload() {
  const uploadForm = document.getElementById('upload-form');
  const photoUpload = document.getElementById('photo-upload');
  const photoPreview = document.getElementById('photo-preview');
  const cancelUpload = document.getElementById('cancel-upload');
  
  // Show preview when a file is selected
  photoUpload.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
      // Create and show preview
      const reader = new FileReader();
      reader.onload = function(e) {
        photoPreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
      };
      reader.readAsDataURL(file);
    }
  });
  
  // Cancel upload
  cancelUpload.addEventListener('click', function() {
    // Clear form
    uploadForm.reset();
    
    // Clear preview
    photoPreview.innerHTML = `
      <div class="placeholder">
        <i class="material-icons">add_photo_alternate</i>
        <p>Preview will appear here</p>
      </div>
    `;
  });
  
  // Handle form submission
  uploadForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const fileInput = document.getElementById('photo-upload');
    const captionInput = document.getElementById('photo-caption');
    const dateInput = document.getElementById('photo-date');
    const categoryInput = document.getElementById('photo-category');
    const weightInput = document.getElementById('current-weight');
    const weightUnitInput = document.getElementById('weight-unit');
    
    // Validate inputs
    if (fileInput.files.length === 0) {
      showToast('Please select a photo to upload', 'error');
      return;
    }
    
    if (!captionInput.value.trim()) {
      showToast('Please add notes about your photo', 'error');
      return;
    }
    
    if (!dateInput.value) {
      showToast('Please select a date', 'error');
      return;
    }
    
    // Process the photo
    try {
      const file = fileInput.files[0];
      const fullData = await getBase64(file);
      
      // Create photo object
      const photo = {
        id: generateId(),
        fullData: fullData,
        caption: captionInput.value.trim(),
        date: new Date(dateInput.value).toISOString(),
        displayDate: formatDate(new Date(dateInput.value)),
        category: categoryInput.value
      };
      
      // Save to localStorage
      savePhoto(photo);
      
      // If weight is provided, log it too
      if (weightInput.value) {
        const weightLog = {
          id: generateId(),
          weight: parseFloat(weightInput.value),
          unit: weightUnitInput.value,
          date: new Date(dateInput.value).toISOString(),
          displayDate: formatDate(new Date(dateInput.value)),
          notes: `Logged with photo upload: ${captionInput.value.trim()}`
        };
        
        saveWeightLog(weightLog);
        updateWeightHistory();
      }
      
      // Update timeline
      updatePhotoTimeline();
      
      // Update before/after dropdown options
      updateBeforeAfterOptions();
      
      // Update dashboard stats
      updateDashboardStats();
      
      // Clear form
      uploadForm.reset();
      
      // Clear preview
      photoPreview.innerHTML = `
        <div class="placeholder">
          <i class="material-icons">add_photo_alternate</i>
          <p>Preview will appear here</p>
        </div>
      `;
      
      showToast('Photo uploaded successfully!', 'success');
    } catch (error) {
      console.error('Error uploading photo:', error);
      showToast('Failed to upload photo. Please try again.', 'error');
    }
  });
}

// Save photo to localStorage
function savePhoto(photo) {
  let photos = JSON.parse(localStorage.getItem('progressPhotos')) || [];
  photos.push(photo);
  localStorage.setItem('progressPhotos', JSON.stringify(photos));
}

// Get all stored photos
function getPhotos() {
  return JSON.parse(localStorage.getItem('progressPhotos')) || [];
}

// =====================================================================
// PHOTO TIMELINE
// =====================================================================

function initializePhotoTimeline() {
  updatePhotoTimeline();
  
  // Set up search functionality
  const searchInput = document.getElementById('search-photos');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      updatePhotoTimeline(this.value);
    });
  }
  
  // Set up category filter
  const categorySelect = document.getElementById('category-select');
  if (categorySelect) {
    categorySelect.addEventListener('change', function() {
      updatePhotoTimeline(searchInput ? searchInput.value : '');
    });
  }
  
  // Set up sort options
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', function() {
      updatePhotoTimeline(searchInput ? searchInput.value : '');
    });
  }
}

function updatePhotoTimeline(searchTerm = '') {
  const gallery = document.getElementById('photo-gallery');
  const emptyState = document.getElementById('empty-gallery');
  const photos = getPhotos();
  
  // Get filter values
  const categoryFilter = document.getElementById('category-select').value;
  const sortOrder = document.getElementById('sort-select').value;
  
  // Clear existing photos
  gallery.innerHTML = '';
  
  if (photos.length === 0) {
    // Show empty state
    gallery.appendChild(emptyState);
    return;
  }
  
  // Filter photos
  let filteredPhotos = [...photos];
  
  // Apply category filter
  if (categoryFilter !== 'all') {
    filteredPhotos = filteredPhotos.filter(photo => photo.category === categoryFilter);
  }
  
  // Apply search filter
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filteredPhotos = filteredPhotos.filter(photo => 
      photo.caption.toLowerCase().includes(term) || 
      photo.displayDate.toLowerCase().includes(term)
    );
  }
  
  // Sort photos
  filteredPhotos.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });
  
  // Show message if no photos match filters
  if (filteredPhotos.length === 0) {
    const noResults = document.createElement('div');
    noResults.className = 'no-results';
    noResults.innerHTML = `
      <i class="material-icons">search_off</i>
      <h3>No photos match your filters</h3>
      <p>Try adjusting your search or filter criteria.</p>
    `;
    gallery.appendChild(noResults);
    return;
  }
  
  // Add photo cards
  filteredPhotos.forEach(photo => {
    const photoCard = createPhotoCard(photo);
    gallery.appendChild(photoCard);
  });
}

function createPhotoCard(photo) {
  const photoCard = document.createElement('div');
  photoCard.className = 'photo-card';
  photoCard.dataset.id = photo.id;
  
  // Create category badge
  let categoryLabel = 'Custom';
  if (photo.category === 'front') categoryLabel = 'Front View';
  if (photo.category === 'side') categoryLabel = 'Side View';
  if (photo.category === 'back') categoryLabel = 'Back View';
  
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
  `;
  
  // Add event listeners
  photoCard.querySelector('.delete-photo').addEventListener('click', function(e) {
    e.stopPropagation();
    const photoId = this.dataset.id;
    deletePhoto(photoId);
  });
  
  photoCard.querySelector('.set-as-before').addEventListener('click', function(e) {
    e.stopPropagation();
    const photoId = this.dataset.id;
    document.getElementById('before-select').value = photoId;
    document.getElementById('before-select').dispatchEvent(new Event('change'));
    document.getElementById('before-after').scrollIntoView({ behavior: 'smooth' });
  });
  
  photoCard.querySelector('.set-as-after').addEventListener('click', function(e) {
    e.stopPropagation();
    const photoId = this.dataset.id;
    document.getElementById('after-select').value = photoId;
    document.getElementById('after-select').dispatchEvent(new Event('change'));
    document.getElementById('before-after').scrollIntoView({ behavior: 'smooth' });
  });
  
  photoCard.querySelector('.btn-view-details').addEventListener('click', function(e) {
    e.stopPropagation();
    const photoId = this.dataset.id;
    viewPhotoDetails(photoId);
  });
  
  return photoCard;
}

function deletePhoto(photoId) {
  if (confirm('Are you sure you want to delete this photo? This action cannot be undone.')) {
    let photos = getPhotos();
    photos = photos.filter(photo => photo.id !== photoId);
    localStorage.setItem('progressPhotos', JSON.stringify(photos));
    
    // Update timeline and before/after options
    updatePhotoTimeline();
    updateBeforeAfterOptions();
    updateDashboardStats();
    
    showToast('Photo deleted successfully', 'success');
  }
}

function viewPhotoDetails(photoId) {
  const photos = getPhotos();
  const photo = photos.find(p => p.id === photoId);
  
  if (!photo) {
    showToast('Photo not found', 'error');
    return;
  }
  
  // Create modal for photo details
  const modal = document.createElement('div');
  modal.className = 'modal active';
  
  // Find weight entry from the same date if exists
  const weightLogs = getWeightLogs();
  const matchingWeight = weightLogs.find(log => {
    const logDate = new Date(log.date).toDateString();
    const photoDate = new Date(photo.date).toDateString();
    return logDate === photoDate;
  });
  
  // Find measurements from the same date if exists
  const measurements = getMeasurements();
  const matchingMeasurements = measurements.find(m => {
    const mDate = new Date(m.date).toDateString();
    const photoDate = new Date(photo.date).toDateString();
    return mDate === photoDate;
  });
  
  // Create category badge
  let categoryLabel = 'Custom';
  if (photo.category === 'front') categoryLabel = 'Front View';
  if (photo.category === 'side') categoryLabel = 'Side View';
  if (photo.category === 'back') categoryLabel = 'Back View';
  
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
            
            ${matchingWeight ? `
              <h3>Weight</h3>
              <p class="detail-weight">${matchingWeight.weight} ${matchingWeight.unit}</p>
            ` : ''}
            
            ${matchingMeasurements ? `
              <h3>Measurements</h3>
              <div class="measurements-grid">
                ${matchingMeasurements.chest ? `<div class="measurement-item"><span>Chest:</span> ${matchingMeasurements.chest} cm</div>` : ''}
                ${matchingMeasurements.waist ? `<div class="measurement-item"><span>Waist:</span> ${matchingMeasurements.waist} cm</div>` : ''}
                ${matchingMeasurements.hips ? `<div class="measurement-item"><span>Hips:</span> ${matchingMeasurements.hips} cm</div>` : ''}
                ${matchingMeasurements.bicep ? `<div class="measurement-item"><span>Bicep:</span> ${matchingMeasurements.bicep} cm</div>` : ''}
                ${matchingMeasurements.thigh ? `<div class="measurement-item"><span>Thigh:</span> ${matchingMeasurements.thigh} cm</div>` : ''}
                ${matchingMeasurements.calf ? `<div class="measurement-item"><span>Calf:</span> ${matchingMeasurements.calf} cm</div>` : ''}
              </div>
            ` : ''}
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
  `;
  
  // Add modal to body
  document.body.appendChild(modal);
  
  // Handle close button
  modal.querySelector('.close').addEventListener('click', () => {
    modal.remove();
  });
  
  // Handle modal close button
  modal.querySelector('.modal-close').addEventListener('click', () => {
    modal.remove();
  });
  
  // Handle AI analysis button
  modal.querySelector('.run-ai-analysis').addEventListener('click', () => {
    modal.remove();
    runAIAnalysis(photo);
    document.getElementById('ai-feedback').scrollIntoView({ behavior: 'smooth' });
  });
  
  // Close when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// =====================================================================
// BEFORE & AFTER COMPARISON
// =====================================================================

function initializeBeforeAfterComparison() {
  updateBeforeAfterOptions();
  
  const beforeSelect = document.getElementById('before-select');
  const afterSelect = document.getElementById('after-select');
  const beforeImage = document.getElementById('before-image-display');
  const afterImage = document.getElementById('after-image-display');
  const comparisonRange = document.getElementById('comparisonRange');
  const comparisonSlider = document.getElementById('comparison-slider');
  
  // Update images when selections change
  beforeSelect.addEventListener('change', updateComparisonImages);
  afterSelect.addEventListener('change', updateComparisonImages);
  
  // Handle comparison slider
  comparisonRange.addEventListener('input', function() {
    const value = this.value;
    afterImage.style.clipPath = `inset(0 ${100 - value}% 0 0)`;
    comparisonSlider.style.left = `${value}%`;
  });
  
  // Make slider draggable
  let isDragging = false;
  
  comparisonSlider.addEventListener('mousedown', function(e) {
    isDragging = true;
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', function(e) {
    if (!isDragging) return;
    
    const container = document.querySelector('.comparison-wrapper');
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const containerWidth = rect.width;
    
    // Calculate percentage
    let percent = (x / containerWidth) * 100;
    percent = Math.max(0, Math.min(100, percent));
    
    // Update slider position and clip path
    comparisonSlider.style.left = `${percent}%`;
    afterImage.style.clipPath = `inset(0 ${100 - percent}% 0 0)`;
    comparisonRange.value = percent;
  });
  
  document.addEventListener('mouseup', function() {
    isDragging = false;
  });
  
  // Touch events for mobile
  comparisonSlider.addEventListener('touchstart', function(e) {
    isDragging = true;
    e.preventDefault();
  });
  
  document.addEventListener('touchmove', function(e) {
    if (!isDragging) return;
    
    const container = document.querySelector('.comparison-wrapper');
    const rect = container.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const containerWidth = rect.width;
    
    // Calculate percentage
    let percent = (x / containerWidth) * 100;
    percent = Math.max(0, Math.min(100, percent));
    
    // Update slider position and clip path
    comparisonSlider.style.left = `${percent}%`;
    afterImage.style.clipPath = `inset(0 ${100 - percent}% 0 0)`;
    comparisonRange.value = percent;
  });
  
  document.addEventListener('touchend', function() {
    isDragging = false;
  });
  
  // Set initial clip on page load
  afterImage.style.clipPath = `inset(0 50% 0 0)`;
  comparisonSlider.style.left = '50%';
}

function updateBeforeAfterOptions() {
  const beforeSelect = document.getElementById('before-select');
  const afterSelect = document.getElementById('after-select');
  const photos = getPhotos();
  
  // Clear existing options except the first placeholder
  while (beforeSelect.options.length > 1) {
    beforeSelect.remove(1);
  }
  
  while (afterSelect.options.length > 1) {
    afterSelect.remove(1);
  }
  
  // Sort photos by date (oldest first)
  const sortedPhotos = [...photos];
  sortedPhotos.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Populate selects
  sortedPhotos.forEach(photo => {
    const beforeOption = document.createElement('option');
    beforeOption.value = photo.id;
    beforeOption.textContent = photo.displayDate;
    beforeSelect.appendChild(beforeOption);
    
    const afterOption = document.createElement('option');
    afterOption.value = photo.id;
    afterOption.textContent = photo.displayDate;
    afterSelect.appendChild(afterOption);
  });
  
  // Set default selections if at least 2 photos
  if (sortedPhotos.length >= 2) {
    beforeSelect.value = sortedPhotos[0].id; // Oldest photo
    afterSelect.value = sortedPhotos[sortedPhotos.length - 1].id; // Newest photo
    
    // Trigger update of images
    updateComparisonImages();
  }
}

function updateComparisonImages() {
  const beforeSelect = document.getElementById('before-select');
  const afterSelect = document.getElementById('after-select');
  const beforeImage = document.getElementById('before-image-display');
  const afterImage = document.getElementById('after-image-display');
  
  const beforeId = beforeSelect.value;
  const afterId = afterSelect.value;
  
  if (!beforeId || !afterId) return;
  
  const photos = getPhotos();
  const beforePhoto = photos.find(p => p.id === beforeId);
  const afterPhoto = photos.find(p => p.id === afterId);
  
  if (beforePhoto) {
    beforeImage.src = beforePhoto.fullData;
  }
  
  if (afterPhoto) {
    afterImage.src = afterPhoto.fullData;
  }
}

// =====================================================================
// WEIGHT LOGGING
// =====================================================================

function initializeWeightLogging() {
  const weightForm = document.getElementById('weight-form');
  
  weightForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const weightInput = document.getElementById('weight-input');
    const weightUnit = document.getElementById('weight-unit-log');
    const weightDate = document.getElementById('weight-date');
    const weightNotes = document.getElementById('weight-notes');
    
    const weight = parseFloat(weightInput.value);
    
    if (isNaN(weight) || weight <= 0) {
      showToast('Please enter a valid weight', 'error');
      return;
    }
    
    if (!weightDate.value) {
      showToast('Please select a date', 'error');
      return;
    }
    
    // Create weight log entry
    const weightLog = {
      id: generateId(),
      weight: weight,
      unit: weightUnit.value,
      date: new Date(weightDate.value).toISOString(),
      displayDate: formatDate(new Date(weightDate.value)),
      notes: weightNotes.value
    };
    
    // Save to localStorage
    saveWeightLog(weightLog);
    
    // Update weight history table
    updateWeightHistory();
    
    // Update dashboard stats
    updateDashboardStats();
    
    // Clear inputs
    weightInput.value = '';
    weightNotes.value = '';
    weightDate.value = new Date().toISOString().split('T')[0];
    
    showToast('Weight logged successfully!', 'success');
  });
  
  // Initial load of weight history
  updateWeightHistory();
}

function saveWeightLog(log) {
  let weightLogs = JSON.parse(localStorage.getItem('weightLogs')) || [];
  weightLogs.push(log);
  localStorage.setItem('weightLogs', JSON.stringify(weightLogs));
}

function getWeightLogs() {
  return JSON.parse(localStorage.getItem('weightLogs')) || [];
}

function updateWeightHistory() {
  const tableBody = document.getElementById('weight-history-body');
  const weightLogs = getWeightLogs();
  
  // Clear existing entries
  tableBody.innerHTML = '';
  
  if (weightLogs.length === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = '<td colspan="3" style="text-align: center;">No weight logs yet</td>';
    tableBody.appendChild(emptyRow);
    return;
  }
  
  // Sort by date (newest first)
  weightLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Add entries
  weightLogs.forEach((log, index) => {
    const row = document.createElement('tr');
    
    // Calculate weight change if not first entry
    let changeText = 'Initial';
    let changeClass = '';
    
    if (index < weightLogs.length - 1) {
      const currentWeight = log.weight;
      const previousWeight = weightLogs[index + 1].weight;
      const change = currentWeight - previousWeight;
      
      if (change > 0) {
        changeText = `+${change.toFixed(1)} ${log.unit}`;
        changeClass = 'text-error';
      } else if (change < 0) {
        changeText = `${change.toFixed(1)} ${log.unit}`;
        changeClass = 'text-success';
      } else {
        changeText = 'No change';
      }
    }
    
    row.innerHTML = `
      <td>${log.displayDate || formatDate(log.date)}</td>
      <td>${log.weight} ${log.unit}</td>
      <td class="${changeClass}">${changeText}</td>
    `;
    
    tableBody.appendChild(row);
  });
  
  // Update weight graph if visible
  if (document.querySelector('.chart-tab[data-chart="weight"].active')) {
    displayWeightGraph();
  }
}

// =====================================================================
// BODY MEASUREMENTS
// =====================================================================

function initializeMeasurements() {
  const saveButton = document.getElementById('save-measurements');
  
  saveButton.addEventListener('click', function() {
    // Get values from form
    const chest = parseFloat(document.getElementById('chest').value) || null;
    const waist = parseFloat(document.getElementById('waist').value) || null;
    const hips = parseFloat(document.getElementById('hips').value) || null;
    const bicep = parseFloat(document.getElementById('bicep').value) || null;
    const thigh = parseFloat(document.getElementById('thigh').value) || null;
    const calf = parseFloat(document.getElementById('calf').value) || null;
    
    // Validate that at least one measurement is filled
    if (chest === null && waist === null && hips === null && 
        bicep === null && thigh === null && calf === null) {
      showToast('Please enter at least one measurement', 'error');
      return;
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
      calf
    };
    
    // Save to localStorage
    saveMeasurement(measurements);
    
    // Clear form
    document.getElementById('chest').value = '';
    document.getElementById('waist').value = '';
    document.getElementById('hips').value = '';
    document.getElementById('bicep').value = '';
    document.getElementById('thigh').value = '';
    document.getElementById('calf').value = '';
    
    // Update measurement graph if visible
    if (document.querySelector('.chart-tab[data-chart="measurements"].active')) {
      displayMeasurementGraph();
    }
    
    showToast('Measurements saved successfully!', 'success');
  });
}

function saveMeasurement(measurements) {
  let allMeasurements = JSON.parse(localStorage.getItem('bodyMeasurements')) || [];
  allMeasurements.push(measurements);
  localStorage.setItem('bodyMeasurements', JSON.stringify(allMeasurements));
}

function getMeasurements() {
  return JSON.parse(localStorage.getItem('bodyMeasurements')) || [];
}

// =====================================================================
// PROGRESS GRAPHS
// =====================================================================

function initializeProgressGraphs() {
  const weightGraphBtn = document.getElementById('load-weight-graph');
  const measurementGraphBtn = document.getElementById('load-measurement-graph');
  const exportDataBtn = document.getElementById('export-data');
  
  weightGraphBtn.addEventListener('click', displayWeightGraph);
  measurementGraphBtn.addEventListener('click', displayMeasurementGraph);
  
  exportDataBtn.addEventListener('click', exportProgressData);
  
  // Load weight graph by default if data exists
  const weightLogs = getWeightLogs();
  if (weightLogs.length > 0) {
    displayWeightGraph();
  }
}

function updateChart(chartType) {
  if (chartType === 'weight') {
    displayWeightGraph();
  } else if (chartType === 'measurements') {
    displayMeasurementGraph();
  } else if (chartType === 'combined') {
    displayCombinedGraph();
  }
}

function displayWeightGraph() {
  const weightLogs = getWeightLogs();
  
  if (weightLogs.length === 0) {
    showToast('No weight data available yet', 'warning');
    return;
  }
  
  // Sort by date (oldest first for chart)
  weightLogs.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Extract dates and weights
  const dates = weightLogs.map(log => log.displayDate || formatDate(log.date));
  const weights = weightLogs.map(log => log.weight);
  const unit = weightLogs[0].unit;
  
  // Create graph using Plotly
  const data = [{
    x: dates,
    y: weights,
    type: 'scatter',
    mode: 'lines+markers',
    line: {
      color: '#6A1B9A',
      width: 3
    },
    marker: {
      color: '#FF6F00',
      size: 8
    }
  }];
  
  const layout = {
    title: 'Weight Progress',
    xaxis: {
      title: 'Date',
      tickfont: { color: '#cccccc' },
      gridcolor: 'rgba(255,255,255,0.1)',
      zerolinecolor: 'rgba(255,255,255,0.2)'
    },
    yaxis: {
      title: `Weight (${unit})`,
      tickfont: { color: '#cccccc' },
      gridcolor: 'rgba(255,255,255,0.1)',
      zerolinecolor: 'rgba(255,255,255,0.2)'
    },
    paper_bgcolor: '#1a1a1a',
    plot_bgcolor: '#121212',
    font: {
      color: '#ffffff'
    },
    margin: { t: 50, l: 60, r: 30, b: 50 },
    hoverlabel: {
      bgcolor: '#6A1B9A'
    }
  };
  
  const config = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['select2d', 'lasso2d']
  };
  
  Plotly.newPlot('progressChart', data, layout, config);
}

function displayMeasurementGraph() {
  const measurements = getMeasurements();
  
  if (measurements.length === 0) {
    showToast('No measurement data available yet', 'warning');
    return;
  }
  
  // Sort by date (oldest first for chart)
  measurements.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Extract dates
  const dates = measurements.map(m => m.displayDate || formatDate(m.date));
  
  // Create data series for each measurement type
  const data = [];
  
  const measurementTypes = ['chest', 'waist', 'hips', 'bicep', 'thigh', 'calf'];
  const colors = ['#6A1B9A', '#FF6F00', '#3498DB', '#2ECC71', '#E74C3C', '#F1C40F'];
  
  measurementTypes.forEach((type, index) => {
    // Check if we have any data for this measurement type
    const hasData = measurements.some(m => m[type] !== null);
    
    if (hasData) {
      const values = measurements.map(m => m[type]);
      
      data.push({
        x: dates,
        y: values,
        type: 'scatter',
        mode: 'lines+markers',
        name: type.charAt(0).toUpperCase() + type.slice(1),
        line: {
          color: colors[index],
          width: 2
        },
        marker: {
          color: colors[index],
          size: 6
        }
      });
    }
  });
  
  const layout = {
    title: 'Body Measurements Progress',
    xaxis: {
      title: 'Date',
      tickfont: { color: '#cccccc' },
      gridcolor: 'rgba(255,255,255,0.1)',
      zerolinecolor: 'rgba(255,255,255,0.2)'
    },
    yaxis: {
      title: 'Measurement (cm)',
      tickfont: { color: '#cccccc' },
      gridcolor: 'rgba(255,255,255,0.1)',
      zerolinecolor: 'rgba(255,255,255,0.2)'
    },
    paper_bgcolor: '#1a1a1a',
    plot_bgcolor: '#121212',
    font: {
      color: '#ffffff'
    },
    margin: { t: 50, l: 60, r: 30, b: 50 },
    legend: {
      orientation: 'h',
      xanchor: 'center',
      y: -0.2,
      x: 0.5
    },
    hoverlabel: {
      bgcolor: '#6A1B9A'
    }
  };
  
  const config = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['select2d', 'lasso2d']
  };
  
  Plotly.newPlot('progressChart', data, layout, config);
}

function displayCombinedGraph() {
  const weightLogs = getWeightLogs();
  const measurements = getMeasurements();
  
  if (weightLogs.length === 0 && measurements.length === 0) {
    showToast('No data available yet', 'warning');
    return;
  }
  
  // Create combined dataset
  const data = [];
  
  // Add weight data if available
  if (weightLogs.length > 0) {
    // Sort by date (oldest first)
    weightLogs.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Extract dates and weights
    const dates = weightLogs.map(log => log.displayDate || formatDate(log.date));
    const weights = weightLogs.map(log => log.weight);
    const unit = weightLogs[0].unit;
    
    data.push({
      x: dates,
      y: weights,
      type: 'scatter',
      mode: 'lines+markers',
      name: `Weight (${unit})`,
      line: {
        color: '#6A1B9A',
        width: 3
      },
      marker: {
        color: '#6A1B9A',
        size: 8
      },
      yaxis: 'y'
    });
  }
  
  // Add waist measurement if available (as example of key measurement)
  if (measurements.length > 0) {
    // Check if we have waist measurements
    const hasWaistData = measurements.some(m => m.waist !== null);
    
    if (hasWaistData) {
      // Sort by date (oldest first)
      measurements.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Extract dates and waist measurements
      const dates = measurements.map(m => m.displayDate || formatDate(m.date));
      const waistValues = measurements.map(m => m.waist);
      
      data.push({
        x: dates,
        y: waistValues,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Waist (cm)',
        line: {
          color: '#FF6F00',
          width: 2
        },
        marker: {
          color: '#FF6F00',
          size: 6
        },
        yaxis: 'y2'
      });
    }
  }
  
  const layout = {
    title: 'Combined Progress View',
    xaxis: {
      title: 'Date',
      tickfont: { color: '#cccccc' },
      gridcolor: 'rgba(255,255,255,0.1)',
      zerolinecolor: 'rgba(255,255,255,0.2)'
    },
    yaxis: {
      title: 'Weight',
      tickfont: { color: '#cccccc' },
      gridcolor: 'rgba(255,255,255,0.1)',
      zerolinecolor: 'rgba(255,255,255,0.2)',
      side: 'left'
    },
    yaxis2: {
      title: 'Measurements (cm)',
      tickfont: { color: '#cccccc' },
      gridcolor: 'rgba(255,255,255,0.1)',
      zerolinecolor: 'rgba(255,255,255,0.2)',
      overlaying: 'y',
      side: 'right'
    },
    paper_bgcolor: '#1a1a1a',
    plot_bgcolor: '#121212',
    font: {
      color: '#ffffff'
    },
    margin: { t: 50, l: 60, r: 60, b: 50 },
    legend: {
      orientation: 'h',
      xanchor: 'center',
      y: -0.2,
      x: 0.5
    },
    hoverlabel: {
      bgcolor: '#6A1B9A'
    }
  };
  
  const config = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['select2d', 'lasso2d']
  };
  
  Plotly.newPlot('progressChart', data, layout, config);
}

function exportProgressData() {
  // Gather all data
  const photos = getPhotos().map(photo => ({
    id: photo.id,
    date: photo.date,
    displayDate: photo.displayDate,
    category: photo.category,
    caption: photo.caption
    // Exclude the actual image data to keep file size reasonable
  }));
  
  const weightLogs = getWeightLogs();
  const measurements = getMeasurements();
  
  // Create export object
  const exportData = {
    exportDate: new Date().toISOString(),
    photos,
    weightLogs,
    measurements
  };
  
  // Convert to JSON
  const jsonData = JSON.stringify(exportData, null, 2);
  
  // Create download link
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `fitjourney-progress-export-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
  
  showToast('Progress data exported successfully!', 'success');
}

// =====================================================================
// AI FEEDBACK
// =====================================================================

function initializeAIFeedback() {
  const runAiButton = document.querySelector('.btn-run-ai');
  
  runAiButton.addEventListener('click', function() {
    const photos = getPhotos();
    
    if (photos.length === 0) {
      showToast('Please upload a photo first', 'warning');
      return;
    }
    
    // Get the most recent photo
    const sortedPhotos = [...photos].sort((a, b) => new Date(b.date) - new Date(a.date));
    const latestPhoto = sortedPhotos[0];
    
    runAIAnalysis(latestPhoto);
  });
}

// Simulate AI analysis with advanced feedback
function runAIAnalysis(photo) {
  const feedbackPlaceholder = document.querySelector('.ai-feedback-placeholder');
  const aiResults = document.getElementById('ai-results');
  
  // Show loading state
  feedbackPlaceholder.innerHTML = `
    <div class="loading-animation">
      <i class="material-icons rotating">autorenew</i>
      <p>Analyzing your photo...</p>
    </div>
  `;
  feedbackPlaceholder.style.display = 'block';
  aiResults.style.display = 'none';
  
  // Simulate AI processing time
  setTimeout(() => {
    // Generate simulated AI feedback
    const feedback = generateAIFeedback(photo);
    
    // Display results
    aiResults.innerHTML = feedback;
    feedbackPlaceholder.style.display = 'none';
    aiResults.style.display = 'block';
    
    showToast('AI analysis completed!', 'success');
  }, 2500);
}

// Generate simulated AI feedback
function generateAIFeedback(photo) {
  // This is a simulation - in a real app, this would call an AI API
  const possibleObservations = [
    'Good posture evident in this photo.',
    'Visible progress in muscle definition compared to previous uploads.',
    'Consider improving stance for better stability.',
    'Lighting conditions are optimal for progress tracking.',
    'Body symmetry appears balanced.',
    'Clothing choice allows for good visibility of progress.',
    'Possible signs of improved shoulder/hip ratio.',
    'Core engagement is visible.',
    'Good progress visible in targeted areas.',
    'Consistent posing helps with accurate progress tracking.'
  ];
  
  const possibleRecommendations = [
    'Continue your current training regimen for consistent results.',
    'Consider increasing protein intake for muscle development.',
    'Focus on hydration for better recovery between workouts.',
    'Try incorporating more compound movements for balanced development.',
    'Add more rest days to your schedule for optimal recovery.',
    'Consider progressive overload to continue seeing results.',
    'Maintain consistent photo angles for better comparison.',
    'Try alternating between strength and cardiovascular training.',
    'Consider tracking measurements alongside photos for comprehensive progress monitoring.',
    'Continue with current nutritional approach as progress is visible.'
  ];
  
  // Select random observations and recommendations for simulation
  const numObservations = 3 + Math.floor(Math.random() * 3); // 3-5 observations
  const numRecommendations = 2 + Math.floor(Math.random() * 2); // 2-3 recommendations
  
  const selectedObservations = [];
  const selectedRecommendations = [];
  
  for (let i = 0; i < numObservations; i++) {
    const index = Math.floor(Math.random() * possibleObservations.length);
    selectedObservations.push(possibleObservations[index]);
    possibleObservations.splice(index, 1); // Remove to avoid duplicates
  }
  
  for (let i = 0; i < numRecommendations; i++) {
    const index = Math.floor(Math.random() * possibleRecommendations.length);
    selectedRecommendations.push(possibleRecommendations[index]);
    possibleRecommendations.splice(index, 1); // Remove to avoid duplicates
  }
  
  // Generate body composition prediction (simulated)
  const bodyFat = (20 + Math.random() * 10).toFixed(1);
  const muscleMass = (60 + Math.random() * 20).toFixed(1);
  
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
  `;
  
  // Add observations
  selectedObservations.forEach(observation => {
    html += `<li>${observation}</li>`;
  });
  
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
  `;
  
  // Add recommendations
  selectedRecommendations.forEach(recommendation => {
    html += `<li>${recommendation}</li>`;
  });
  
  html += `
          </ul>
        </div>
        
        <div class="ai-disclaimer">
          <p><i class="material-icons">info</i> This is an AI-powered estimation. For professional advice, consult with a certified fitness or healthcare professional.</p>
        </div>
      </div>
    </div>
  `;
  
  return html;
}

// =====================================================================
// CHATBOT
// =====================================================================

function initializeChatBot() {
  const chatToggle = document.getElementById('chat-toggle');
  const chatbot = document.getElementById('ai-chatbot');
  const closeChat = document.getElementById('close-chat');
  const sendChat = document.getElementById('send-chat');
  const chatInput = document.getElementById('chat-input');
  const chatBody = document.getElementById('chat-body');
  
  // Toggle chatbot visibility
  chatToggle.addEventListener('click', function() {
    chatbot.classList.toggle('hidden');
    if (!chatbot.classList.contains('hidden')) {
      chatInput.focus();
    }
  });
  
  // Close chatbot
  closeChat.addEventListener('click', function() {
    chatbot.classList.add('hidden');
  });
  
  // Send message
  sendChat.addEventListener('click', sendMessage);
  
  // Send message on Enter key
  chatInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
  
  function sendMessage() {
    const message = chatInput.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addMessage(message, true);
    
    // Clear input
    chatInput.value = '';
    
    // Process message and respond
    processMessage(message);
  }
  
  function addMessage(message, isUser = false) {
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${isUser ? 'user' : 'bot'}`;
    messageElement.textContent = message;
    
    chatBody.appendChild(messageElement);
    
    // Scroll to bottom
    chatBody.scrollTop = chatBody.scrollHeight;
  }
  
  function processMessage(message) {
    // Simple keyword-based responses
    message = message.toLowerCase();
    
    // Add typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'chat-message bot typing';
    typingIndicator.innerHTML = '<span class="typing-dots"><span>.</span><span>.</span><span>.</span></span>';
    chatBody.appendChild(typingIndicator);
    
    // Scroll to bottom
    chatBody.scrollTop = chatBody.scrollHeight;
    
    // Simulate AI thinking time
    setTimeout(() => {
      // Remove typing indicator
      chatBody.removeChild(typingIndicator);
      
      let response = '';
      
      if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
        response = "Hello! How can I assist with your fitness progress tracking today?";
      }
      else if (message.includes('help') || message.includes('how') || message.includes('work')) {
        response = "I can help you track your fitness progress! You can upload photos, log your weight, track measurements, and compare your progress over time. What would you like to know more about?";
      }
      else if (message.includes('photo') || message.includes('picture') || message.includes('image')) {
        response = "To upload a progress photo, go to the 'Upload Your Progress Photo' section. You can view all your photos in the 'Transformation Timeline' and compare before/after in the comparison tool.";
      }
      else if (message.includes('weight') || message.includes('weigh')) {
        response = "You can log your weight in the 'Weight Tracker' section. Your weight history will be displayed in a table and you can visualize your progress in graphs.";
      }
      else if (message.includes('measure') || message.includes('size')) {
        response = "Track your body measurements in the 'Body Measurements' section. Log measurements like chest, waist, hips, and more to get a comprehensive view of your body changes.";
      }
      else if (message.includes('graph') || message.includes('chart') || message.includes('visual')) {
        response = "Your progress graphs are available in the 'Progress Graphs' section. You can view weight trends and measurement changes over time.";
      }
      else if (message.includes('compare') || message.includes('before') || message.includes('after')) {
        response = "Use the 'Before & After Comparison' tool to visually compare any two photos from your timeline. The slider helps you see the difference clearly.";
      }
      else if (message.includes('ai') || message.includes('analysis') || message.includes('feedback')) {
        response = "Our AI analysis tool examines your photos and provides observations about your progress. Upload a photo and click 'Run AI Analysis' to get personalized insights.";
      }
      else if (message.includes('thank')) {
        response = "You're welcome! I'm here to help with any questions about tracking your fitness journey.";
      }
      else {
        response = "I'm not sure I understand. Would you like to know more about tracking photos, logging weight, recording measurements, or using the comparison tools?";
      }
      
      // Add response to chat
      addMessage(response);
    }, 1500);
  }
}
