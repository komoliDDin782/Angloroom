// Get elements
const nicknameInput = document.getElementById('nickname');
const saveProfileBtn = document.getElementById('save-profile-btn');
const logoutBtn = document.getElementById('logout-btn');

const profilePicInput = document.getElementById('profile-pic-input');
const profilePicImage = document.getElementById('profile-pic');

let currentUser;

// Login check
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }
  currentUser = user;
  await loadProfile();
});

// Load user data
async function loadProfile() {
  try {
    const doc = await db.collection('users').doc(currentUser.uid).get();
    if (doc.exists) {
      const data = doc.data();
      if (data.nickname) nicknameInput.value = data.nickname;
      if (data.profilePic) profilePicImage.src = data.profilePic;
    }
  } catch (err) {
    console.error("Error loading profile:", err);
  }
}

// Upload to ImgBB
async function uploadImageToImgBB(file) {
  const API_KEY = "7a4357485dc65af8bbe234efb1c3803a";

  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const formData = new FormData();
  formData.append("key", API_KEY);
  formData.append("image", base64);

  const res = await fetch("https://api.imgbb.com/1/upload", {
    method: "POST",
    body: formData
  });

  const data = await res.json();

  if (!data.success) throw new Error("ImgBB upload failed");

  return data.data.url;
}

// Save BOTH nickname + profile picture
saveProfileBtn.addEventListener('click', async () => {
  const nickname = nicknameInput.value.trim();
  const file = profilePicInput.files[0];

  if (!nickname) return alert("Enter a nickname");

  try {
    let imageUrl = null;

    // If user selected a new picture → upload first
    if (file) {
      imageUrl = await uploadImageToImgBB(file);
    }

    const updateData = { nickname };

    if (imageUrl) {
      updateData.profilePic = imageUrl;
      profilePicImage.src = imageUrl; // update preview
    }

    await db.collection('users').doc(currentUser.uid).set(updateData, { merge: true });

    alert("Profile updated!");

  } catch (err) {
    console.error("Failed to save profile:", err);
    alert("Error updating profile.");
  }
});

// Logout
logoutBtn.addEventListener('click', async () => {
  try {
    await auth.signOut();
    window.location.href = "index.html";
  } catch (err) {
    console.error("Logout failed:", err);
    alert("Failed to log out.");
  }
});
