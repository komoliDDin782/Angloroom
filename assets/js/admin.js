const btnResults = document.getElementById('btn-results');
const btnStudents = document.getElementById('btn-students');

const resultsOverlay = document.getElementById('results-overlay');
const studentsOverlay = document.getElementById('students-overlay');

const closeResultsBtn = document.getElementById('close-results');
const closeStudentsBtn = document.getElementById('close-students');

const adminEmail = "komoliddinkevin@gmail.com";
let currentUser;

// Student tables - ADDED ELEMENTARY
const studentTables = {
  elementary: document.querySelector('#students-elementary tbody'),
  beginner: document.querySelector('#students-beginner tbody'),
  intermediate: document.querySelector('#students-intermediate tbody'),
  advanced: document.querySelector('#students-advanced tbody')
};

// Result tables - ADDED ELEMENTARY
const resultTables = {
  elementary: document.querySelector('#results-elementary tbody'),
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

// Load students - UPDATED FOR ELEMENTARY
async function loadStudents() {
  try {
    const snapshot = await db.collection('users').get();
    
    // Clear all tables including elementary
    for (let key in studentTables) {
      if (studentTables[key]) {
        studentTables[key].innerHTML = '';
      }
    }

    snapshot.forEach(doc => {
      const u = doc.data();
      const level = u.level || 'elementary'; // Default to elementary instead of beginner
      
      // Check if the table exists for this level
      if (!studentTables[level]) {
        console.warn(`No table found for level: ${level}, defaulting to elementary`);
        level = 'elementary';
      }
      
      // Create dropdown options - ADDED ELEMENTARY OPTION
      const levelOptions = [
        { value: 'elementary', label: 'Elementary' },
        { value: 'beginner', label: 'Beginner' },
        { value: 'intermediate', label: 'Intermediate' },
        { value: 'advanced', label: 'Advanced' }
      ];
      
      // Generate dropdown HTML
      let dropdownHTML = '<select class="level-select">';
      levelOptions.forEach(option => {
        dropdownHTML += `<option value="${option.value}" ${level === option.value ? 'selected' : ''}>${option.label}</option>`;
      });
      dropdownHTML += '</select>';
      
      const row = `<tr data-id="${doc.id}">
        <td><img src="${u.profilePic || 'assets/img/default-pic.png'}" class="student-pic" alt="${u.nickname}"></td>
        <td>${u.nickname || 'N/A'}</td>
        <td>${dropdownHTML}</td>
      </tr>`;
      
      // Insert into the correct table
      if (studentTables[level]) {
        studentTables[level].insertAdjacentHTML('beforeend', row);
      }
    });
  } catch (err) {
    console.error(err);
    for (let key in studentTables) {
      if (studentTables[key]) {
        studentTables[key].innerHTML = '<tr><td colspan="3">Failed to load students.</td></tr>';
      }
    }
  }
}

// Save all student levels - UPDATED FOR ELEMENTARY
saveAllLevelsBtn.addEventListener('click', async () => {
  try {
    const batch = db.batch();
    let updateCount = 0;
    
    // Iterate through all level tables including elementary
    for (let key in studentTables) {
      const rows = studentTables[key].querySelectorAll('tr');
      rows.forEach(row => {
        const userId = row.dataset.id;
        const newLevel = row.querySelector('.level-select').value;
        const userRef = db.collection('users').doc(userId);
        batch.update(userRef, { level: newLevel });
        updateCount++;
      });
    }
    
    if (updateCount === 0) {
      alert("No students to update!");
      return;
    }
    
    await batch.commit();
    alert(`Updated ${updateCount} student levels!`);
    loadStudents(); // Reload to reflect changes
  } catch (err) {
    console.error(err);
    alert("Failed to update levels.");
  }
});

// Load results grouped by level - UPDATED FOR ELEMENTARY
async function loadResults() {
  try {
    const snapshot = await db.collection('results').orderBy('score','desc').get();
    
    // Clear all result tables including elementary
    for (let key in resultTables) {
      if (resultTables[key]) {
        resultTables[key].innerHTML = '';
      }
    }

    // Process each result
    for (const doc of snapshot.docs) {
      const r = doc.data();
      let nickname = r.nickname || '';
      let photo = 'assets/img/default-pic.png';
      let level = 'elementary'; // Default to elementary

      // Fetch user data to get level and photo
      try {
        if (r.userId) {
          const userDoc = await db.collection('users').doc(r.userId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            nickname = userData.nickname || r.userId;
            photo = userData.profilePic || photo;
            level = userData.level || 'elementary';
          }
        }
      } catch (err) {
        console.warn(`Error fetching user data for ${r.userId}:`, err);
      }

      // Ensure level is valid, fallback to elementary
      if (!resultTables[level]) {
        console.warn(`Invalid level "${level}" for user ${nickname}, defaulting to elementary`);
        level = 'elementary';
      }

      // Create result row
      const row = `<tr>
        <td><img src="${photo}" class="student-pic" alt="${nickname}"> ${nickname}</td>
        <td>${r.quizId || 'Unknown Quiz'}</td>
        <td>${r.score || 0}</td>
        <td>${r.total || 0}</td>
        <td><button class="delete-result-btn" data-id="${doc.id}">Delete</button></td>
      </tr>`;
      
      // Insert into the correct table
      if (resultTables[level]) {
        resultTables[level].insertAdjacentHTML('beforeend', row);
      }
    }

    // Attach delete handlers
    document.querySelectorAll('.delete-result-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        if (!confirm("Delete this result?")) return;
        try {
          await db.collection('results').doc(id).delete();
          loadResults(); // Reload results
        } catch (err) {
          console.error(err);
          alert("Failed to delete result.");
        }
      });
    });

    // Check if any tables are empty and show message
    for (let key in resultTables) {
      if (resultTables[key] && resultTables[key].children.length === 0) {
        resultTables[key].innerHTML = '<tr><td colspan="5">No results found.</td></tr>';
      }
    }

  } catch (err) {
    console.error(err);
    for (let key in resultTables) {
      if (resultTables[key]) {
        resultTables[key].innerHTML = '<tr><td colspan="5">Failed to load results.</td></tr>';
      }
    }
  }
}

// Clear all results - FUNCTION REMAINS THE SAME
clearAllBtn.addEventListener('click', async () => {
  if (!confirm("Delete ALL results? This cannot be undone!")) return;
  try {
    const snapshot = await db.collection('results').get();
    if (snapshot.empty) {
      alert("No results to delete.");
      return;
    }
    
    const batch = db.batch();
    snapshot.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    alert(`${snapshot.size} results deleted!`);
    loadResults();
  } catch (err) {
    console.error(err);
    alert("Failed to delete results.");
  }
});

// Logout - FUNCTION REMAINS THE SAME
document.getElementById('logout-btn').addEventListener('click', async () => {
  try { 
    await auth.signOut(); 
    window.location.href = "index.html"; 
  } catch(err) { 
    console.error(err); 
    alert("Failed to log out."); 
  }
});

// Optional: Add keyboard shortcuts to close overlays
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    resultsOverlay.style.display = "none";
    studentsOverlay.style.display = "none";
  }
});