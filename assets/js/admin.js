const btnResults = document.getElementById('btn-results');
const btnStudents = document.getElementById('btn-students');

const resultsOverlay = document.getElementById('results-overlay');
const studentsOverlay = document.getElementById('students-overlay');

const closeResultsBtn = document.getElementById('close-results');
const closeStudentsBtn = document.getElementById('close-students');

const adminEmail = "komoliddinkevin@gmail.com";
let currentUser;

// Student tables
const studentTables = {
  beginner: document.querySelector('#students-beginner tbody'),
  intermediate: document.querySelector('#students-intermediate tbody'),
  advanced: document.querySelector('#students-advanced tbody')
};

// Result tables
const resultTables = {
  beginner: document.querySelector('#results-beginner tbody'),
  intermediate: document.querySelector('#results-intermediate tbody'),
  advanced: document.querySelector('#results-advanced tbody')
};

const saveAllLevelsBtn = document.getElementById('save-all-levels');
const clearAllBtn = document.getElementById('clear-all-results');

// Auth check
auth.onAuthStateChanged(user => {
  if (!user) { window.location.href = "index.html"; return; }
  currentUser = user;
  if (user.email !== adminEmail) {
    alert("Access denied.");
    window.location.href = "main.html";
    return;
  }
});

// Show overlays
btnResults.addEventListener('click', () => { resultsOverlay.style.display = "block"; loadResults(); });
btnStudents.addEventListener('click', () => { studentsOverlay.style.display = "block"; loadStudents(); });

// Close overlays
closeResultsBtn.addEventListener('click', () => resultsOverlay.style.display = "none");
closeStudentsBtn.addEventListener('click', () => studentsOverlay.style.display = "none");

// Load students
async function loadStudents() {
  try {
    const snapshot = await db.collection('users').get();
    for (let key in studentTables) studentTables[key].innerHTML = '';

    snapshot.forEach(doc => {
      const u = doc.data();
      const level = u.level || 'beginner';
      const row = `<tr data-id="${doc.id}">
        <td><img src="${u.profilePic || 'assets/img/default-pic.png'}" class="student-pic" alt="${u.nickname}"></td>
        <td>${u.nickname || 'N/A'}</td>
        <td>
          <select class="level-select">
            <option value="beginner" ${level==='beginner'?'selected':''}>Beginner</option>
            <option value="intermediate" ${level==='intermediate'?'selected':''}>Intermediate</option>
            <option value="advanced" ${level==='advanced'?'selected':''}>Advanced</option>
          </select>
        </td>
      </tr>`;
      studentTables[level].insertAdjacentHTML('beforeend', row);
    });
  } catch (err) {
    console.error(err);
    for (let key in studentTables) studentTables[key].innerHTML = '<tr><td colspan="3">Failed to load students.</td></tr>';
  }
}

// Save all student levels
saveAllLevelsBtn.addEventListener('click', async () => {
  try {
    const batch = db.batch();
    for (let key in studentTables) {
      const rows = studentTables[key].querySelectorAll('tr');
      rows.forEach(row => {
        const userId = row.dataset.id;
        const newLevel = row.querySelector('.level-select').value;
        const userRef = db.collection('users').doc(userId);
        batch.update(userRef, { level: newLevel });
      });
    }
    await batch.commit();
    alert("All levels updated!");
    loadStudents();
  } catch (err) {
    console.error(err);
    alert("Failed to update levels.");
  }
});

// Load results grouped by level
async function loadResults() {
  try {
    const snapshot = await db.collection('results').orderBy('score','desc').get();
    for (let key in resultTables) resultTables[key].innerHTML = '';

    for (const doc of snapshot.docs) {
      const r = doc.data();
      let nickname = r.nickname || '';
      let photo = 'assets/img/default-pic.png';
      let level = 'beginner';

      try {
        const userDoc = await db.collection('users').doc(r.userId).get();
        if (userDoc.exists) {
          nickname = userDoc.data().nickname || r.userId;
          photo = userDoc.data().profilePic || photo;
          level = userDoc.data().level || 'beginner';
        }
      } catch {}

      const row = `<tr>
        <td><img src="${photo}" class="student-pic" alt="${nickname}"> ${nickname}</td>
        <td>${r.quizId}</td>
        <td>${r.score}</td>
        <td>${r.total}</td>
        <td><button class="delete-result-btn" data-id="${doc.id}">Delete</button></td>
      </tr>`;
      resultTables[level].insertAdjacentHTML('beforeend', row);
    }

    // Attach delete handlers
    document.querySelectorAll('.delete-result-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        if (!confirm("Delete this result?")) return;
        try {
          await db.collection('results').doc(id).delete();
          loadResults();
        } catch (err) {
          console.error(err);
          alert("Failed to delete.");
        }
      });
    });

  } catch (err) {
    console.error(err);
    for (let key in resultTables) resultTables[key].innerHTML = '<tr><td colspan="5">Failed to load results.</td></tr>';
  }
}

// Clear all results
clearAllBtn.addEventListener('click', async () => {
  if (!confirm("Delete ALL results?")) return;
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

// Logout
document.getElementById('logout-btn').addEventListener('click', async () => {
  try { await auth.signOut(); window.location.href="index.html"; } 
  catch(err){ console.error(err); alert("Failed to log out."); }
});
