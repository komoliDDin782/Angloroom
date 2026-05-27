// assets/js/chat.js

const messagesBox = document.getElementById('messages-box');
const chatForm = document.getElementById('chat-form');
const msgInput = document.getElementById('msg-input');

let currentUser;
let cachedUserData = {
  nickname: "Student",
  profilePic: "assets/image/logo.jpg" // Fallback logo path
};

// UPDATED ADMIN EMAIL CONFIGURATION
const ADMIN_EMAIL = "test@gmail.com";

/* ---------- Auth Control & Profile Fetch ---------- */
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  
  currentUser = user;
  
  try {
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (userDoc.exists) {
      const data = userDoc.data();
      if (data.nickname) cachedUserData.nickname = data.nickname;
      if (data.profilePic) cachedUserData.profilePic = data.profilePic;
    }
  } catch (err) {
    console.error("Failed to parse student data card details:", err);
  }

  listenForMessages();
});

/* ---------- Real-Time Listener (Firestore Snapshot) ---------- */
function listenForMessages() {
  db.collection('messages')
    .orderBy('createdAt', 'asc')
    .limitToLast(50)
    .onSnapshot((snapshot) => {
      messagesBox.innerHTML = '';

      snapshot.forEach((doc) => {
        const msg = doc.data();
        // Passes the Firestore document ID to allow targeted moderation
        renderMessage(msg, doc.id);
      });

      messagesBox.scrollTop = messagesBox.scrollHeight;
    }, (error) => {
      console.error("Snapshot network failure tracking messages:", error);
    });
}

/* ---------- HTML Render Template Matrix ---------- */
function renderMessage(msg, msgId) {
  const isMe = msg.uid === currentUser.uid;
  const alignmentClass = isMe ? 'outgoing' : 'incoming';
  
  // CHECKS IF THE CURRENT LOGGED-IN ACCOUNT IS TEST@GMAIL.COM
  const isAdmin = currentUser && currentUser.email === ADMIN_EMAIL;
  const deleteBtnHTML = isAdmin 
    ? `<button class="admin-delete-btn" onclick="deleteMessage('${msgId}')" title="Delete message"><i class="fas fa-trash"></i></button>` 
    : '';
  
  const msgHTML = `
    <div class="msg-wrapper ${alignmentClass}">
      <img src="${msg.profilePic || 'assets/image/logo.jpg'}" alt="${msg.nickname}" class="user-avatar">
      <div class="msg-body">
        <div class="meta-row">
          <span class="meta-info">${msg.nickname}</span>
          ${deleteBtnHTML}
        </div>
        <div class="bubble">${escapeHTML(msg.text)}</div>
      </div>
    </div>
  `;
  
  messagesBox.insertAdjacentHTML('beforeend', msgHTML);
}

/* ---------- Admin Action Vector: Delete Document ---------- */
window.deleteMessage = async function(msgId) {
  if (!confirm("Delete this message permanently from the group?")) return;
  
  try {
    await db.collection('messages').doc(msgId).delete();
  } catch (err) {
    console.error("Failed to delete message:", err);
    alert("Could not remove message. Try again.");
  }
};

/* ---------- Intercept Form Actions & Output Vector ---------- */
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const textToSend = msgInput.value.trim();
  if (!textToSend) return;

  msgInput.value = '';

  try {
    await db.collection('messages').add({
      text: textToSend,
      uid: currentUser.uid,
      nickname: cachedUserData.nickname,
      profilePic: cachedUserData.profilePic,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (err) {
    console.error("Failed to commit message block transaction:", err);
    alert("Message could not be transmitted. Please try again.");
  }
});

/* ---------- Protection Sanitizer Utility ---------- */
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}