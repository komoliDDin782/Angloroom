const settingsBtn = document.getElementById('settings-btn');
const settingsDropdown = document.getElementById('settings-dropdown');
const changeNicknameBtn = document.getElementById('change-nickname');
const nicknameDisplay = document.getElementById('nickname-display');
const nicknameInput = document.getElementById('nickname');
const saveProfileBtn = document.getElementById('save-profile-btn');

const profilePicInput = document.getElementById('profile-pic-input');
const profilePicImage = document.getElementById('profile-pic');
const logoutBtn = document.getElementById('logout-btn');
const levelDisplay = document.getElementById('level-display');
const levelSteps = document.querySelectorAll('.level-step');

const changeBgBtn = document.getElementById('change-bg');
const bgPicInput = document.getElementById('bg-pic-input');
const profileTopBg = document.querySelector('.profile-top-bg');

let currentUser;
let isSaving = false;

/* ---------- Dropdown ---------- */
settingsBtn.addEventListener('click', e => {
  e.stopPropagation();
  settingsDropdown.style.display =
    settingsDropdown.style.display === 'block' ? 'none' : 'block';
});

window.addEventListener('click', () => {
  settingsDropdown.style.display = 'none';
});

/* ---------- Auth ---------- */
auth.onAuthStateChanged(async user => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  currentUser = user;
  loadProfile();
});

/* ---------- Load profile ---------- */
async function loadProfile() {
  try {
    const doc = await db.collection('users').doc(currentUser.uid).get();
    if (!doc.exists) return;

    const data = doc.data();

    if (data.nickname) nicknameDisplay.textContent = data.nickname;
    if (data.profilePic) profilePicImage.src = data.profilePic;
    if (data.profileBg) profileTopBg.style.backgroundImage = `url(${data.profileBg})`;

    if (data.level) {
      levelDisplay.textContent = `Level: ${capitalize(data.level)}`;
      updateLevelProgress(data.level);
    } else {
      levelDisplay.textContent = 'Level: not set';
      resetLevelProgress();
    }
  } catch (err) {
    console.error('Profile load error:', err);
  }
}

/* ---------- Level progress ---------- */
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
      resetLevelProgress();
  }
}


function resetLevelProgress() {
  levelSteps.forEach(step => step.className = 'level-step');
}

/* ---------- Change nickname ---------- */
changeNicknameBtn.addEventListener('click', () => {
  nicknameInput.value = nicknameDisplay.textContent;
  nicknameInput.style.display = 'block';
  nicknameDisplay.style.display = 'none';
  saveProfileBtn.style.display = 'inline-block';
});

/* ---------- Change profile pic ---------- */
profilePicInput.addEventListener('change', () => {
  const file = profilePicInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => profilePicImage.src = e.target.result;
  reader.readAsDataURL(file);
  saveProfileBtn.style.display = 'inline-block';
});

/* ---------- Change background pic ---------- */
changeBgBtn.addEventListener('click', () => bgPicInput.click());
bgPicInput.addEventListener('change', () => {
  const file = bgPicInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => profileTopBg.style.backgroundImage = `url(${e.target.result})`;
  reader.readAsDataURL(file);
  saveProfileBtn.style.display = 'inline-block';
});

/* ---------- ImgBB upload ---------- */
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

/* ---------- Save profile ---------- */
saveProfileBtn.addEventListener('click', async () => {
  if (isSaving) return;
  isSaving = true;
  saveProfileBtn.textContent = 'Saving...';

  try {
    const updates = {};

    if (nicknameInput.style.display === 'block') {
      const nickname = nicknameInput.value.trim();
      if (!nickname) throw new Error('Nickname required');
      updates.nickname = nickname;
    }

    if (profilePicInput.files[0]) {
      const imageUrl = await uploadImageToImgBB(profilePicInput.files[0]);
      updates.profilePic = imageUrl;
      profilePicImage.src = imageUrl;
    }

    if (bgPicInput.files[0]) {
      const imageUrl = await uploadImageToImgBB(bgPicInput.files[0]);
      updates.profileBg = imageUrl;
      profileTopBg.style.backgroundImage = `url(${imageUrl})`;
    }

    await db.collection('users').doc(currentUser.uid).set(updates, { merge: true });

    if (updates.nickname) {
      nicknameDisplay.textContent = updates.nickname;
      nicknameDisplay.style.display = 'block';
      nicknameInput.style.display = 'none';
    }

    saveProfileBtn.style.display = 'none';
    alert('Profile updated');
  } catch (err) {
    console.error(err);
    alert(err.message || 'Failed to update profile');
  } finally {
    isSaving = false;
    saveProfileBtn.textContent = 'Save Changes';
  }
});

/* ---------- Logout ---------- */
logoutBtn.addEventListener('click', async () => {
  try {
    await auth.signOut();
    window.location.href = 'index.html';
  } catch (err) {
    console.error(err);
    alert('Logout failed');
  }
});

/* ---------- Utils ---------- */
function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
