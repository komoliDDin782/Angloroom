// assets/js/chat.js

const messagesBox = document.getElementById('messages-box');
const chatForm = document.getElementById('chat-form');
const msgInput = document.getElementById('msg-input');

// Reply elements Added
const replyPreviewBar = document.getElementById('reply-preview-bar');
const replyPreviewText = document.getElementById('reply-preview-text');
const cancelReplyBtn = document.getElementById('cancel-reply-btn');

let currentUser;
let cachedUserData = {
  nickname: "Student",
  profilePic: "assets/image/logo.jpg"
};

// State management tracking the specific structural node targeted for inline replies
let activeReplyTarget = null;

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
  
  const isAdmin = currentUser && currentUser.email === ADMIN_EMAIL;
  const deleteBtnHTML = isAdmin 
    ? `<button class="admin-delete-btn" onclick="event.stopPropagation(); deleteMessage('${msgId}')" title="Delete message"><i class="fas fa-trash-can"></i>remove</button>` 
    : '';
  
  // Construct internal parent reference if message metadata contains parent pointers
  let quoteHTML = '';
  if (msg.parentMsg) {
    quoteHTML = `<div class="reply-quote"><span class="reply-user-label">@${msg.parentMsg.nickname}</span>${escapeHTML(msg.parentMsg.text)}</div>`;
  }

  const msgHTML = `
  <div class="msg-wrapper ${alignmentClass}">
    <img src="${msg.profilePic || 'assets/image/logo.jpg'}" alt="${msg.nickname}" class="user-avatar">
    <div class="msg-body">
      <div class="meta-row">
        <span class="meta-info">${msg.nickname}</span>
        ${deleteBtnHTML}
      </div>
      <div class="bubble" onclick="setReplyTarget('${msgId}', '${escapeQuotes(msg.nickname)}', '${escapeQuotes(msg.text)}')">${quoteHTML}${escapeHTML(msg.text)}</div>
    </div>
  </div>`;
  
  messagesBox.insertAdjacentHTML('beforeend', msgHTML);
}

/* ---------- Reply Actions UI State Managers ---------- */
window.setReplyTarget = function(msgId, nickname, text) {
  activeReplyTarget = { msgId, nickname, text };
  
  // Truncate preview line text if too long
  const cleanText = text.length > 60 ? text.substring(0, 60) + '...' : text;
  replyPreviewText.innerHTML = `Replying to <strong>@${escapeHTML(nickname)}</strong>: "${escapeHTML(cleanText)}"`;
  
  replyPreviewBar.classList.remove('hidden');
  msgInput.focus();
};

function clearReplyTarget() {
  activeReplyTarget = null;
  replyPreviewBar.classList.add('hidden');
  replyPreviewText.innerText = '';
}

cancelReplyBtn.addEventListener('click', clearReplyTarget);

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

  const payload = {
    text: textToSend,
    uid: currentUser.uid,
    nickname: cachedUserData.nickname,
    profilePic: cachedUserData.profilePic,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  // If a reply target is active, append object map metadata context payload fields
  if (activeReplyTarget) {
    payload.parentMsg = {
      msgId: activeReplyTarget.msgId,
      nickname: activeReplyTarget.nickname,
      text: activeReplyTarget.text
    };
    clearReplyTarget();
  }

  try {
    await db.collection('messages').add(payload);
  } catch (err) {
    console.error("Failed to commit message block transaction:", err);
    alert("Message could not be transmitted. Please try again.");
  }
});

/* ---------- Protection Sanitizer Utilities ---------- */
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// Additional sanitizer for handling raw string parameters inside onclick inline attributes
function escapeQuotes(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}