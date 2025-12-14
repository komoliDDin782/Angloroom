const resultsContainer = document.getElementById('results-container');
let currentUser;
let userLevel;

// Check authentication
auth.onAuthStateChanged(async user => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }
  currentUser = user;

  try {
    // Get current user level
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
    // Fetch all results sorted by score
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
            profilePic: data.profilePic || "assets/css/logo.jpg"
          };
          return userCache[uid];
        }
      } catch (err) {
        console.error("Failed to fetch user data:", err);
      }
      userCache[uid] = { nickname: uid, profilePic: "assets/css/logo.jpg" };
      return userCache[uid];
    }

    // Filter results by userLevel in JavaScript
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
            <img src="${user.profilePic}" class="profile-icon">
            ${user.nickname}
          </td>
          <td>${data.quizId}</td>
          <td>${data.score}</td>
          <td>${data.total}</td>
        </tr>
      `;
      rank++;
    }

    html += "</table>";
    resultsContainer.innerHTML = html;

  } catch (err) {
    console.error(err);
    resultsContainer.innerHTML = "<p style='color:red;text-align:center;'>Failed to load results.</p>";
  }
}
