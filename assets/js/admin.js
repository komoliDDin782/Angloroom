// --- Configuration ---
const adminEmail = "komoliddinkevin@gmail.com";
let currentUser;
let isLoading = false;
let changedLevels = {}; // Track changes: { userId: newLevel }

const LEVELS = ['beginner', 'elementary', 'intermediate', 'advanced'];
const LEVEL_ICONS = { beginner: '🌱', elementary: '📗', intermediate: '📘', advanced: '📕' };

// --- Toast System ---
function showToast(message, type = 'info') {
  const existingToast = document.querySelector('.admin-toast');
  if (existingToast) existingToast.remove();

  const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle', warning: 'fa-exclamation-triangle' };
  const colors = { success: '#10b981', error: '#ef4444', info: '#3b82f6', warning: '#f59e0b' };

  const toast = document.createElement('div');
  toast.className = 'admin-toast';
  toast.innerHTML = `<i class="fas ${icons[type]}"></i> ${message}`;
  
  Object.assign(toast.style, {
    position: 'fixed', bottom: '20px', right: '20px', padding: '12px 20px',
    borderRadius: '10px', background: colors[type], color: 'white', fontWeight: '600',
    zIndex: '9999', display: 'flex', alignItems: 'center', gap: '8px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.3)', animation: 'slideInRight 0.3s ease',
    maxWidth: '400px', fontSize: '14px'
  });

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// --- Confirm Dialog ---
function showConfirm(message, onConfirm) {
  const overlay = document.createElement('div');
  Object.assign(overlay.style, {
    position: 'fixed', inset: '0', background: 'rgba(0,0,0,0.7)',
    zIndex: '10000', display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(5px)'
  });

  const dialog = document.createElement('div');
  Object.assign(dialog.style, {
    background: '#022c22', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px', padding: '24px', maxWidth: '400px', width: '90%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
  });

  dialog.innerHTML = `
    <h3 style="color: white; margin-bottom: 8px; font-size: 18px;">Confirm Action</h3>
    <p style="color: #94a3b8; margin-bottom: 20px; font-size: 14px;">${message}</p>
    <div style="display: flex; gap: 10px;">
      <button id="confirm-no" style="flex:1; padding:10px; border-radius:8px; background:rgba(255,255,255,0.1); color:white; border:1px solid rgba(255,255,255,0.1); cursor:pointer; font-weight:600; font-size:14px;">Cancel</button>
      <button id="confirm-yes" style="flex:1; padding:10px; border-radius:8px; background:#ef4444; color:white; border:none; cursor:pointer; font-weight:600; font-size:14px;">Confirm</button>
    </div>
  `;

  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  const close = () => document.body.removeChild(overlay);
  dialog.querySelector('#confirm-yes').onclick = () => { close(); onConfirm(); };
  dialog.querySelector('#confirm-no').onclick = close;
  overlay.onclick = (e) => { if (e.target === overlay) close(); };
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
    setTimeout(() => window.location.href = "main.html", 2000);
    return;
  }
  document.querySelector('main').style.display = 'block';
});

document.querySelector('main').style.display = 'none';

// --- Utility Functions ---
function capitalize(word) {
  if (!word) return 'N/A';
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  const date = timestamp?.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ============================================
// 1. STUDENT MANAGEMENT (DROPDOWNS + COUNTS)
// ============================================

const studentTables = {
  beginner: document.querySelector('#students-beginner tbody'),
  elementary: document.querySelector('#students-elementary tbody'),
  intermediate: document.querySelector('#students-intermediate tbody'),
  advanced: document.querySelector('#students-advanced tbody')
};

const countBadges = {
  beginner: document.getElementById('count-beginner'),
  elementary: document.getElementById('count-elementary'),
  intermediate: document.getElementById('count-intermediate'),
  advanced: document.getElementById('count-advanced')
};

const studentsOverlay = document.getElementById('students-overlay');
const saveAllBtn = document.getElementById('save-all-levels');
const changesCountEl = document.getElementById('changes-count');

document.getElementById('btn-students').addEventListener('click', () => {
  studentsOverlay.style.display = 'block';
  loadStudents();
});

document.getElementById('close-students').addEventListener('click', () => {
  studentsOverlay.style.display = 'none';
});

async function loadStudents() {
  if (isLoading) return;
  
  try {
    isLoading = true;
    changedLevels = {};
    updateSaveButton();
    
    // Clear all tables
    LEVELS.forEach(level => {
      studentTables[level].innerHTML = '';
      countBadges[level].textContent = '...';
      countBadges[level].className = 'level-badge';
    });

    const snapshot = await db.collection('users').get();
    
    if (snapshot.empty) {
      LEVELS.forEach(level => {
        studentTables[level].innerHTML = `<tr><td colspan="3" class="empty-state"><i class="fas fa-user-graduate"></i><span>No students</span></td></tr>`;
        countBadges[level].textContent = '0';
        countBadges[level].classList.add('empty');
      });
      return;
    }

    // Group students by level
    const grouped = { beginner: [], elementary: [], intermediate: [], advanced: [] };
    
    snapshot.forEach(doc => {
      const user = doc.data();
      const level = user.level && LEVELS.includes(user.level) ? user.level : 'beginner';
      grouped[level].push({ id: doc.id, ...user });
    });

    // Render each level
    LEVELS.forEach(level => {
      const students = grouped[level];
      countBadges[level].textContent = students.length;
      if (students.length === 0) countBadges[level].classList.add('empty');

      if (students.length === 0) {
        studentTables[level].innerHTML = `<tr><td colspan="3" class="empty-state"><i class="fas fa-user-graduate"></i><span>No students in this level</span></td></tr>`;
        return;
      }

      students.forEach(student => {
        const pic = student.profilePic || 'assets/img/default-pic.png';
        const name = student.nickname || 'Unknown';
        
        const levelOptions = LEVELS.map(opt => 
          `<option value="${opt}" ${level === opt ? 'selected' : ''}>${capitalize(opt)}</option>`
        ).join('');

        const row = document.createElement('tr');
        row.setAttribute('data-id', student.id);
        row.setAttribute('data-original-level', level);
        row.innerHTML = `
          <td><img src="${pic}" class="student-pic" alt="${name}" onerror="this.src='assets/img/default-pic.png'"></td>
          <td><strong>${name}</strong></td>
          <td>
            <select class="level-select" data-user-id="${student.id}" data-original="${level}">
              ${levelOptions}
            </select>
          </td>
        `;

        // Listen for changes
        const select = row.querySelector('.level-select');
        select.addEventListener('change', function() {
          const newLevel = this.value;
          const originalLevel = this.dataset.original;
          
          if (newLevel !== originalLevel) {
            changedLevels[student.id] = newLevel;
            this.classList.add('changed');
          } else {
            delete changedLevels[student.id];
            this.classList.remove('changed');
          }
          
          updateSaveButton();
        });

        studentTables[level].appendChild(row);
      });
    });

  } catch (err) {
    console.error("Load Students Error:", err);
    showToast("Failed to load students", "error");
  } finally {
    isLoading = false;
  }
}

function updateSaveButton() {
  const count = Object.keys(changedLevels).length;
  changesCountEl.textContent = count;
  saveAllBtn.disabled = count === 0;
  
  if (count > 0) {
    saveAllBtn.textContent = `💾 Save ${count} Change${count > 1 ? 's' : ''}`;
    saveAllBtn.style.background = '#f59e0b';
  } else {
    saveAllBtn.textContent = '💾 Save Changes';
    saveAllBtn.style.background = 'var(--accent)';
  }
}

saveAllBtn.addEventListener('click', async () => {
  const count = Object.keys(changedLevels).length;
  if (count === 0 || isLoading) return;
  
  showConfirm(`Apply ${count} level change${count > 1 ? 's' : ''}?`, async () => {
    try {
      isLoading = true;
      saveAllBtn.disabled = true;
      saveAllBtn.innerHTML = '<span class="loading-spinner"></span> Saving...';
      
      const batch = db.batch();
      for (const [userId, newLevel] of Object.entries(changedLevels)) {
        batch.update(db.collection('users').doc(userId), { level: newLevel });
      }
      
      await batch.commit();
      showToast(`${count} student${count > 1 ? 's' : ''} updated!`, 'success');
      loadStudents();
      
    } catch (err) {
      console.error("Update Error:", err);
      showToast("Failed to update students", "error");
    } finally {
      isLoading = false;
    }
  });
});

// ============================================
// 2. NEW STUDENT REGISTRATIONS
// ============================================

const newStudentsOverlay = document.getElementById('new-students-overlay');
const newStudentsTableBody = document.querySelector('#new-students-table tbody');
const newStudentsCountEl = document.getElementById('new-students-count');

document.getElementById('btn-new-students').addEventListener('click', () => {
  newStudentsOverlay.style.display = 'block';
  loadNewStudents();
});

document.getElementById('close-new-students').addEventListener('click', () => {
  newStudentsOverlay.style.display = 'none';
});

async function loadNewStudents() {
  if (isLoading) return;
  
  try {
    isLoading = true;
    newStudentsTableBody.innerHTML = '';

    const snapshot = await db.collection('NewStudents').orderBy('timestamp', 'desc').get();
    
    if (snapshot.empty) {
      newStudentsTableBody.innerHTML = '<tr><td colspan="5" class="empty-state"><i class="fas fa-inbox"></i><span>No new registrations</span></td></tr>';
      newStudentsCountEl.textContent = '';
      return;
    }

    newStudentsCountEl.textContent = `${snapshot.size} registration${snapshot.size > 1 ? 's' : ''}`;

    snapshot.forEach(doc => {
      const s = doc.data();
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${s.name || 'N/A'}</strong></td>
        <td>${s.phone || 'N/A'}</td>
        <td><span style="color: var(--accent); font-weight: 600;">${capitalize(s.level) || 'N/A'}</span></td>
        <td>${formatDate(s.timestamp)}</td>
        <td>
          <button class="btn btn-primary btn-sm" onclick="approveStudent('${doc.id}')">✓ Approve</button>
          <button class="btn btn-danger btn-sm" onclick="rejectStudent('${doc.id}')">✕ Reject</button>
        </td>
      `;
      newStudentsTableBody.appendChild(row);
    });

  } catch (err) {
    console.error("Load Error:", err);
    newStudentsTableBody.innerHTML = '<tr><td colspan="5" class="empty-state"><i class="fas fa-exclamation-triangle"></i><span>Error loading registrations</span></td></tr>';
    showToast("Failed to load registrations", "error");
  } finally {
    isLoading = false;
  }
}

async function approveStudent(docId) {
  showConfirm('Approve and add to students?', async () => {
    try {
      const doc = await db.collection('NewStudents').doc(docId).get();
      if (!doc.exists) { showToast("Not found", "error"); return; }
      
      const data = doc.data();
      await db.collection('users').add({
        nickname: data.name || 'New Student',
        phone: data.phone || '',
        level: data.level || 'beginner',
        email: data.email || '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      await db.collection('NewStudents').doc(docId).delete();
      showToast('Student approved!', 'success');
      loadNewStudents();
    } catch (err) {
      console.error(err);
      showToast("Failed to approve", "error");
    }
  });
}

async function rejectStudent(docId) {
  showConfirm('Reject and delete this registration?', async () => {
    try {
      await db.collection('NewStudents').doc(docId).delete();
      showToast('Registration rejected', 'success');
      loadNewStudents();
    } catch (err) {
      console.error(err);
      showToast("Failed to reject", "error");
    }
  });
}

async function removeAllStudents() {
  const snapshot = await db.collection('NewStudents').get();
  if (snapshot.empty) { showToast("Nothing to delete", "info"); return; }
  
  showConfirm(`Delete ALL ${snapshot.size} registrations?`, async () => {
    try {
      isLoading = true;
      const batch = db.batch();
      snapshot.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      showToast(`${snapshot.size} deleted!`, 'success');
      loadNewStudents();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete", "error");
    } finally {
      isLoading = false;
    }
  });
}

window.approveStudent = approveStudent;
window.rejectStudent = rejectStudent;
window.removeAllStudents = removeAllStudents;

// ============================================
// 3. QUIZ RESULTS
// ============================================

const resultsOverlay = document.getElementById('results-overlay');
const resultsTableBody = document.querySelector('#results-table tbody');

document.getElementById('btn-results').addEventListener('click', () => {
  resultsOverlay.style.display = 'block';
  loadResults();
});

document.getElementById('close-results').addEventListener('click', () => {
  resultsOverlay.style.display = 'none';
});

async function loadResults() {
  if (isLoading) return;
  
  try {
    isLoading = true;
    resultsTableBody.innerHTML = '';

    const snapshot = await db.collection('results').orderBy('timestamp', 'desc').get();
    
    if (snapshot.empty) {
      resultsTableBody.innerHTML = '<tr><td colspan="5" class="empty-state"><i class="fas fa-chart-bar"></i><span>No quiz results</span></td></tr>';
      return;
    }

    // Batch fetch user nicknames
    const userIds = new Set();
    snapshot.forEach(doc => { const d = doc.data(); if (d.userId) userIds.add(d.userId); });

    const userCache = {};
    if (userIds.size > 0) {
      const arr = Array.from(userIds);
      for (let i = 0; i < arr.length; i += 10) {
        const results = await Promise.all(arr.slice(i, i + 10).map(uid => db.collection('users').doc(uid).get()));
        results.forEach(doc => { if (doc.exists) userCache[doc.id] = doc.data().nickname || 'Unknown'; });
      }
    }

    snapshot.forEach(doc => {
      const res = doc.data();
      let name = "Anonymous";
      if (res.userId && userCache[res.userId]) name = userCache[res.userId];
      else if (res.userEmail) name = res.userEmail;

      const scoreText = res.total 
        ? `<strong style="color: var(--accent);">${res.score}/${res.total}</strong> <small style="color: var(--text-muted);">(${Math.round((res.score/res.total)*100)}%)</small>`
        : `<strong style="color: var(--accent);">${res.score}</strong>`;

      const row = document.createElement('tr');
      row.setAttribute('data-student', name.toLowerCase());
      row.innerHTML = `
        <td><strong>${name}</strong></td>
        <td>${res.quizName || res.quizId || 'Quiz'}</td>
        <td>${scoreText}</td>
        <td>${formatDate(res.timestamp)}</td>
        <td><button class="btn btn-danger btn-sm" onclick="deleteResult('${doc.id}')"><i class="fas fa-trash"></i></button></td>
      `;
      resultsTableBody.appendChild(row);
    });

  } catch (err) {
    console.error(err);
    resultsTableBody.innerHTML = '<tr><td colspan="5" class="empty-state"><i class="fas fa-exclamation-triangle"></i><span>Error loading results</span></td></tr>';
    showToast("Failed to load results", "error");
  } finally {
    isLoading = false;
  }
}

// Search
document.getElementById('results-search').addEventListener('input', function(e) {
  const term = e.target.value.toLowerCase();
  resultsTableBody.querySelectorAll('tr').forEach(row => {
    if (row.querySelector('.empty-state')) return;
    const text = (row.getAttribute('data-student') || '') + ' ' + row.textContent.toLowerCase();
    row.style.display = text.includes(term) ? '' : 'none';
  });
});

document.getElementById('refresh-results').addEventListener('click', loadResults);

async function deleteResult(id) {
  showConfirm('Delete this result?', async () => {
    try {
      await db.collection('results').doc(id).delete();
      showToast("Deleted!", 'success');
      loadResults();
    } catch (err) { console.error(err); showToast("Failed", "error"); }
  });
}

async function deleteAllResults() {
  const snapshot = await db.collection('results').get();
  if (snapshot.empty) { showToast("Nothing to delete", "info"); return; }
  
  showConfirm(`Delete ALL ${snapshot.size} results?`, async () => {
    try {
      isLoading = true;
      const batch = db.batch();
      snapshot.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      showToast(`${snapshot.size} deleted!`, 'success');
      loadResults();
    } catch (err) { console.error(err); showToast("Failed", "error"); }
    finally { isLoading = false; }
  });
}

document.getElementById('delete-all-results').addEventListener('click', deleteAllResults);
window.deleteResult = deleteResult;

// ============================================
// 4. GENERAL
// ============================================

document.getElementById('logout-btn').addEventListener('click', () => {
  showConfirm('Logout from admin panel?', async () => {
    try {
      await auth.signOut();
      window.location.href = "index.html";
    } catch (err) { console.error(err); showToast("Failed to logout", "error"); }
  });
});

// Close overlays on outside click
document.querySelectorAll('.overlay').forEach(overlay => {
  overlay.addEventListener('click', function(e) {
    if (e.target === this) this.style.display = 'none';
  });
});

// Escape to close
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.overlay').forEach(o => o.style.display = 'none');
  }
});

console.log('🔐 AngloRoom Admin Ready');