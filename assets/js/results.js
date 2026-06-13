// ==================== DOM REFS ====================
const resultsContainer = document.getElementById('results-container');
const leaderboardContent = document.getElementById('leaderboard-content');
const tabButtons = document.querySelectorAll('.tab-btn');

// Modal refs
const modal = document.getElementById('profile-preview-modal');
const modalClose = modal.querySelector('.close');
const modalBg = document.getElementById('preview-bg');
const modalPic = document.getElementById('preview-pic');
const modalNickname = document.getElementById('preview-nickname');
const modalLevel = document.getElementById('preview-level');
const modalAbout = document.getElementById('preview-about');
const modalSteps = modal.querySelectorAll('.level-step');

// ==================== CONSTANTS ====================
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

// ==================== STATE ====================
let currentUser = null;
let userLevel = DEFAULT_LEVEL;
let currentTab = 'weekly';
let cachedWeeklyData = null;
let cachedCorrectData = null;
let cachedLightningData = null;
const userCache = {};

// ==================== UTILITY FUNCTIONS ====================
function capitalize(word) {
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function formatTime(ms) {
  if (!ms && ms !== 0) return '-';
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

// ==================== DATA FETCHING ====================
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

  return {
    ...DEFAULT_USER_DATA,
    nickname: uid.substring(0, 8) + '...'
  };
}

async function fetchWeeklyResults() {
  const snapshot = await db.collection('results')
    .orderBy('score', 'desc')
    .get();

  if (snapshot.empty) return [];

  const filteredDocs = snapshot.docs.filter(
    doc => doc.data().level === userLevel
  );

  filteredDocs.sort((a, b) => {
    const dataA = a.data();
    const dataB = b.data();
    if (dataB.score !== dataA.score) return dataB.score - dataA.score;
    return (dataA.timeTaken || 0) - (dataB.timeTaken || 0);
  });

  const topResults = filteredDocs.slice(0, TOP_RESULTS_LIMIT);

  const resultsWithUsers = await Promise.all(
    topResults.map(async doc => ({
      uid: doc.data().userId,
      data: doc.data(),
      userData: await getUserData(doc.data().userId)
    }))
  );

  return resultsWithUsers;
}

async function fetchAllUsersByLevel() {
  const snapshot = await db.collection('users')
    .where('level', '==', userLevel)
    .get();

  if (snapshot.empty) return [];

  const users = snapshot.docs.map(doc => ({
    uid: doc.id,
    ...doc.data()
  }));

  return users;
}

async function fetchCorrectAnswersLeaderboard() {
  const users = await fetchAllUsersByLevel();

  users.sort((a, b) => {
    const correctA = a.correctAnswers || 0;
    const correctB = b.correctAnswers || 0;
    return correctB - correctA;
  });

  const topUsers = users.slice(0, TOP_RESULTS_LIMIT);

  const resultsWithUsers = await Promise.all(
    topUsers.map(async user => ({
      uid: user.uid,
      userData: await getUserData(user.uid)
    }))
  );

  return resultsWithUsers;
}

async function fetchLightningLeaderboard() {
  const users = await fetchAllUsersByLevel();

  users.sort((a, b) => {
    const lightningA = a.lightningCount || 0;
    const lightningB = b.lightningCount || 0;
    return lightningB - lightningA;
  });

  const topUsers = users.slice(0, TOP_RESULTS_LIMIT);

  const resultsWithUsers = await Promise.all(
    topUsers.map(async user => ({
      uid: user.uid,
      userData: await getUserData(user.uid)
    }))
  );

  return resultsWithUsers;
}

// ==================== RENDER FUNCTIONS ====================
function buildPodium(topThree, tabType) {
  if (topThree.length === 0) return '';

  const podiumOrder = [];
  if (topThree[1]) podiumOrder.push({ ...topThree[1], place: 'second-place', rank: 2 });
  if (topThree[0]) podiumOrder.push({ ...topThree[0], place: 'first-place', rank: 1 });
  if (topThree[2]) podiumOrder.push({ ...topThree[2], place: 'third-place', rank: 3 });

  let html = '<div class="podium-container">';

  podiumOrder.forEach(item => {
    const rankLabel = getOrdinal(item.rank);
    let metricValue = '';

    if (tabType === 'weekly') {
      metricValue = item.data ? `${item.data.score} score` : '0 score';
      metricValue = item.data ? `${formatTime(item.data.timeTaken) || 0}` : '0 minutes';
    } else if (tabType === 'correct') {
      metricValue = `${item.userData.correctAnswers || 0} correct`;
    } else if (tabType === 'lightning') {
      metricValue = `${item.userData.lightningCount || 0} ⚡`;
    }

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
        <span class="podium-metric">${metricValue}</span>
        
      </div>
    `;
  });

  html += '</div>';
  return html;
}

function buildTable(results, startRank, tabType) {
  let html = `
    <table class="results-table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>User</th>
          ${tabType === 'weekly' ? '<th>Quiz</th><th>Score</th><th class="col-extra">Time</th>' : ''}
          ${tabType === 'correct' ? '<th>Correct</th><th class="col-extra">Quizzes</th>' : ''}
          ${tabType === 'lightning' ? '<th>Lightning</th><th class="col-extra">Quizzes</th>' : ''}
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
        </td>`;

    if (tabType === 'weekly') {
      html += `
        <td>${data?.quizId || '—'}</td>
        <td class="metric-highlight">${data?.score || 0}</td>
        <td class="col-extra">${formatTime(data?.timeTaken)}</td>`;
    } else if (tabType === 'correct') {
      html += `
        <td class="metric-highlight">${userData.correctAnswers || 0}</td>
        <td class="col-extra">${userData.quizCount || 0}</td>`;
    } else if (tabType === 'lightning') {
      html += `
        <td class="metric-highlight">${userData.lightningCount || 0} ⚡</td>
        <td class="col-extra">${userData.quizCount || 0}</td>`;
    }

    html += `</tr>`;
  });

  html += '</tbody></table>';
  return html;
}

function buildEmptyState(tabType) {
  const messages = {
    weekly: 'No quiz results yet for this level. Be the first to play!',
    correct: 'No correct answers recorded yet for this level.',
    lightning: 'No lightning counts recorded yet for this level.'
  };

  const icons = {
    weekly: '🏆',
    correct: '✅',
    lightning: '⚡'
  };

  return `
    <div class="empty-state">
      <span class="icon">${icons[tabType]}</span>
      <p>${messages[tabType]}</p>
    </div>`;
}

function renderLeaderboard(data, tabType) {
  if (!data || data.length === 0) {
    return buildEmptyState(tabType);
  }

  const podiumResults = data.slice(0, 3);
  const tableResults = data.slice(3);

  let html = buildPodium(podiumResults, tabType);

  html += `
    <h2>Top ${TOP_RESULTS_LIMIT}: ${capitalize(userLevel)}</h2>`;

  if (tableResults.length > 0) {
    html += buildTable(tableResults, 4, tabType);
  }

  return html;
}

// ==================== TAB SWITCHING ====================
async function switchTab(tabType) {
  currentTab = tabType;

  // Update active tab button
  tabButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabType);
  });

  // Show loader
  leaderboardContent.innerHTML = `
    <div class="loader">
      <span style="color: var(--accent); font-weight: 900; letter-spacing: 3px; font-size: 12px;">LOADING...</span>
    </div>`;

  try {
    let data;

    if (tabType === 'weekly') {
      if (!cachedWeeklyData) {
        cachedWeeklyData = await fetchWeeklyResults();
      }
      data = cachedWeeklyData;
    } else if (tabType === 'correct') {
      if (!cachedCorrectData) {
        cachedCorrectData = await fetchCorrectAnswersLeaderboard();
      }
      data = cachedCorrectData;
    } else if (tabType === 'lightning') {
      if (!cachedLightningData) {
        cachedLightningData = await fetchLightningLeaderboard();
      }
      data = cachedLightningData;
    }

    leaderboardContent.innerHTML = renderLeaderboard(data, tabType);
    attachProfileClickHandlers();
  } catch (err) {
    console.error(`Failed to load ${tabType} leaderboard:`, err);
    leaderboardContent.innerHTML = `
      <p style="color:red;text-align:center;padding:20px;">
        Failed to load leaderboard. Please try again.
      </p>`;
  }
}

// ==================== EVENT HANDLERS ====================
function attachProfileClickHandlers() {
  leaderboardContent.removeEventListener('click', handleProfileClick);
  leaderboardContent.addEventListener('click', handleProfileClick);
}

async function handleProfileClick(e) {
  const avatar = e.target.closest('.podium-avatar, .profile-icon');
  if (!avatar) return;

  const uid = avatar.dataset.uid;
  if (uid) {
    await showProfilePreview(uid);
  }
}

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

  modalSteps.forEach(step => step.classList.remove('active'));
  const levelIndex = LEVELS.indexOf(user.level);
  for (let i = 0; i <= levelIndex && i < modalSteps.length; i++) {
    modalSteps[i].classList.add('active');
  }

  modal.classList.add('active');
}

// ==================== TAB CLICK HANDLERS ====================
tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const tabType = btn.dataset.tab;
    if (tabType !== currentTab) {
      switchTab(tabType);
    }
  });
});

// ==================== MODAL CLOSE HANDLERS ====================
modalClose.addEventListener('click', () => {
  modal.classList.remove('active');
});

window.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.classList.remove('active');
  }
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.classList.contains('active')) {
    modal.classList.remove('active');
  }
});

// ==================== AUTH & INIT ====================
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

    // Load default tab (weekly)
    await switchTab('weekly');
  } catch (err) {
    console.error('Auth Error:', err);
    leaderboardContent.innerHTML = `
      <p style="color:red;text-align:center;padding:20px;">
        Failed to load user data. Please try again.
      </p>`;
  }
});