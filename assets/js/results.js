// assets/js/results.js

const resultsContainer = document.getElementById('results-container');
let currentUser;

// Authentication check
auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    loadResults();
  } else {
    window.location.href = "index.html";
  }
});

// Load results with nickname + profile picture
async function loadResults() {
  const snapshot = await db.collection('results')
    .orderBy('score', 'desc')
    .get();

  if (snapshot.empty) {
    resultsContainer.innerHTML = "<p>No results yet.</p>";
    return;
  }

  const userCache = {};

  async function getUserData(uid) {
    if (userCache[uid]) return userCache[uid];

    try {
      const userDoc = await db.collection('users').doc(uid).get();
      if (userDoc.exists) {
        const data = userDoc.data();
        userCache[uid] = {
          nickname: data.nickname || uid,
          profilePic: data.profilePic || "assets/css/logo.jpg"
        };
        return userCache[uid];
      }
    } catch (err) {
      console.error("User data fetch failed:", err);
    }

    userCache[uid] = {
      nickname: uid,
      profilePic: "assets/css/logo.jpg"
    };
    return userCache[uid];
  }

  let html = `
    <style>
      .results-table img.profile-icon {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        object-fit: cover;
        margin-right: 10px;
        vertical-align: middle;
      }

      .nickname-cell {
        display: flex;
        align-items: center;
        font-weight: 600;
      }

      .rank { 
        font-weight: bold;
        text-align: center;
        width: 60px;
      }

      .gold { background-color: #C6E8C3; }
      .silver { background-color: #E6F7E4 }
      .bronze { background-color: #D9F2D5; }
      

      @media (max-width: 600px) {
        .results-table img.profile-icon {
          width: 32px;
          height: 32px;
        }
      }
    </style>

    <table class="results-table">
      <tr>
        <th>Rank</th>
        <th>User</th>
        <th>Quiz</th>
        <th>Score</th>
        <th>Total</th>
      </tr>
  `;

  let rank = 1;

  for (const doc of snapshot.docs) {
    const r = doc.data();
    const user = await getUserData(r.userId);

    let rankLabel = rank + (rank === 1 ? "st" : rank === 2 ? "nd" : rank === 3 ? "rd" : "th");

    // Assign row class by rank
    let rowClass = "";
    if (rank === 1) rowClass = "gold";
    if (rank === 2) rowClass = "bronze";
    if (rank === 3) rowClass = "silver";

    html += `
      <tr class="${rowClass}">
        <td class="rank">${rankLabel}</td>
        <td class="nickname-cell">
          <img src="${user.profilePic}" class="profile-icon">
          ${user.nickname}
        </td>
        <td>${r.quizId}</td>
        <td>${r.score}</td>
        <td>${r.total}</td>
      </tr>
    `;

    rank++;
  }

  html += "</table>";
  resultsContainer.innerHTML = html;
}


// nickname save
const nicknameInput = document.getElementById('nickname');
const saveBtn = document.getElementById('save-nickname');

if (saveBtn && nicknameInput) {
  saveBtn.addEventListener('click', async () => {
    const nickname = nicknameInput.value.trim();
    if (!nickname) return alert("Enter a nickname");

    try {
      await db.collection('users')
        .doc(currentUser.uid)
        .set({ nickname }, { merge: true });

      alert("Nickname saved!");
    } catch (err) {
      console.error("Failed to save nickname:", err);
      alert("Failed to save nickname. Try again.");
    }
  });
}
