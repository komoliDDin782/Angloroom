// ===== DOM ELEMENTS =====
const flipper = document.getElementById('flipper');
const flipToBackBtn = document.getElementById('flip-to-back-btn');
const flipToFrontBtn = document.getElementById('flip-to-front-btn');
const saveSettingsBtn = document.getElementById('save-settings-btn');

// Front card elements
const nicknameDisplay = document.getElementById('nickname-display');
const aboutDisplay = document.getElementById('about-display');
const levelDisplay = document.getElementById('level-display');
const profilePicImage = document.getElementById('profile-pic');
const profileTopBg = document.getElementById('profile-top-bg');
const levelSteps = document.querySelectorAll('.level-step');
const quizCountDisplay = document.getElementById('quiz-count');
const correctAnswersDisplay = document.getElementById('correct-answers-count');
const lightningDisplay = document.getElementById('lightning-count');

// Back card elements
const nicknameInput = document.getElementById('nickname-input');
const aboutInput = document.getElementById('about-input');
const profilePicInput = document.getElementById('profile-pic-input');
const bgPicInput = document.getElementById('bg-pic-input');
const logoutBtn = document.getElementById('logout-btn');
const templateOptions = document.querySelectorAll('.template-option');
const templateLabels = document.querySelectorAll('.template-label');

const toast = document.getElementById('toast');

// ===== TEMPLATE SYSTEM (uses shared template.js) =====
let lastSavedTemplate = 'emerald';
let pendingTemplate = null;

// Initialize template system from shared module
function initTemplateSystem() {
  // Get the current template from body class
  TEMPLATES.forEach(t => {
    if (document.body.classList.contains(`template-${t}`)) {
      lastSavedTemplate = t;
    }
  });
  
  // Update UI to match
  updateTemplateUI(lastSavedTemplate);
}

// Update template selector UI
function updateTemplateUI(templateName) {
  templateOptions.forEach(opt => {
    const isActive = opt.dataset.template === templateName;
    opt.classList.toggle('active', isActive);
  });
  
  templateLabels.forEach(label => {
    const wrapper = label.parentElement;
    const option = wrapper.querySelector('.template-option');
    const isActive = option.dataset.template === templateName;
    label.style.color = isActive ? 'var(--primary)' : '';
    label.style.fontWeight = isActive ? '600' : '400';
  });
}

// Live preview template (doesn't save to Firestore)
function previewTemplate(templateName) {
  if (templateName === lastSavedTemplate && !pendingTemplate) return;
  
  // Apply template visually using shared function
  if (typeof applyTemplate === 'function') {
    applyTemplate(templateName);
  }
  
  updateTemplateUI(templateName);
  pendingTemplate = templateName;
  
  showToast(`🎨 Preview: ${capitalize(templateName)} theme`);
}

// Template click handler
templateOptions.forEach(option => {
  option.addEventListener('click', () => {
    const template = option.dataset.template;
    previewTemplate(template);
  });
});

// ===== STATE =====
let currentUser = null;
let isSaving = false;
let isFlipped = false;
let toastTimer = null;

// ===== TOAST SYSTEM =====
function showToast(message, isError = false) {
  if (toastTimer) clearTimeout(toastTimer);
  toast.textContent = message;
  toast.className = 'toast' + (isError ? ' error' : '') + ' show';
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// ===== FLIP LOGIC =====
function flipToBack() {
  if (isSaving) return;
  
  // Populate back card with current values
  nicknameInput.value = nicknameDisplay.textContent;
  aboutInput.value = aboutDisplay.textContent === 'Tell something about yourself.' 
    ? '' 
    : aboutDisplay.textContent;
  
  // Reset file inputs
  profilePicInput.value = '';
  bgPicInput.value = '';
  
  // Sync template state
  lastSavedTemplate = getCurrentTemplateFromBody();
  pendingTemplate = null;
  updateTemplateUI(lastSavedTemplate);
  
  flipper.classList.add('flipped');
  isFlipped = true;
}

function flipToFront() {
  if (isSaving) return;
  
  // If template was changed but not saved, revert to last saved
  if (pendingTemplate && pendingTemplate !== lastSavedTemplate) {
    if (typeof applyTemplate === 'function') {
      applyTemplate(lastSavedTemplate);
    }
    pendingTemplate = null;
  }
  
  flipper.classList.remove('flipped');
  isFlipped = false;
}

// Helper to get current template from body
function getCurrentTemplateFromBody() {
  let current = 'emerald';
  TEMPLATES.forEach(t => {
    if (document.body.classList.contains(`template-${t}`)) {
      current = t;
    }
  });
  return current;
}

flipToBackBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  flipToBack();
});

flipToFrontBtn.addEventListener('click', () => {
  flipToFront();
});

// ===== AUTH =====
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  currentUser = user;
  await loadProfile();
});

// ===== LOAD PROFILE =====
async function loadProfile() {
  try {
    const doc = await db.collection('users').doc(currentUser.uid).get();
    const data = doc.exists ? doc.data() : {};

    // Update basic profile info
    if (data.nickname) nicknameDisplay.textContent = data.nickname;
    if (data.profilePic) profilePicImage.src = data.profilePic;
    if (data.profileBg) profileTopBg.style.backgroundImage = `url(${data.profileBg})`;

    aboutDisplay.textContent = data.about || 'Tell something about yourself.';

    // Update level
    if (data.level) {
      levelDisplay.textContent = `Level: ${capitalize(data.level)}`;
      updateLevelProgress(data.level);
    } else {
      levelDisplay.textContent = 'Level: not set';
      resetLevelProgress();
    }

    // Update stats
    const quizCount = data.quizCount != null ? data.quizCount : 0;
    const correctAnswers = data.correctAnswers != null ? data.correctAnswers : 0;
    const lightningCount = data.lightningCount != null ? data.lightningCount : 0;

    if (quizCountDisplay) quizCountDisplay.textContent = quizCount;
    if (correctAnswersDisplay) correctAnswersDisplay.textContent = correctAnswers;
    if (lightningDisplay) lightningDisplay.textContent = lightningCount;
    
    // Initialize template after profile loads
    initTemplateSystem();
    
  } catch (err) {
    console.error('Profile load error:', err);
    showToast('Failed to load profile', true);
  }
}

// ===== LEVEL PROGRESS =====
function updateLevelProgress(level) {
  resetLevelProgress();
  switch (level) {
    case 'beginner':
      levelSteps[0].classList.add('active', 'beginner');
      break;
    case 'elementary':
      levelSteps[0].classList.add('active', 'beginner');
      levelSteps[1].classList.add('active', 'elementary');
      break;
    case 'intermediate':
      levelSteps[0].classList.add('active', 'beginner');
      levelSteps[1].classList.add('active', 'elementary');
      levelSteps[2].classList.add('active', 'intermediate');
      break;
    case 'advanced':
      levelSteps[0].classList.add('active', 'beginner');
      levelSteps[1].classList.add('active', 'elementary');
      levelSteps[2].classList.add('active', 'intermediate');
      levelSteps[3].classList.add('active', 'advanced');
      break;
    default:
      break;
  }
}

function resetLevelProgress() {
  levelSteps.forEach(step => {
    step.className = 'level-step';
  });
}

// ===== IMGBB UPLOAD =====
async function uploadImageToImgBB(file) {
  const API_KEY = '7a4357485dc65af8bbe234efb1c3803a';
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const formData = new FormData();
  formData.append('key', API_KEY);
  formData.append('image', base64);
  const res = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: formData });
  const data = await res.json();
  if (!data.success) throw new Error('ImgBB upload failed');
  return data.data.url;
}

// ===== SAVE SETTINGS =====
saveSettingsBtn.addEventListener('click', async () => {
  if (isSaving) return;
  isSaving = true;
  saveSettingsBtn.disabled = true;
  saveSettingsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

  try {
    const updates = {};
    const nickname = nicknameInput.value.trim();
    
    if (!nickname) {
      throw new Error('Nickname cannot be empty');
    }

    if (nickname !== nicknameDisplay.textContent) {
      updates.nickname = nickname;
    }

    const about = aboutInput.value.trim();
    if (about !== (aboutDisplay.textContent === 'Tell something about yourself.' ? '' : aboutDisplay.textContent)) {
      updates.about = about;
    }

    if (profilePicInput.files[0]) {
      const imageUrl = await uploadImageToImgBB(profilePicInput.files[0]);
      updates.profilePic = imageUrl;
    }

    if (bgPicInput.files[0]) {
      const imageUrl = await uploadImageToImgBB(bgPicInput.files[0]);
      updates.profileBg = imageUrl;
    }

    // Save template if changed
    if (pendingTemplate && pendingTemplate !== lastSavedTemplate) {
      updates.template = pendingTemplate;
    }

    if (Object.keys(updates).length === 0) {
      showToast('No changes to save');
      flipToFront();
      return;
    }

    await db.collection('users').doc(currentUser.uid).set(updates, { merge: true });

    // Update front card display
    if (updates.nickname) nicknameDisplay.textContent = updates.nickname;
    if (updates.about !== undefined) aboutDisplay.textContent = updates.about || 'Tell something about yourself.';
    if (updates.profilePic) profilePicImage.src = updates.profilePic;
    if (updates.profileBg) profileTopBg.style.backgroundImage = `url(${updates.profileBg})`;
    
    // Update template state
    if (updates.template) {
      lastSavedTemplate = updates.template;
      pendingTemplate = null;
      showToast('✅ Profile & theme updated!');
    } else {
      showToast('✅ Profile updated successfully!');
    }
    
    // Auto flip back to front after successful save
    setTimeout(() => {
      flipToFront();
    }, 800);
    
  } catch (err) {
    console.error('Save error:', err);
    showToast(err.message || 'Failed to save changes', true);
  } finally {
    isSaving = false;
    saveSettingsBtn.disabled = false;
    saveSettingsBtn.innerHTML = '<i class="fas fa-check"></i> Save Changes';
  }
});

// ===== LOGOUT =====
logoutBtn.addEventListener('click', async () => { 
  try {
    await auth.signOut();
    window.location.href = 'index.html';
  } catch (err) {
    console.error('Logout error:', err);
    showToast('Logout failed', true);
  }
});

// ===== UTILS =====
function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}