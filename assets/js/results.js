const resultsContainer = document.getElementById('results-container');
let currentUser;
let userLevel;

// Modal elements
const modal = document.getElementById('profile-preview-modal');
const modalClose = modal.querySelector('.close');
const modalBg = document.getElementById('preview-bg');
const modalPic = document.getElementById('preview-pic');
const modalNickname = document.getElementById('preview-nickname');
const modalLevel = document.getElementById('preview-level');
const modalSteps = modal.querySelectorAll('.level-step');

// Utility Functions
function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function formatTime(ms) {
  if (!ms) return '-';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

// Map levels to modal steps
const levelOrder = ['beginner', 'elementary', 'intermediate', 'advanced'];

// Check authentication
auth.onAuthStateChanged(async user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  currentUser = user;

  try {
    const userDoc = await db.collection('users').doc(user.uid).get();
    userLevel = userDoc.exists && userDoc.data().level
      ? userDoc.data().level
      : 'beginner';

    loadResults();
  } catch (err) {
    console.error("Auth Error:", err);
    resultsContainer.innerHTML = "<p style='color:red;text-align:center;'>Failed to load user level.</p>";
  }
});

// Fetch results and display leaderboard
async function loadResults() {
  try {
    // 1. Fetch all results ordered by score
    const snapshot = await db.collection('results')
      .orderBy('score', 'desc')
      .get();

    if (snapshot.empty) {
      resultsContainer.innerHTML = "<p style='text-align:center;'>No results yet.</p>";
      return;
    }

    const userCache = {};

    // Helper to fetch user details (cached to minimize DB hits)
    async function getUserData(uid) {
      if (userCache[uid]) return userCache[uid];
      try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists) {
          const data = userDoc.data();
          userCache[uid] = {
            nickname: data.nickname || uid,
            profilePic: data.profilePic || "assets/image/logo.jpg",
            level: data.level || 'beginner',
            profileBg: data.profileBg || 'assets/image/back4.jpg'
          };
          return userCache[uid];
        }
      } catch (err) {
        console.error("Failed to fetch user data for:", uid, err);
      }
      // Fallback
      return {
        nickname: uid.substring(0, 8) + '...',
        profilePic: "assets/image/logo.jpg",
        level: 'beginner',
        profileBg: 'assets/image/back4.jpg'
      };
    }

    // Filter results by current user's level
    const filteredDocs = snapshot.docs.filter(doc => doc.data().level === userLevel);

    if (!filteredDocs.length) {
      resultsContainer.innerHTML = `<p style='text-align:center;'>No results for level "${capitalize(userLevel)}".</p>`;
      return;
    }

    // 2. Build the Leaderboard Table
    // Slice the results to show only the top 10 players
    const topTen = filteredDocs.slice(0, 10);

    let html = `<br>
    <h2 style="text-align:center; font-size: 18px; margin-bottom: 10px;">
                  Top 10: ${capitalize(userLevel)}
                </h2>`;
    html += `
      <table class="results-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>User</th>
            <th>Quiz</th>
            <th>Score</th>
            <th>Time</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>`;

    let rank = 1;
    for (const doc of topTen) {
      const data = doc.data();
      const userData = await getUserData(data.userId);

      let rowClass = "";
      if (rank === 1) rowClass = "gold-row";
      else if (rank === 2) rowClass = "silver-row";
      else if (rank === 3) rowClass = "bronze-row";

      const rankLabel = rank + (rank === 1 ? "st" : rank === 2 ? "nd" : rank === 3 ? "rd" : "th");

      html += `
        <tr class="${rowClass}">
          <td class="rank">${rankLabel}</td>
          <td class="nickname-cell">
            <img src="${userData.profilePic}" class="profile-icon" data-uid="${data.userId}">
            <span>${userData.nickname}</span>
          </td>
          <td>${data.quizId}</td>
          <td style="font-weight: bold; color: var(--accent);">${data.score}</td>
          <td>${formatTime(data.timeTaken)}</td>
          <td>${data.total}</td>
        </tr>
      `;
      rank++;
    }

    html += "</tbody></table>";
    resultsContainer.innerHTML = html;

    // 3. Re-attach Click Events for Profile Preview
    document.querySelectorAll('.profile-icon').forEach(img => {
      img.addEventListener('click', async e => {
        const uid = e.target.dataset.uid;
        const user = await getUserData(uid);

        modalPic.src = user.profilePic;
        modalBg.style.backgroundImage = `url(${user.profileBg})`;
        modalNickname.textContent = user.nickname;
        modalLevel.textContent = `Level: ${capitalize(user.level)}`;

        // Update progress steps
        modalSteps.forEach(step => step.className = 'level-step');
        const levelIndex = levelOrder.indexOf(user.level);
        for (let i = 0; i <= levelIndex; i++) {
          modalSteps[i].classList.add('active');
        }

        modal.style.display = 'flex';
      });
    });

  } catch (err) {
    console.error("Leaderboard Error:", err);
    resultsContainer.innerHTML = "<p style='color:red;text-align:center;'>Failed to load results.</p>";
  }
}

// Modal closing logic
modalClose.addEventListener('click', () => modal.style.display = 'none');
window.addEventListener('click', e => {
  if (e.target === modal) modal.style.display = 'none';
});