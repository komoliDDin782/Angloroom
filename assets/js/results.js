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

// Utility
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

// Check authentication
auth.onAuthStateChanged(async user => {
  if (!user) {
    window.location.href = "index.html";
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
    console.error(err);
    resultsContainer.innerHTML = "<p style='color:red;text-align:center;'>Failed to load user level.</p>";
  }
});

// Fetch results and display leaderboard
async function loadResults() {
  try {
    const snapshot = await db.collection('results')
      .orderBy('score', 'desc')
      .get();

    if (snapshot.empty) {
      resultsContainer.innerHTML = "<p style='text-align:center;'>No results yet.</p>";
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
            profilePic: data.profilePic || "assets/css/logo.jpg",
            level: data.level || 'beginner',
            profileBg: data.profileBg || 'assets/css/back4.jpg'
          };
          return userCache[uid];
        }
      } catch (err) {
        console.error("Failed to fetch user data:", err);
      }
      userCache[uid] = {
        nickname: uid,
        profilePic: "assets/css/logo.jpg",
        level: 'beginner',
        profileBg: 'assets/css/back4.jpg'
      };
      return userCache[uid];
    }

    const filteredResults = snapshot.docs.filter(doc => doc.data().level === userLevel);

    if (!filteredResults.length) {
      resultsContainer.innerHTML = `<p style='text-align:center;'>No results for level "${userLevel}".</p>`;
      return;
    }

    let html = `<h2 style="text-align:center;">Leaderboard – ${userLevel}</h2>`;
    html += `<table class="results-table">
      <tr>
        <th>Rank</th>
        <th>User</th>
        <th>Quiz</th>
        <th>Score</th>
        <th>Time</th>
        <th>Total</th>
      </tr>`;

    let rank = 1;
    for (const doc of filteredResults) {
      const data = doc.data();
      const user = await getUserData(data.userId);

      let rowClass = "";
      if (rank === 1) rowClass = "gold";
      if (rank === 2) rowClass = "silver";
      if (rank === 3) rowClass = "bronze";

      const rankLabel = rank + (rank === 1 ? "st" : rank === 2 ? "nd" : rank === 3 ? "rd" : "th");

      html += `
        <tr class="${rowClass}">
          <td class="rank">${rankLabel}</td>
          <td class="nickname-cell">
            <img src="${user.profilePic}" class="profile-icon" data-uid="${data.userId}">
            ${user.nickname}
          </td>
          <td>${data.quizId}</td>
          <td>${data.score}</td>
          <td>${formatTime(data.timeTaken)}</td>
          <td>${data.total}</td>
        </tr>
      `;
      rank++;
    }

    html += "</table>";
    resultsContainer.innerHTML = html;

    // Attach click events to profile pictures
    document.querySelectorAll('.profile-icon').forEach(img => {
      img.addEventListener('click', async e => {
        const uid = e.target.dataset.uid;
        const user = await getUserData(uid);
        modalPic.src = user.profilePic;
        modalBg.style.backgroundImage = `url(${user.profileBg})`;
        modalNickname.textContent = user.nickname;
        modalLevel.textContent = `Level: ${capitalize(user.level)}`;

        modalSteps.forEach(step => step.className = 'level-step'); // reset
        if (user.level === 'beginner') modalSteps[0].classList.add('active', 'beginner');
        if (user.level === 'intermediate') {
          modalSteps[0].classList.add('active', 'beginner');
          modalSteps[1].classList.add('active', 'intermediate');
        }
        if (user.level === 'advanced') {
          modalSteps[0].classList.add('active', 'beginner');
          modalSteps[1].classList.add('active', 'intermediate');
          modalSteps[2].classList.add('active', 'advanced');
        }

        modal.style.display = 'flex';
      });
    });

  } catch (err) {
    console.error(err);
    resultsContainer.innerHTML = "<p style='color:red;text-align:center;'>Failed to load results.</p>";
  }
}

// Modal close behavior
modalClose.addEventListener('click', () => modal.style.display = 'none');
modal.addEventListener('click', e => {
  if (e.target === modal) modal.style.display = 'none';
});
