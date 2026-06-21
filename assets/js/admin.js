// --- Configuration & Global Variables ---
const adminEmail = "komoliddinkevin@gmail.com";
let currentUser;
let isLoading = false;

// --- Toast Notification System ---
function showToast(message, type = 'info') {
  // Remove existing toasts
  const existingToast = document.querySelector('.admin-toast');
  if (existingToast) existingToast.remove();

  const toast = document.createElement('div');
  toast.className = `admin-toast toast-${type}`;
  toast.innerHTML = `
    <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
    <span>${message}</span>
  `;

  // Toast styling
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    padding: '16px 24px',
    borderRadius: '12px',
    background: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6',
    color: 'white',
    fontWeight: '600',
    zIndex: '9999',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
    animation: 'slideInRight 0.3s ease',
    maxWidth: '400px'
  });

  document.body.appendChild(toast);

  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Add toast animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .loading-spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top: 2px solid var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .confirm-dialog {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #022c22;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 20px;
    padding: 30px;
    z-index: 10000;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    backdrop-filter: blur(20px);
    max-width: 400px;
    width: 90%;
  }
  .confirm-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.7);
    z-index: 9999;
    backdrop-filter: blur(5px);
  }
  .confirm-buttons {
    display: flex;
    gap: 10px;
    margin-top: 20px;
  }
  .confirm-btn {
    flex: 1;
    padding: 12px;
    border-radius: 10px;
    border: none;
    font-weight: 600;
    cursor: pointer;
    transition: 0.3s;
  }
  .confirm-yes {
    background: #ef4444;
    color: white;
  }
  .confirm-yes:hover {
    background: #dc2626;
  }
  .confirm-no {
    background: rgba(255,255,255,0.1);
    color: white;
    border: 1px solid rgba(255,255,255,0.1);
  }
  .confirm-no:hover {
    background: rgba(255,255,255,0.2);
  }
  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: var(--text-muted);
  }
  .empty-state i {
    font-size: 48px;
    margin-bottom: 15px;
    opacity: 0.3;
  }
  .action-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    gap: 15px;
    flex-wrap: wrap;
  }
  .search-input {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    padding: 10px 15px;
    border-radius: 10px;
    color: white;
    outline: none;
    min-width: 200px;
  }
  .search-input:focus {
    border-color: var(--accent);
  }
  .danger-btn {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    color: #ef4444;
    padding: 10px 20px;
    border-radius: 10px;
    cursor: pointer;
    font-weight: 600;
    transition: 0.3s;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .danger-btn:hover {
    background: #ef4444;
    color: white;
  }
  .refresh-btn {
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.2);
    color: #10b981;
    padding: 10px 20px;
    border-radius: 10px;
    cursor: pointer;
    font-weight: 600;
    transition: 0.3s;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .refresh-btn:hover {
    background: #10b981;
    color: white;
  }
`;
document.head.appendChild(style);

// --- Elements ---
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

// --- Custom Confirm Dialog ---
function showConfirm(message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  
  const dialog = document.createElement('div');
  dialog.className = 'confirm-dialog';
  dialog.innerHTML = `
    <h3 style="color: white; margin-bottom: 10px;">Confirm Action</h3>
    <p style="color: var(--text-muted);">${message}</p>
    <div class="confirm-buttons">
      <button class="confirm-btn confirm-no" id="confirm-no">Cancel</button>
      <button class="confirm-btn confirm-yes" id="confirm-yes">Confirm</button>
    </div>
  `;

  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  dialog.querySelector('#confirm-yes').addEventListener('click', () => {
    document.body.removeChild(overlay);
    onConfirm();
  });

  dialog.querySelector('#confirm-no').addEventListener('click', () => {
    document.body.removeChild(overlay);
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) document.body.removeChild(overlay);
  });
}

// --- Auth Check ---
auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  currentUser = user;
  if (user.email !== adminEmail) {
    showToast("Access denied. Admin only.", "error");
    setTimeout(() => {
      window.location.href = "main.html";
    }, 2000);
    return;
  }
});

// --- Utility Functions ---
function capitalize(word) {
  if (!word) return 'N/A';
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// --- 1. Manage Current Students (Level Assignments) ---

btnStudents.addEventListener('click', () => {
  studentsOverlay.style.display = "block";
  loadStudents();
});

closeStudentsBtn.addEventListener('click', () => studentsOverlay.style.display = "none");

async function loadStudents() {
  if (isLoading) return;
  
  try {
    isLoading = true;
    const snapshot = await db.collection('users').get();
    
    // Clear all tables
    for (let key in studentTables) {
      if (studentTables[key]) {
        studentTables[key].innerHTML = '<tr><td colspan="3" class="empty-state"><div class="loading-spinner"></div><br>Loading students...</td></tr>';
      }
    }

    // Clear tables for real
    for (let key in studentTables) {
      if (studentTables[key]) studentTables[key].innerHTML = '';
    }

    if (snapshot.empty) {
      for (let key in studentTables) {
        if (studentTables[key]) {
          studentTables[key].innerHTML = '<tr><td colspan="3" class="empty-state"><i class="fas fa-user-graduate"></i><br>No students found</td></tr>';
        }
      }
      return;
    }

    let totalStudents = 0;
    
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
          <td><img src="${u.profilePic || 'assets/img/default-pic.png'}" class="student-pic" alt="${u.nickname || 'Student'}"></td>
          <td>${u.nickname || 'N/A'}</td>
          <td>${dropdownHTML}</td>
        </tr>`;
      
      studentTables[level].insertAdjacentHTML('beforeend', row);
      totalStudents++;
    });

    // Show empty state for levels with no students
    for (let key in studentTables) {
      if (studentTables[key] && studentTables[key].children.length === 0) {
        studentTables[key].innerHTML = '<tr><td colspan="3" class="empty-state"><i class="fas fa-user-graduate"></i><br>No students in this level</td></tr>';
      }
    }

    showToast(`Loaded ${totalStudents} students`, 'success');
  } catch (err) {
    console.error("Load Students Error:", err);
    showToast("Failed to load students", "error");
  } finally {
    isLoading = false;
  }
}

saveAllLevelsBtn.addEventListener('click', async () => {
  if (isLoading) return;
  
  showConfirm('Are you sure you want to apply all level changes?', async () => {
    try {
      isLoading = true;
      saveAllLevelsBtn.disabled = true;
      saveAllLevelsBtn.innerHTML = '<div class="loading-spinner"></div> Saving...';
      
      const batch = db.batch();
      let updateCount = 0;
      
      for (let key in studentTables) {
        const rows = studentTables[key].querySelectorAll('tr[data-id]');
        rows.forEach(row => {
          const userId = row.dataset.id;
          const newLevel = row.querySelector('.level-select').value;
          batch.update(db.collection('users').doc(userId), { level: newLevel });
          updateCount++;
        });
      }
      
      if (updateCount === 0) {
        showToast("No changes to save", "info");
        return;
      }
      
      await batch.commit();
      showToast(`Updated ${updateCount} students successfully!`, 'success');
      loadStudents();
    } catch (err) {
      console.error("Update Error:", err);
      showToast("Failed to update students", "error");
    } finally {
      isLoading = false;
      saveAllLevelsBtn.disabled = false;
      saveAllLevelsBtn.innerHTML = 'Apply All Changes';
    }
  });
});

// --- 2. Manage New Student Registrations ---

btnNewStudents.addEventListener('click', () => {
  newStudentsOverlay.style.display = 'block';
  loadNewStudents();
});

closeNewStudentsBtn.addEventListener('click', () => newStudentsOverlay.style.display = 'none');

async function loadNewStudents() {
  if (isLoading) return;
  
  try {
    isLoading = true;
    const snapshot = await db.collection('NewStudents').orderBy('timestamp', 'desc').get();
    newStudentsTableBody.innerHTML = '';

    if (snapshot.empty) {
      newStudentsTableBody.innerHTML = '<tr><td colspan="3" class="empty-state"><i class="fas fa-inbox"></i><br>No new registrations</td></tr>';
      return;
    }

    snapshot.forEach(doc => {
      const s = doc.data();
      const row = `
        <tr>
          <td><strong>${s.name || 'N/A'}</strong></td>
          <td>${s.phone || 'N/A'}</td>
          <td><span style="color: var(--accent); font-weight: 600;">${s.level || 'N/A'}</span></td>
        </tr>`;
      newStudentsTableBody.insertAdjacentHTML('beforeend', row);
    });

    showToast(`Loaded ${snapshot.size} new registrations`, 'success');
  } catch (err) {
    console.error("Load New Students Error:", err);
    showToast("Failed to load registrations", "error");
  } finally {
    isLoading = false;
  }
}

// Add remove all function for new students
async function removeAllStudents() {
  showConfirm('This will permanently delete ALL new student registrations. This action cannot be undone!', async () => {
    if (isLoading) return;
    
    try {
      isLoading = true;
      const snapshot = await db.collection('NewStudents').get();
      
      if (snapshot.empty) {
        showToast("No registrations to delete", "info");
        return;
      }

      const batch = db.batch();
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      showToast(`Deleted ${snapshot.size} registrations successfully!`, 'success');
      loadNewStudents();
    } catch (err) {
      console.error("Delete All Error:", err);
      showToast("Failed to delete registrations", "error");
    } finally {
      isLoading = false;
    }
  });
}

// Make removeAllStudents globally accessible
window.removeAllStudents = removeAllStudents;

// --- 3. Quiz Results Management (Complete Rewrite) ---

// Add action bar to results overlay
function addResultsActionBar() {
  const existingBar = document.querySelector('.results-action-bar');
  if (existingBar) existingBar.remove();
  
  const actionBar = document.createElement('div');
  actionBar.className = 'action-bar results-action-bar';
  actionBar.innerHTML = `
    <div style="display: flex; gap: 10px; align-items: center;">
      <input type="text" class="search-input" id="results-search" placeholder="🔍 Search results...">
      <button class="refresh-btn" id="refresh-results">
        <i class="fas fa-sync-alt"></i> Refresh
      </button>
    </div>
    <button class="danger-btn" id="delete-all-results">
      <i class="fas fa-trash-alt"></i> Remove All Results
    </button>
  `;

  const resultsHeader = resultsOverlay.querySelector('h2');
  resultsHeader.after(actionBar);

  // Add event listeners
  document.getElementById('refresh-results').addEventListener('click', loadResults);
  document.getElementById('delete-all-results').addEventListener('click', deleteAllResults);
  document.getElementById('results-search').addEventListener('input', filterResults);
}

btnResults.addEventListener('click', () => {
  resultsOverlay.style.display = 'block';
  addResultsActionBar();
  loadResults();
});

closeResultsBtn.addEventListener('click', () => resultsOverlay.style.display = 'none');

// Load all results
async function loadResults() {
  if (isLoading) return;
  
  try {
    isLoading = true;
    resultsTableBody.innerHTML = '<tr><td colspan="5" class="empty-state"><div class="loading-spinner"></div><br>Loading results...</td></tr>';

    const snapshot = await db.collection('results').orderBy('timestamp', 'desc').get();
    resultsTableBody.innerHTML = '';

    if (snapshot.empty) {
      resultsTableBody.innerHTML = '<tr><td colspan="5" class="empty-state"><i class="fas fa-chart-bar"></i><br>No quiz results found</td></tr>';
      return;
    }

    // Collect all unique user IDs
    const userIds = new Set();
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.userId) userIds.add(data.userId);
    });

    // Batch fetch user data
    const userCache = {};
    if (userIds.size > 0) {
      const userPromises = [];
      const userIdArray = Array.from(userIds);
      
      // Process in batches of 10 (Firestore limitation)
      for (let i = 0; i < userIdArray.length; i += 10) {
        const batch = userIdArray.slice(i, i + 10);
        userPromises.push(
          Promise.all(batch.map(uid => db.collection('users').doc(uid).get()))
        );
      }
      
      const userResults = await Promise.all(userPromises);
      userResults.flat().forEach(userDoc => {
        if (userDoc.exists) {
          userCache[userDoc.id] = userDoc.data().nickname || 'Unknown';
        }
      });
    }

    // Render results
    snapshot.forEach(doc => {
      const res = doc.data();
      const date = formatDate(res.timestamp);
      
      let displayName = "Anonymous";
      if (res.userId && userCache[res.userId]) {
        displayName = userCache[res.userId];
      } else if (res.userEmail) {
        displayName = res.userEmail;
      }

      const scoreDisplay = res.total ? `${res.score} / ${res.total} (${Math.round((res.score / res.total) * 100)}%)` : res.score;

      const row = `
        <tr data-result-id="${doc.id}" data-student="${displayName.toLowerCase()}">
          <td><strong>${displayName}</strong></td>
          <td>${res.quizName || res.quizId || 'General Quiz'}</td>
          <td style="color: var(--accent); font-weight: bold;">${scoreDisplay}</td>
          <td>${date}</td>
          <td>
            <button class="delete-result-btn" onclick="deleteResult('${doc.id}')" title="Delete this result">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>`;
      resultsTableBody.insertAdjacentHTML('beforeend', row);
    });

    showToast(`Loaded ${snapshot.size} results`, 'success');
  } catch (err) {
    console.error("Results Load Error:", err);
    resultsTableBody.innerHTML = '<tr><td colspan="5" class="empty-state"><i class="fas fa-exclamation-triangle"></i><br>Error loading results. Please try again.</td></tr>';
    showToast("Failed to load results", "error");
  } finally {
    isLoading = false;
  }
}

// Filter results by search term
function filterResults(event) {
  const searchTerm = event.target.value.toLowerCase();
  const rows = resultsTableBody.querySelectorAll('tr');
  
  rows.forEach(row => {
    if (row.querySelector('.empty-state')) return; // Skip empty state row
    
    const studentName = row.dataset.student || '';
    const quizName = row.querySelector('td:nth-child(2)')?.textContent.toLowerCase() || '';
    const score = row.querySelector('td:nth-child(3)')?.textContent.toLowerCase() || '';
    
    if (studentName.includes(searchTerm) || quizName.includes(searchTerm) || score.includes(searchTerm)) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

// Delete single result
async function deleteResult(id) {
  showConfirm('Are you sure you want to delete this result? This action cannot be undone.', async () => {
    try {
      await db.collection('results').doc(id).delete();
      showToast("Result deleted successfully!", 'success');
      loadResults();
    } catch (err) {
      console.error("Delete Error:", err);
      showToast("Failed to delete result", "error");
    }
  });
}

// DELETE ALL RESULTS - Main function you requested
async function deleteAllResults() {
  const snapshot = await db.collection('results').get();
  
  if (snapshot.empty) {
    showToast("No results to delete", "info");
    return;
  }

  showConfirm(
    `⚠️ WARNING: This will permanently delete ALL ${snapshot.size} quiz results!<br><br>This action CANNOT be undone. Are you absolutely sure?`,
    async () => {
      if (isLoading) return;
      
      try {
        isLoading = true;
        
        // Show progress
        const deleteBtn = document.getElementById('delete-all-results');
        if (deleteBtn) {
          deleteBtn.disabled = true;
          deleteBtn.innerHTML = '<div class="loading-spinner"></div> Deleting...';
        }

        // Use batch delete for better performance
        const batch = db.batch();
        let count = 0;
        
        snapshot.forEach(doc => {
          batch.delete(doc.ref);
          count++;
        });

        await batch.commit();
        
        showToast(`✅ Successfully deleted ${count} results!`, 'success');
        loadResults(); // Reload empty table
        
      } catch (err) {
        console.error("Delete All Results Error:", err);
        
        // Fallback: try one by one if batch fails
        try {
          showToast("Batch delete failed. Trying alternative method...", "info");
          
          let deletedCount = 0;
          const deletePromises = [];
          
          snapshot.forEach(doc => {
            deletePromises.push(
              db.collection('results').doc(doc.id).delete()
                .then(() => { deletedCount++; })
                .catch(e => console.error(`Failed to delete ${doc.id}:`, e))
            );
          });
          
          await Promise.all(deletePromises);
          showToast(`⚠️ Partially deleted ${deletedCount}/${snapshot.size} results`, 'warning');
          loadResults();
          
        } catch (fallbackErr) {
          console.error("Fallback Delete Error:", fallbackErr);
          showToast("Failed to delete results. Please try again.", "error");
        }
        
      } finally {
        isLoading = false;
        const deleteBtn = document.getElementById('delete-all-results');
        if (deleteBtn) {
          deleteBtn.disabled = false;
          deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Remove All Results';
        }
      }
    }
  );
}

// Make functions globally accessible
window.deleteResult = deleteResult;
window.deleteAllResults = deleteAllResults;

// --- Logout ---
document.getElementById('logout-btn').addEventListener('click', async () => {
  showConfirm('Are you sure you want to logout?', async () => {
    try {
      await auth.signOut();
      window.location.href = "index.html";
    } catch (err) {
      console.error("Logout Error:", err);
      showToast("Failed to logout", "error");
    }
  });
});

// --- Close overlays when clicking outside ---
window.addEventListener('click', (e) => {
  if (e.target.classList.contains('overlay')) {
    e.target.style.display = 'none';
  }
});

// --- Keyboard shortcuts ---
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.overlay').forEach(overlay => {
      overlay.style.display = 'none';
    });
  }
});

console.log('🔐 AngloRoom Admin Panel Initialized');