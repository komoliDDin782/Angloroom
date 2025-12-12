const settingsBtn = document.getElementById('settings-btn');
const settingsDropdown = document.getElementById('settings-dropdown');
const changeNicknameBtn = document.getElementById('change-nickname');
const nicknameDisplay = document.getElementById('nickname-display');
const nicknameInput = document.getElementById('nickname');
const saveProfileBtn = document.getElementById('save-profile-btn');

const profilePicInput = document.getElementById('profile-pic-input');
const profilePicImage = document.getElementById('profile-pic');

let currentUser;

// Toggle dropdown
settingsBtn.addEventListener('click', () => {
  settingsDropdown.style.display = settingsDropdown.style.display === 'block' ? 'none' : 'block';
});
window.addEventListener('click', (e) => {
  if (!settingsBtn.contains(e.target)) settingsDropdown.style.display = 'none';
});

// Firebase auth check
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }
  currentUser = user;
  await loadProfile();
});

// Load profile data
async function loadProfile() {
  try {
    const doc = await db.collection('users').doc(currentUser.uid).get();
    if (doc.exists) {
      const data = doc.data();
      if (data.nickname) nicknameDisplay.textContent = data.nickname;
      if (data.profilePic) profilePicImage.src = data.profilePic;
    }
  } catch (err) {
    console.error("Error loading profile:", err);
  }
}

// Change nickname
changeNicknameBtn.addEventListener('click', () => {
  nicknameInput.style.display = 'block';
  nicknameInput.value = nicknameDisplay.textContent;
  nicknameDisplay.style.display = 'none';
  saveProfileBtn.style.display = 'inline-block';
});

// Profile picture preview
profilePicInput.addEventListener('change', () => {
  const file = profilePicInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (ev) => profilePicImage.src = ev.target.result;
    reader.readAsDataURL(file);
    saveProfileBtn.style.display = 'inline-block';
  }
});

// Upload to ImgBB
async function uploadImageToImgBB(file) {
  const API_KEY = "7a4357485dc65af8bbe234efb1c3803a";
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const formData = new FormData();
  formData.append("key", API_KEY);
  formData.append("image", base64);
  const res = await fetch("https://api.imgbb.com/1/upload", { method: "POST", body: formData });
  const data = await res.json();
  if (!data.success) throw new Error("ImgBB upload failed");
  return data.data.url;
}

// Save profile (nickname optional)
saveProfileBtn.addEventListener('click', async () => {
  const nickname = nicknameInput.style.display === 'block'
    ? nicknameInput.value.trim()
    : nicknameDisplay.textContent;

  const file = profilePicInput.files[0];

  if (nicknameInput.style.display === 'block' && !nickname) {
    return alert("Enter a nickname");
  }

  try {
    let imageUrl = null;
    if (file) imageUrl = await uploadImageToImgBB(file);

    const updateData = { nickname };
    if (imageUrl) updateData.profilePic = imageUrl;

    await db.collection('users').doc(currentUser.uid).set(updateData, { merge: true });

    // Update display
    nicknameDisplay.textContent = nickname;
    nicknameDisplay.style.display = 'block';
    nicknameInput.style.display = 'none';
    saveProfileBtn.style.display = 'none';

    if (imageUrl) profilePicImage.src = imageUrl;

    alert("Profile updated!");
  } catch (err) {
    console.error(err);
    alert("Error updating profile.");
  }
});

// Logout
document.getElementById('logout-btn').addEventListener('click', async () => {
  try {
    await auth.signOut();
    window.location.href = "index.html";
  } catch (err) {
    console.error(err);
    alert("Failed to log out.");
  }
});
