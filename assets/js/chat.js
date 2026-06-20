// assets/js/chat.js

/* ---------- DOM Element Selections ---------- */
const messagesBox = document.getElementById('messages-box');
const chatForm = document.getElementById('chat-form');
const msgInput = document.getElementById('msg-input');

/* ---------- Template Fix for Chat ---------- */
function applyTemplateToChat() {
  const chatContainer = document.querySelector('.chat-container');
  const bodyStyles = getComputedStyle(document.body);
  const vars = [
    '--accent', '--accent-glow', '--accent-glow-strong', '--accent-glow-level',
    '--accent-border-light', '--bg-base', '--bg-glass', '--bg-glass-hover',
    '--bg-input-area', '--bg-current-user', '--bg-reaction-hover',
    '--bg-reply-preview', '--bg-menu', '--bg-menu-btn-hover',
    '--bubble-outgoing-bg-start', '--bubble-outgoing-bg-end',
    '--pulse-glow-color', '--reply-quote-bg', '--reply-user-label', '--text-on-accent'
  ];
  
  vars.forEach(v => {
    const val = bodyStyles.getPropertyValue(v).trim();
    if (val) chatContainer.style.setProperty(v, val);
  });

  const accentGlow = bodyStyles.getPropertyValue('--accent-glow').trim();
  if (accentGlow) {
    chatContainer.style.setProperty('--shadow-send-btn', `0 4px 10px ${accentGlow}`);
    chatContainer.style.setProperty('--shadow-send-btn-hover', `0 0 18px ${accentGlow}`);
  }

  const accent = bodyStyles.getPropertyValue('--accent').trim();
  if (accent) {
    chatContainer.style.setProperty('--shadow-send-btn-hover', `0 0 18px ${accent}`);
  }
}

// Reply UI elements
const replyPreviewBar = document.getElementById('reply-preview-bar');
const replyPreviewText = document.getElementById('reply-preview-text');
const cancelReplyBtn = document.getElementById('cancel-reply-btn');

// Profile Modal UI elements
const modal = document.getElementById('profile-preview-modal');
const modalClose = modal.querySelector('.close');
const modalBg = document.getElementById('preview-bg');
const modalPic = document.getElementById('preview-pic');
const modalNickname = document.getElementById('preview-nickname');
const modalLevel = document.getElementById('preview-level');
const modalAbout = document.getElementById('preview-about');
const modalQuizCount = document.getElementById('preview-quiz-count');
const modalCorrectCount = document.getElementById('preview-correct-count');
const modalLightningCount = document.getElementById('preview-lightning-count');
const modalSteps = modal.querySelectorAll('.level-step');

const actionMenu = document.getElementById('message-action-menu');
const actionReplyBtn = document.getElementById('action-reply');
const actionClearBtn = document.getElementById('action-clear-reaction');
const reactionButtons = document.querySelectorAll('.reaction-btn');
let activeActionBubble = null;

/* ---------- Application State Config ---------- */
let currentUser;
let cachedUserData = {
  nickname: "Student",
  profilePic: "assets/image/logo.jpg"
};
let activeReplyTarget = null;
const globalProfileCache = {};
const levelOrder = ['beginner', 'elementary', 'intermediate', 'advanced'];
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

  try {
    const serverFieldValue = (firebase.firestore && firebase.firestore.FieldValue) 
      ? firebase.firestore.FieldValue.serverTimestamp() 
      : new Date();

    await db.collection('presences').doc(user.uid).set({
      status: 'online',
      lastActive: serverFieldValue
    }, { merge: true });

    window.addEventListener('beforeunload', () => {
      db.collection('presences').doc(user.uid).update({ status: 'offline' });
    });
  } catch (presenceErr) {
    console.error("Presence status write failed:", presenceErr);
  }

  listenForMessages();
  listenForOnlineCount();
  applyTemplateToChat(); 
});

/* ---------- Real-Time Active Users Count ---------- */
function listenForOnlineCount() {
  const countCounterEl = document.getElementById('online-count');
  if (!countCounterEl) return;

  db.collection('presences')
    .where('status', '==', 'online')
    .onSnapshot((snapshot) => {
      const count = snapshot ? snapshot.size : 0;
      countCounterEl.textContent = `Online: ${count}`;
    }, (error) => {
      console.error("Failed to sync online user count:", error);
    });
}

/* ---------- Real-Time Listener (Firestore Snapshot) ---------- */
let isFirstLoad = true; // ✅ Track initial load to force bottom scroll

function listenForMessages() {
  db.collection('messages')
    .orderBy('createdAt', 'asc')
    .limitToLast(50)
    .onSnapshot((snapshot) => {
      const scrollPos = messagesBox.scrollTop;
      const scrollHeight = messagesBox.scrollHeight;
      
      // ✅ Check if user is near the bottom. Tolerance increased to 100px for better UX.
      const isAtBottom = messagesBox.scrollTop + messagesBox.clientHeight >= scrollHeight - 100;
      
      messagesBox.innerHTML = '';
      let lastDate = null;

      snapshot.forEach((doc) => {
        const msg = doc.data();
        const msgDate = msg.createdAt ? getDateOnly(msg.createdAt) : null;
        
        if (msgDate && (!lastDate || msgDate !== lastDate)) {
          const separator = formatDateSeparator(msg.createdAt);
          messagesBox.insertAdjacentHTML('beforeend', separator);
          lastDate = msgDate;
        }
        
        renderMessage(msg, doc.id);
      });

      // ✅ Force scroll to bottom on first load OR if user was already at the bottom
      if (isFirstLoad || isAtBottom) {
        messagesBox.scrollTop = messagesBox.scrollHeight;
        isFirstLoad = false;
      } else {
        messagesBox.scrollTop = scrollPos; // Maintain user's scroll position if reading history
      }
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
  
  let quoteHTML = '';
  if (msg.parentMsg) {
    quoteHTML = `<div class="reply-quote"><span class="reply-user-label">@${msg.parentMsg.nickname}</span>${escapeHTML(msg.parentMsg.text)}</div>`;
  }

  const reactionHTML = buildReactionBar(msg.reactions || {});
  const userReaction = currentUser && msg.reactions ? msg.reactions[currentUser.uid] || '' : '';
  const timestamp = msg.createdAt ? formatMessageTime(msg.createdAt) : '';

  const msgHTML = `
  <div class="msg-wrapper ${alignmentClass}">
    <img src="${msg.profilePic || 'assets/image/logo.jpg'}" alt="${msg.nickname}" class="user-avatar" data-uid="${msg.uid}">
    <div class="msg-body">
      <div class="meta-row">
        <span class="meta-info">${msg.nickname}</span>
        ${deleteBtnHTML}
      </div>
      <div class="bubble" data-msg-id="${msgId}" data-msg-user="${escapeQuotes(msg.nickname)}" data-msg-text="${escapeQuotes(msg.text)}" data-current-reaction="${escapeQuotes(userReaction)}">${quoteHTML}${escapeHTML(msg.text)}</div>
      <span class="msg-timestamp">${timestamp}</span>
      ${reactionHTML}
    </div>
  </div>`;
  
  messagesBox.insertAdjacentHTML('beforeend', msgHTML);
}

function buildReactionBar(reactions) {
  const entries = Object.values(reactions).filter(Boolean);
  if (!entries.length) return '';

  const counts = entries.reduce((acc, emoji) => {
    acc[emoji] = (acc[emoji] || 0) + 1;
    return acc;
  }, {});

  let reactionHTML = '<div class="reaction-bar">';
  for (const [emoji, count] of Object.entries(counts)) {
    reactionHTML += `<span class="reaction-pill">${escapeHTML(emoji)}${count > 1 ? count : ''}</span>`;
  }
  reactionHTML += '</div>';
  return reactionHTML;
}

function formatMessageTime(timestamp) {
  if (!timestamp) return '';
  let date = timestamp.toDate ? timestamp.toDate() : (timestamp instanceof Date ? timestamp : null);
  if (!date) return '';
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function getDateOnly(timestamp) {
  if (!timestamp) return null;
  let date = timestamp.toDate ? timestamp.toDate() : (timestamp instanceof Date ? timestamp : null);
  if (!date) return null;
  return date.toDateString();
}

function formatDateSeparator(timestamp) {
  if (!timestamp) return '';
  let date = timestamp.toDate ? timestamp.toDate() : (timestamp instanceof Date ? timestamp : null);
  if (!date) return '';

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return '<div class="date-separator">Today</div>';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return '<div class="date-separator">Yesterday</div>';
  } else {
    return `<div class="date-separator">${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined })}</div>`;
  }
}

/* ---------- Asynchronous Profile Cache Worker ---------- */
async function getProfileCardData(uid) {
  if (globalProfileCache[uid]) return globalProfileCache[uid];
  
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
      const data = userDoc.data();
      globalProfileCache[uid] = {
        nickname: data.nickname || "Student",
        profilePic: data.profilePic || "assets/image/logo.jpg",
        level: data.level || 'beginner',
        profileBg: data.profileBg || 'assets/image/back4.jpg',
        about: data.about || 'No information yet.',
        quizCount: data.quizCount || 0,
        correctAnswers: data.correctAnswers || 0,
        lightningCount: data.lightningCount || 0
      };
      return globalProfileCache[uid];
    }
  } catch (err) {
    console.error("Failed to parse remote student profile schema card info:", uid, err);
  }
  
  return {
    nickname: "User", profilePic: "assets/image/logo.jpg", level: 'beginner',
    profileBg: 'assets/image/back4.jpg', about: 'No information yet.',
    quizCount: 0, correctAnswers: 0, lightningCount: 0
  };
}

/* ---------- Event Delegation: Chat Click Action Router ---------- */
messagesBox.addEventListener('click', async (e) => {
  if (e.target.classList.contains('user-avatar')) {
    const targetUID = e.target.dataset.uid;
    if (!targetUID) return;

    const profile = await getProfileCardData(targetUID);
    modalPic.src = profile.profilePic;
    modalBg.style.backgroundImage = `url(${profile.profileBg})`;
    modalNickname.textContent = profile.nickname;
    modalLevel.textContent = `Level: ${capitalize(profile.level)}`;
    modalAbout.textContent = profile.about || 'No information yet.';
    if (modalQuizCount) modalQuizCount.textContent = profile.quizCount;
    if (modalCorrectCount) modalCorrectCount.textContent = profile.correctAnswers;
    if (modalLightningCount) modalLightningCount.textContent = profile.lightningCount;

    modalSteps.forEach(step => step.classList.remove('active'));
    const classificationIndex = levelOrder.indexOf(profile.level.toLowerCase());
    for (let i = 0; i <= classificationIndex; i++) {
      if (modalSteps[i]) modalSteps[i].classList.add('active');
    }

    modal.style.display = 'flex';
    return;
  }

  const bubble = e.target.closest('.bubble');
  if (bubble) {
    const msgId = bubble.dataset.msgId;
    const nickname = bubble.dataset.msgUser;
    const text = bubble.dataset.msgText;
    openMessageActionMenu(bubble, msgId, nickname, text);
    return;
  }
});

/* ---------- Reply Actions UI State Managers ---------- */
window.setReplyTarget = function(msgId, nickname, text) {
  activeReplyTarget = { msgId, nickname, text };
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

actionReplyBtn.addEventListener('click', () => {
  if (!activeActionBubble) return;
  const msgId = activeActionBubble.dataset.msgId;
  const nickname = activeActionBubble.dataset.msgUser;
  const text = activeActionBubble.dataset.msgText;
  setReplyTarget(msgId, nickname, text);
  hideActionMenu();
});

reactionButtons.forEach(button => {
  button.addEventListener('click', () => {
    if (!activeActionBubble) return;
    const msgId = activeActionBubble.dataset.msgId;
    const currentReaction = activeActionBubble.dataset.currentReaction || '';
    const emoji = button.dataset.emoji;
    setMessageReaction(msgId, currentReaction === emoji ? '' : emoji);
  });
});

actionClearBtn.addEventListener('click', () => {
  if (!activeActionBubble) return;
  const msgId = activeActionBubble.dataset.msgId;
  setMessageReaction(msgId, '');
});

window.addEventListener('click', (e) => {
  if (actionMenu && !actionMenu.contains(e.target) && !e.target.closest('.bubble')) {
    hideActionMenu();
  }
});

/* ---------- Modal Close Actions ---------- */
modalClose.addEventListener('click', () => modal.style.display = 'none');

window.addEventListener('click', (e) => {
  if (e.target === modal) modal.style.display = 'none';
});

function openMessageActionMenu(bubble, msgId, nickname, text) {
  if (!actionMenu) return;

  activeActionBubble = bubble;
  highlightActionMenuSelection(bubble.dataset.currentReaction || '');
  actionMenu.style.display = 'flex';
  actionMenu.setAttribute('aria-hidden', 'false');

  const bubbleRect = bubble.getBoundingClientRect();
  const menuWidth = 240;
  const menuHeight = actionMenu.offsetHeight;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  let left = bubbleRect.left + bubbleRect.width / 2 - menuWidth / 2;
  let top = bubbleRect.top - menuHeight - 10;
  
  left = Math.max(10, Math.min(left, viewportWidth - menuWidth - 10));
  
  if (top < 10) top = bubbleRect.bottom + 10;
  if (top + menuHeight > viewportHeight) top = Math.max(10, viewportHeight - menuHeight - 10);
  
  actionMenu.style.left = `${left}px`;
  actionMenu.style.top = `${top}px`;
  actionMenu.style.transform = 'none';
}

function highlightActionMenuSelection(currentReaction) {
  reactionButtons.forEach(button => {
    button.classList.toggle('selected', button.dataset.emoji === currentReaction);
  });
}

async function setMessageReaction(msgId, emoji) {
  if (!currentUser) return;

  const fieldPath = `reactions.${currentUser.uid}`;
  const updatePayload = {};
  if (!emoji) {
    updatePayload[fieldPath] = firebase.firestore.FieldValue.delete();
  } else {
    updatePayload[fieldPath] = emoji;
  }

  try {
    await db.collection('messages').doc(msgId).update(updatePayload);
  } catch (err) {
    console.error('Failed to update message reaction:', err);
    alert('Could not update reaction. Please try again.');
  } finally {
    hideActionMenu();
  }
}

function hideActionMenu() {
  if (!actionMenu) return;
  actionMenu.style.display = 'none';
  actionMenu.setAttribute('aria-hidden', 'true');
  activeActionBubble = null;
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

  const payload = {
    text: textToSend,
    uid: currentUser.uid,
    nickname: cachedUserData.nickname,
    profilePic: cachedUserData.profilePic,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

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
    
    // ✅ Ensure client scrolls down to their newly sent message immediately
    setTimeout(() => {
        messagesBox.scrollTop = messagesBox.scrollHeight;
    }, 100);

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

function escapeQuotes(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function capitalize(word) {
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1);
}