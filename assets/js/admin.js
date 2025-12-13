const btnResults = document.getElementById('btn-results');
const btnStudents = document.getElementById('btn-students');

const resultsOverlay = document.getElementById('results-overlay');
const studentsOverlay = document.getElementById('students-overlay');

const closeResultsBtn = document.getElementById('close-results');
const closeStudentsBtn = document.getElementById('close-students');

const resultsContainer = document.getElementById('results-container');
const studentsContainer = document.getElementById('students-container');
const clearAllBtn = document.getElementById('clear-all-results');

const adminEmail = "komoliddinkevin@gmail.com";
let currentUser;

// Auth check
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
});

// Show overlays
btnResults.addEventListener('click', () => {
  resultsOverlay.style.display = "block";
  loadResults();
});
btnStudents.addEventListener('click', () => {
  studentsOverlay.style.display = "block";
  loadStudents();
});

// Close overlays
closeResultsBtn.addEventListener('click', () => resultsOverlay.style.display = "none");
closeStudentsBtn.addEventListener('click', () => studentsOverlay.style.display = "none");

// Load results
async function loadResults() {
  try {
    const snapshot = await db.collection('results').orderBy('score', 'desc').get();

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
                    <th>Action</th>
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
                 <td><button class="delete-result-btn" data-id="${doc.id}">Delete</button></td>
               </tr>`;
    }

    html += "</table>";
    resultsContainer.innerHTML = html;

    // Delete individual result
    document.querySelectorAll('.delete-result-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        if (!confirm("Are you sure you want to delete this result?")) return;

        try {
          await db.collection('results').doc(id).delete();
          alert("Result deleted!");
          loadResults();
        } catch (err) {
          console.error("Failed to delete result:", err);
          alert("Error deleting result. Try again.");
        }
      });
    });
  } catch (err) {
    console.error(err);
    resultsContainer.innerHTML = "<p>Failed to load results.</p>";
  }
}

// Clear all results
clearAllBtn.addEventListener('click', async () => {
  if (!confirm("Are you sure you want to delete ALL results?")) return;

  try {
    const snapshot = await db.collection('results').get();
    const batch = db.batch();
    snapshot.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    alert("All results deleted!");
    loadResults();
  } catch (err) {
    console.error(err);
    alert("Failed to delete results.");
  }
});

// Load students
async function loadStudents() {
  try {
    const snapshot = await db.collection('users').get();
    if (snapshot.empty) {
      studentsContainer.innerHTML = "<p>No students found.</p>";
      return;
    }

    let html = `<div class="students-list">`;
    snapshot.forEach(doc => {
      const u = doc.data();
      html += `<div class="student-card">
                 <img src="${u.profilePic || 'assets/img/default-pic.png'}" alt="Profile" class="student-pic">
                 <p class="nickname">${u.nickname || 'N/A'}</p>
               </div>`;
    });
    html += "</div>";
    studentsContainer.innerHTML = html;
  } catch (err) {
    console.error(err);
    studentsContainer.innerHTML = "<p>Failed to load students.</p>";
  }
}
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
