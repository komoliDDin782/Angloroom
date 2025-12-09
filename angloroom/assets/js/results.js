// assets/js/results.js

const resultsContainer = document.getElementById('results-container');
let currentUser;

// Check authentication
auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    loadResults();
  } else {
    window.location.href = "index.html";
  }
});

// Load results and display with nicknames
async function loadResults() {
  const snapshot = await db.collection('results')
    .orderBy('score', 'desc') // highest scores first
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

  // Loop through all results
  for (const doc of snapshot.docs) {
    const r = doc.data();
    let nickname = r.nickname || "";

    // If nickname not in result, try to fetch from users collection
    if (!nickname) {
      try {
        const userDoc = await db.collection('users').doc(r.userId).get();
        if (userDoc.exists) {
          nickname = userDoc.data().nickname || r.userId;
        } else {
          nickname = r.userId; // fallback
        }
      } catch (err) {
        console.error("Error fetching nickname:", err);
        nickname = r.userId; // fallback
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
}

// Save/update nickname from profile page
const nicknameInput = document.getElementById('nickname');
const saveBtn = document.getElementById('save-nickname');

if (saveBtn && nicknameInput) {
  saveBtn.addEventListener('click', async () => {
    const nickname = nicknameInput.value.trim();
    if (!nickname) return alert("Enter a nickname");

    try {
      await db.collection('users').doc(currentUser.uid).set({
        nickname: nickname
      }, { merge: true }); // merge to avoid overwriting other data

      alert("Nickname saved!");
    } catch (err) {
      console.error("Failed to save nickname:", err);
      alert("Failed to save nickname. Try again.");
    }
  });
}
