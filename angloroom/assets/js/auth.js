// assets/js/auth.js

const authForm = document.getElementById('auth-form');

// Handle login or automatic sign-up
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) {
    alert("Please enter both email and password.");
    return;
  }

  try {
    // Attempt to log in
    await auth.signInWithEmailAndPassword(email, password);
    // Login successful → redirect handled by onAuthStateChanged
  } catch (loginError) {
    // If account doesn't exist → create automatically
    if (loginError.code === "auth/user-not-found") {
      try {
        await auth.createUserWithEmailAndPassword(email, password);
        // Redirect handled by onAuthStateChanged
      } catch (signupError) {
        alert(`Sign-up failed: ${signupError.message}`);
      }
    } 
    // Wrong password
    else if (loginError.code === "auth/wrong-password") {
      alert("Incorrect password. Try again.");
    } 
    // Invalid email format
    else if (loginError.code === "auth/invalid-email") {
      alert("Invalid email format.");
    } 
    // Other unexpected errors
    else {
      alert(`Login failed: ${loginError.message}`);
    }
  }
});

// Automatically redirect logged-in users
auth.onAuthStateChanged(user => {
  if (user) {
    const adminEmail = "komoliddinkevin@gmail.com"; // Admin email
    if (user.email === adminEmail) {
      window.location.href = "admin.html"; // Go to admin panel
    } else {
      window.location.href = "main.html";  // Students go to main page
    }
  }
});
