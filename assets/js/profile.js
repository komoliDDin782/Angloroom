const nicknameInput = document.getElementById('nickname');
const saveProfileBtn = document.getElementById('save-profile-btn');
const logoutBtn = document.getElementById('logout-btn');

let currentUser;

// Check login state
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  currentUser = user;
  await loadProfile();
});

// Load current nickname
async function loadProfile() {
  try {
    const doc = await db.collection('users').doc(currentUser.uid).get();
    if (doc.exists) {
      const data = doc.data();
      if (data.nickname) nicknameInput.value = data.nickname;
    }
  } catch (err) {
    console.error("Error loading profile:", err);
  }
}

// Save nickname
saveProfileBtn.addEventListener('click', async () => {
  const nickname = nicknameInput.value.trim();
  if (!nickname) return alert("Enter a nickname");

  try {
    await db.collection('users').doc(currentUser.uid).set({ nickname }, { merge: true });
    alert("Nickname updated!");
  } catch (err) {
    console.error("Error saving nickname:", err);
    alert("Failed to update nickname. Try again.");
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
