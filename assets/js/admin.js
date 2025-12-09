// assets/js/admin.js

const resultsContainer = document.getElementById('results-container');
const clearAllBtn = document.getElementById('clear-all-results');
const logoutBtn = document.getElementById('logout-btn');

const adminEmail = "komoliddinkevin@gmail.com"; // Admin email
let currentUser;

// Ensure only admin can access
auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  currentUser = user;

  if (user.email !== adminEmail) {
    alert("Access denied. Only admin can view this page.");
    window.location.href = "main.html";
    return;
  }

  loadResults();
});

// Load all student results
async function loadResults() {
  try {
    const snapshot = await db.collection('results')
      .orderBy('score', 'desc')
      .get();

    if (snapshot.empty) {
      resultsContainer.innerHTML = "<p>No results yet.</p>";
      return;
    }

    let html = `<table class="results-table">
                  <tr>
                    <th>Nickname</th>
                    <th>Quiz</th>
                    <th>Score</th>
                    <th>Total</th>
                  </tr>`;

    for (const doc of snapshot.docs) {
      const r = doc.data();
      let nickname = r.nickname || "";

      if (!nickname) {
        try {
          const userDoc = await db.collection('users').doc(r.userId).get();
          nickname = userDoc.exists ? userDoc.data().nickname || r.userId : r.userId;
        } catch {
          nickname = r.userId;
        }
      }

      html += `<tr>
                 <td>${nickname}</td>
                 <td>${r.quizId}</td>
                 <td>${r.score}</td>
                 <td>${r.total}</td>
               </tr>`;
    }

    html += "</table>";
    resultsContainer.innerHTML = html;

  } catch (err) {
    console.error("Error loading results:", err);
    resultsContainer.innerHTML = "<p>Failed to load results.</p>";
  }
}

// Clear all student results
if (clearAllBtn) {
  clearAllBtn.addEventListener('click', async () => {
    if (!currentUser || currentUser.email !== adminEmail) return;

    const confirmDelete = confirm("Are you sure you want to delete ALL students' results?");
    if (!confirmDelete) return;

    try {
      const snapshot = await db.collection('results').get();
      const batch = db.batch();
      snapshot.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      alert("All student results cleared!");
      loadResults();
    } catch (err) {
      console.error("Failed to clear results:", err);
      alert("Error deleting results. Try again.");
    }
  });
}

// Log out button
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try {
      await auth.signOut();
      window.location.href = "index.html";
    } catch (err) {
      console.error("Logout failed:", err);
      alert("Failed to log out. Try again.");
    }
  });
}
