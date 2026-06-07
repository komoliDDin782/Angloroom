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
const modalAbout = document.getElementById('preview-about');
const modalSteps = modal.querySelectorAll('.level-step');

// Constants
const DEFAULT_LEVEL = 'beginner';
const LEVELS = ['beginner', 'elementary', 'intermediate', 'advanced'];
const TOP_RESULTS_LIMIT = 10;

const DEFAULT_USER_DATA = {
  nickname: 'Unknown',
  profilePic: 'assets/image/logo.jpg',
  level: DEFAULT_LEVEL,
  profileBg: 'assets/image/back4.jpg',
  about: 'No information yet.',
  quizCount: 0,
  correctAnswers: 0,
  lightningCount: 0
};

// Utility Functions
function capitalize(word) {
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function formatTime(ms) {
  if (!ms) return '-';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

function getOrdinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// User data cache to avoid redundant Firestore reads
const userCache = {};

async function getUserData(uid) {
  if (userCache[uid]) return userCache[uid];
  
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
      const data = userDoc.data();
      userCache[uid] = {
        nickname: data.nickname || uid.substring(0, 8) + '...',
        profilePic: data.profilePic || DEFAULT_USER_DATA.profilePic,
        level: data.level || DEFAULT_USER_DATA.level,
        profileBg: data.profileBg || DEFAULT_USER_DATA.profileBg,
        about: data.about || DEFAULT_USER_DATA.about,
        quizCount: data.quizCount || 0,
        correctAnswers: data.correctAnswers || 0,
        lightningCount: data.lightningCount || 0
      };
      return userCache[uid];
    }
  } catch (err) {
    console.error('Failed to fetch user data for:', uid, err);
  }
  
  // Fallback
  return {
    ...DEFAULT_USER_DATA,
    nickname: uid.substring(0, 8) + '...'
  };
}

// Show profile preview modal
async function showProfilePreview(uid) {
  const user = await getUserData(uid);

  modalPic.src = user.profilePic;
  modalBg.style.backgroundImage = `url(${user.profileBg})`;
  modalNickname.textContent = user.nickname;
  modalLevel.textContent = `Level: ${capitalize(user.level)}`;
  modalAbout.textContent = user.about || 'No information yet.';
  
  document.getElementById('preview-quiz-count').textContent = user.quizCount;
  document.getElementById('preview-correct-count').textContent = user.correctAnswers;
  document.getElementById('preview-lightning-count').textContent = user.lightningCount;

  // Update progress steps
  modalSteps.forEach(step => step.classList.remove('active'));
  const levelIndex = LEVELS.indexOf(user.level);
  for (let i = 0; i <= levelIndex && i < modalSteps.length; i++) {
    modalSteps[i].classList.add('active');
  }

  modal.classList.add('active');
}



// Build table HTML for remaining results
function buildTable(results, startRank) {
  let html = `
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

  results.forEach((item, index) => {
    const rank = startRank + index;
    const { userData, data } = item;
    
    let rowClass = '';
    if (rank === 1) rowClass = 'gold-row';
    else if (rank === 2) rowClass = 'silver-row';
    else if (rank === 3) rowClass = 'bronze-row';
    
    if (item.uid === currentUser?.uid) {
      rowClass += ' current-user-row';
    }

    const rankLabel = getOrdinal(rank);

    html += `
      <tr class="${rowClass}">
        <td class="rank">${rankLabel}</td>
        <td class="nickname-cell">
          <img 
            src="${userData.profilePic}" 
            class="profile-icon" 
            data-uid="${item.uid}"
            alt="${userData.nickname}'s avatar"
          >
          <span>${userData.nickname}</span>
        </td>
        <td>${data.quizId || '—'}</td>
        <td style="font-weight: bold; color: var(--accent);">${data.score}</td>
        <td>${formatTime(data.timeTaken)}</td>
        <td>${data.total || '—'}</td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  return html;
}

// Attach click handlers using event delegation
function attachProfileClickHandlers() {
  // Remove old handler and reattach using event delegation on container
  resultsContainer.removeEventListener('click', handleProfileClick);
  resultsContainer.addEventListener('click', handleProfileClick);
}

async function handleProfileClick(e) {
  const avatar = e.target.closest('.podium-avatar, .profile-icon');
  if (!avatar) return;
  
  const uid = avatar.dataset.uid;
  if (uid) {
    await showProfilePreview(uid);
  }
}

// Check authentication
auth.onAuthStateChanged(async user => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  currentUser = user;

  try {
    const userDoc = await db.collection('users').doc(user.uid).get();
    userLevel = (userDoc.exists && userDoc.data().level) 
      ? userDoc.data().level 
      : DEFAULT_LEVEL;

    await loadResults();
  } catch (err) {
    console.error('Auth Error:', err);
    resultsContainer.innerHTML = `
      <p style="color:red;text-align:center;padding:20px;">
        Failed to load user level. Please try again.
      </p>`;
  }
});

// Fetch results and display leaderboard
async function loadResults() {
  try {
    const snapshot = await db.collection('results')
      .orderBy('score', 'desc')
      .get();

    if (snapshot.empty) {
      resultsContainer.innerHTML = `
        <h1>Leaderboard</h1>
        <p style="text-align:center;color:var(--text-muted);padding:40px;">
          No results yet. Be the first to play!
        </p>`;
      return;
    }

    // Filter by current user's level
    const filteredDocs = snapshot.docs.filter(
      doc => doc.data().level === userLevel
    );

    if (filteredDocs.length === 0) {
      resultsContainer.innerHTML = `
        <h1>Leaderboard</h1>
        <p style="text-align:center;color:var(--text-muted);padding:40px;">
          No results for level "${capitalize(userLevel)}" yet.
        </p>`;
      return;
    }

    // Sort: by score descending, then by time ascending for ties
    filteredDocs.sort((a, b) => {
      const dataA = a.data();
      const dataB = b.data();
      
      if (dataB.score !== dataA.score) {
        return dataB.score - dataA.score;
      }
      
      return (dataA.timeTaken || 0) - (dataB.timeTaken || 0);
    });

    // Limit to top results
    const topResults = filteredDocs.slice(0, TOP_RESULTS_LIMIT);

    // Fetch all user data in parallel
    const resultsWithUsers = await Promise.all(
      topResults.map(async doc => ({
        uid: doc.data().userId,
        data: doc.data(),
        userData: await getUserData(doc.data().userId)
      }))
    );

    // Split into podium (top 3) and table (rest)
    const podiumResults = resultsWithUsers.slice(0, 3);
    const tableResults = resultsWithUsers.slice(3);

    // Build HTML
    let html = '<h1>Leaderboard</h1>';
    html += buildPodium(podiumResults);
    
    if (podiumResults.length > 0) {
      html += `
        <h2 style="text-align:center;font-size:16px;margin:10px 0;color:var(--text-muted);">
          Top ${TOP_RESULTS_LIMIT}: ${capitalize(userLevel)}
        </h2>`;
    }
    
    html += tableResults.length > 0 
      ? buildTable(tableResults, 4) 
      : (podiumResults.length === 0 ? '' : buildTable(podiumResults, 1));

    resultsContainer.innerHTML = html;

    // Attach click handlers for profile previews
    attachProfileClickHandlers();

  } catch (err) {
    console.error('Leaderboard Error:', err);
    resultsContainer.innerHTML = `
      <h1>Leaderboard</h1>
      <p style="color:red;text-align:center;padding:20px;">
        Failed to load results. Please try again later.
      </p>`;
  }
}

// Modal close handlers
modalClose.addEventListener('click', () => {
  modal.classList.remove('active');
});

window.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.classList.remove('active');
  }
});

// Keyboard accessibility
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.classList.contains('active')) {
    modal.classList.remove('active');
  }
});
// Build podium HTML for top 3
function buildPodium(topThree) {
  if (topThree.length === 0) return '';

  // Rearrange for podium display: [2nd, 1st, 3rd]
  const podiumOrder = [];
  if (topThree[1]) podiumOrder.push({ ...topThree[1], place: 'second-place', rank: 2 }); // 2nd
  if (topThree[0]) podiumOrder.push({ ...topThree[0], place: 'first-place', rank: 1 });  // 1st
  if (topThree[2]) podiumOrder.push({ ...topThree[2], place: 'third-place', rank: 3 });  // 3rd

  let html = '<div class="podium-container">';
  
  podiumOrder.forEach(item => {
    const rankLabel = getOrdinal(item.rank);
    
    html += `
      <div class="podium-item ${item.place}">
        <img 
          src="${item.userData.profilePic}" 
          class="podium-avatar" 
          data-uid="${item.uid}"
          alt="${item.userData.nickname}'s avatar"
        >
        <div class="podium-bar">
          <span class="podium-rank">${rankLabel}</span>
        </div>
        <span class="podium-nickname">${item.userData.nickname}</span>
        <span class="podium-score">${item.data.score}</span>
        <span class="podium-score">${formatTime(item.data.timeTaken)}</span>
      </div>
    `;
  });
  
  html += '</div>';
  return html;
}