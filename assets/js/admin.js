
const btnStudents = document.getElementById('btn-students');


const studentsOverlay = document.getElementById('students-overlay');


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



const saveAllLevelsBtn = document.getElementById('save-all-levels');


// Auth check
auth.onAuthStateChanged(user => {
  if (!user) { window.location.href = "login.html"; return; }
  currentUser = user;
  if (user.email !== adminEmail) {
    alert("Access denied.");
    window.location.href = "main.html";
    return;
  }
});

// Show overlays
btnStudents.addEventListener('click', () => { studentsOverlay.style.display = "block"; loadStudents(); });

// Close overlays
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
        { value: 'beginner', label: 'Beginner' },
        { value: 'elementary', label: 'Elementary' },
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
    studentsOverlay.style.display = "none";
  }
});
const btnNewStudents = document.getElementById('btn-new-students');
const newStudentsOverlay = document.getElementById('new-students-overlay');
const closeNewStudentsBtn = document.getElementById('close-new-students');
const newStudentsTableBody = document.querySelector('#new-students-table tbody');

// Show overlay
btnNewStudents.addEventListener('click', () => {
  newStudentsOverlay.style.display = 'block';
  loadNewStudents();
});

// Close overlay
closeNewStudentsBtn.addEventListener('click', () => {
  newStudentsOverlay.style.display = 'none';
});

// Load New Students from Firebase
async function loadNewStudents() {
  try {
    const snapshot = await db.collection('NewStudents').get();
    newStudentsTableBody.innerHTML = '';

    if (snapshot.empty) {
      newStudentsTableBody.innerHTML = '<tr><td colspan="3">No new students found.</td></tr>';
      return;
    }

    snapshot.forEach(doc => {
      const student = doc.data();
      const name = student.name || 'N/A';
      const phone = student.phone || 'N/A';
      const level = student.level || 'N/A';

      const row = `<tr>
        <td>${name}</td>
        <td>${phone}</td>
        <td>${level}</td>
      </tr>`;
      newStudentsTableBody.insertAdjacentHTML('beforeend', row);
    });
  } catch (err) {
    console.error(err);
    newStudentsTableBody.innerHTML = '<tr><td colspan="3">Failed to load new students.</td></tr>';
  }
}
// Remove all students from Firebase
async function removeAllStudents() {
  if (!confirm('Are you sure you want to remove all students? This cannot be undone.')) return;

  try {
    const snapshot = await db.collection('NewStudents').get();

    if (snapshot.empty) {
      alert('No students to remove.');
      return;
    }

    // Batch delete for efficiency
    const batch = db.batch();
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    alert('All students have been removed.');
    // Refresh the table after deletion
    loadNewStudents();
  } catch (err) {
    console.error(err);
    alert('Failed to remove students.');
  }
}
// --- Elements ---
const btnResults = document.getElementById('btn-results');
const resultsOverlay = document.getElementById('results-overlay');
const closeResultsBtn = document.getElementById('close-results');
const resultsTableBody = document.querySelector('#results-table tbody');

// --- Show/Hide ---
btnResults.addEventListener('click', () => {
  resultsOverlay.style.display = 'block';
  loadResults();
});

closeResultsBtn.addEventListener('click', () => {
  resultsOverlay.style.display = 'none';
});

// --- Load Data from Firebase ---
async function loadResults() {
  try {
    // Assuming your collection is named 'results'
    const snapshot = await db.collection('results').orderBy('timestamp', 'desc').get();
    resultsTableBody.innerHTML = '';

    if (snapshot.empty) {
      resultsTableBody.innerHTML = '<tr><td colspan="5">No results recorded yet.</td></tr>';
      return;
    }

    snapshot.forEach(doc => {
      const res = doc.data();
      const date = res.timestamp ? new Date(res.timestamp.seconds * 1000).toLocaleDateString() : 'N/A';
      
      const row = `
        <tr>
          <td>${res.userEmail || 'Anonymous'}</td>
          <td>${res.quizName || 'General Quiz'}</td>
          <td style="color: var(--accent); font-weight: bold;">${res.score}%</td>
          <td>${date}</td>
          <td>
            <button class="delete-result-btn" onclick="deleteResult('${doc.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>`;
      resultsTableBody.insertAdjacentHTML('beforeend', row);
    });
  } catch (err) {
    console.error("Error loading results:", err);
    resultsTableBody.innerHTML = '<tr><td colspan="5">Error loading data.</td></tr>';
  }
}

// --- Delete Single Result ---
async function deleteResult(id) {
  if (!confirm('Delete this result permanently?')) return;
  try {
    await db.collection('results').doc(id).delete();
    loadResults(); // Refresh table
  } catch (err) {
    alert("Failed to delete result.");
  }
}