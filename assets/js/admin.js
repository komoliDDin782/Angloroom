// --- Configuration & Global Variables ---
const adminEmail = "komoliddinkevin@gmail.com";
let currentUser;

// --- Elements ---
const resultsContainer = document.getElementById('results-container');
const btnStudents = document.getElementById('btn-students');
const studentsOverlay = document.getElementById('students-overlay');
const closeStudentsBtn = document.getElementById('close-students');
const saveAllLevelsBtn = document.getElementById('save-all-levels');

const btnNewStudents = document.getElementById('btn-new-students');
const newStudentsOverlay = document.getElementById('new-students-overlay');
const closeNewStudentsBtn = document.getElementById('close-new-students');
const newStudentsTableBody = document.querySelector('#new-students-table tbody');

const btnResults = document.getElementById('btn-results');
const resultsOverlay = document.getElementById('results-overlay');
const closeResultsBtn = document.getElementById('close-results');
const resultsTableBody = document.querySelector('#results-table tbody');

const studentTables = {
  elementary: document.querySelector('#students-elementary tbody'),
  beginner: document.querySelector('#students-beginner tbody'),
  intermediate: document.querySelector('#students-intermediate tbody'),
  advanced: document.querySelector('#students-advanced tbody')
};

// --- Auth Check ---
auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  currentUser = user;
  if (user.email !== adminEmail) {
    alert("Access denied.");
    window.location.href = "main.html";
    return;
  }
});

// --- Utility: Capitalize ---
function capitalize(word) {
  if (!word) return 'N/A';
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// --- 1. Manage Current Students (Level Assignments) ---

btnStudents.addEventListener('click', () => {
  studentsOverlay.style.display = "block";
  loadStudents();
});

closeStudentsBtn.addEventListener('click', () => studentsOverlay.style.display = "none");

async function loadStudents() {
  try {
    const snapshot = await db.collection('users').get();
    
    // Clear all tables
    for (let key in studentTables) {
      if (studentTables[key]) studentTables[key].innerHTML = '';
    }

    snapshot.forEach(doc => {
      const u = doc.data();
      let level = u.level || 'elementary';
      
      if (!studentTables[level]) level = 'elementary';
      
      const levelOptions = [
        { value: 'beginner', label: 'Beginner' },
        { value: 'elementary', label: 'Elementary' },
        { value: 'intermediate', label: 'Intermediate' },
        { value: 'advanced', label: 'Advanced' }
      ];
      
      let dropdownHTML = '<select class="level-select">';
      levelOptions.forEach(opt => {
        dropdownHTML += `<option value="${opt.value}" ${level === opt.value ? 'selected' : ''}>${opt.label}</option>`;
      });
      dropdownHTML += '</select>';
      
      const row = `
        <tr data-id="${doc.id}">
          <td><img src="${u.profilePic || 'assets/img/default-pic.png'}" class="student-pic"></td>
          <td>${u.nickname || 'N/A'}</td>
          <td>${dropdownHTML}</td>
        </tr>`;
      
      studentTables[level].insertAdjacentHTML('beforeend', row);
    });
  } catch (err) {
    console.error("Load Students Error:", err);
  }
}

saveAllLevelsBtn.addEventListener('click', async () => {
  try {
    const batch = db.batch();
    let updateCount = 0;
    
    for (let key in studentTables) {
      const rows = studentTables[key].querySelectorAll('tr');
      rows.forEach(row => {
        const userId = row.dataset.id;
        const newLevel = row.querySelector('.level-select').value;
        batch.update(db.collection('users').doc(userId), { level: newLevel });
        updateCount++;
      });
    }
    
    await batch.commit();
    alert(`Updated ${updateCount} levels!`);
    loadStudents();
  } catch (err) {
    alert("Update failed.");
  }
});

// --- 2. Manage New Student Registrations ---

btnNewStudents.addEventListener('click', () => {
  newStudentsOverlay.style.display = 'block';
  loadNewStudents();
});

closeNewStudentsBtn.addEventListener('click', () => newStudentsOverlay.style.display = 'none');

async function loadNewStudents() {
  try {
    const snapshot = await db.collection('NewStudents').get();
    newStudentsTableBody.innerHTML = '';

    if (snapshot.empty) {
      newStudentsTableBody.innerHTML = '<tr><td colspan="3">No new students.</td></tr>';
      return;
    }

    snapshot.forEach(doc => {
      const s = doc.data();
      const row = `
        <tr>
          <td>${s.name || 'N/A'}</td>
          <td>${s.phone || 'N/A'}</td>
          <td>${s.level || 'N/A'}</td>
        </tr>`;
      newStudentsTableBody.insertAdjacentHTML('beforeend', row);
    });
  } catch (err) {
    console.error(err);
  }
}

// --- 3. Quiz Results Management (Fixes "Anonymous" & Percentages) ---

btnResults.addEventListener('click', () => {
  resultsOverlay.style.display = 'block';
  loadResults();
});

closeResultsBtn.addEventListener('click', () => resultsOverlay.style.display = 'none');

async function loadResults() {
  try {
    const snapshot = await db.collection('results').orderBy('timestamp', 'desc').get();
    resultsTableBody.innerHTML = '';

    if (snapshot.empty) {
      resultsTableBody.innerHTML = '<tr><td colspan="5">No results found.</td></tr>';
      return;
    }

    const userCache = {}; // Cache to store nicknames and avoid redundant DB hits

    for (const doc of snapshot.docs) {
      const res = doc.data();
      const date = res.timestamp ? new Date(res.timestamp.seconds * 1000).toLocaleDateString() : 'N/A';
      
      // Fix: Resolve "Who is Who"
      let displayName = "Anonymous";
      const uid = res.userId; 

      if (uid) {
        if (userCache[uid]) {
          displayName = userCache[uid];
        } else {
          const userDoc = await db.collection('users').doc(uid).get();
          if (userDoc.exists) {
            displayName = userDoc.data().nickname || res.userEmail || "Anonymous";
            userCache[uid] = displayName;
          } else {
            displayName = res.userEmail || "Anonymous";
          }
        }
      } else {
        displayName = res.userEmail || "Anonymous";
      }

      // Fix: Show Score (e.g., 47/50) instead of Percentage
      const scoreDisplay = res.total ? `${res.score} / ${res.total}` : res.score;

      const row = `
        <tr>
          <td>${displayName}</td>
          <td>${res.quizName || res.quizId || 'General Quiz'}</td>
          <td style="color: var(--accent); font-weight: bold;">${scoreDisplay}</td>
          <td>${date}</td>
          <td>
            <button class="delete-result-btn" onclick="deleteResult('${doc.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>`;
      resultsTableBody.insertAdjacentHTML('beforeend', row);
    }
  } catch (err) {
    console.error("Results Load Error:", err);
    resultsTableBody.innerHTML = '<tr><td colspan="5">Error loading data.</td></tr>';
  }
}

async function deleteResult(id) {
  if (!confirm('Delete this result permanently?')) return;
  try {
    await db.collection('results').doc(id).delete();
    loadResults();
  } catch (err) {
    alert("Failed to delete.");
  }
}

// --- Logout ---
document.getElementById('logout-btn').addEventListener('click', async () => {
  await auth.signOut();
  window.location.href = "index.html";
});
