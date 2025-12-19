// assets/js/auth.js

const authForm = document.getElementById('auth-form');

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) {
    alert("Please enter both email and password.");
    return;
  }

  try {
    // Sign in ONLY existing users
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // Manual redirect AFTER successful login
    const adminEmail = "komoliddinkevin@gmail.com";

    if (user.email === adminEmail) {
      window.location.href = "admin.html";
    } else {
      window.location.href = "main.html";
    }

  } catch (error) {
    switch (error.code) {
      case "auth/user-not-found":
        alert("No account found. Please contact admin to register.");
        break;
      case "auth/wrong-password":
        alert("Incorrect password.");
        break;
      case "auth/invalid-email":
        alert("Invalid email format.");
        break;
      default:
        alert(error.message);
    }
  }
});
