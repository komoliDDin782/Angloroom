const quizContainer = document.getElementById('quiz-container');
const quizModal = document.getElementById('quiz-modal');
const modalQuizContainer = document.getElementById('modal-quiz-container');
const closeModal = document.getElementById('close-modal');

let currentUser;
let userLevel;

let startTime;
let endTime;

// Exam Lockdown State Variables
let isQuizActive = false;

/* =========================
   UTILS & WORKFLOW HELPER
========================= */

function shuffle(array) {
  const arr = [...array];

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

// Blocks browser/tab closure
function preventExit(e) {
  e.preventDefault();
  e.returnValue = '';
}

/* =========================
   AUTH
========================= */

auth.onAuthStateChanged(async user => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  currentUser = user;

  try {
    const userDoc = await db.collection('users').doc(user.uid).get();

    userLevel = userDoc.exists
      ? userDoc.data().level || 'beginner'
      : 'beginner';

    const videoLesson = document.getElementById('video-lesson');
    if (videoLesson && userLevel === 'intermediate') {
      videoLesson.style.display = 'block';
    }

    loadQuizCards();

  } catch (err) {
    console.error(err);
    alert('Failed to load user.');
  }
});

/* =========================
   LOAD QUIZ CARDS
========================= */

async function loadQuizCards() {
  try {
    const res = await fetch('data/quizzes/index.json');
    const quizzes = await res.json();

    quizContainer.innerHTML = '';

    for (const quiz of quizzes) {
      if (quiz.level !== userLevel) continue;

      const card = document.createElement('div');
      card.className = 'quiz-card';

      card.innerHTML = `
        <div class="quiz-title">${quiz.title}</div>
        <div class="quiz-status">Loading...</div>
      `;

      const status = card.querySelector('.quiz-status');

      const completed = await db
        .collection('results')
        .where('userId', '==', currentUser.uid)
        .where('quizId', '==', quiz.id)
        .get();

      if (!completed.empty) {
        const resultData = completed.docs[0].data();

        card.classList.add('completed');
        status.textContent = 'Completed • Tap to review';

        card.addEventListener('click', () => {
          openReviewModal(resultData);
        });

      } else {
        status.textContent = 'Ready to start';
        card.addEventListener('click', () => {
          showStartModal(
            `data/quizzes/${quiz.file}`,
            quiz.id
          );
        });
      }

      quizContainer.appendChild(card);
    }

  } catch (err) {
    console.error(err);
    alert('Failed to load quizzes.');
  }
}

/* =========================
   OPEN QUIZ (WITH LOCKDOWN)
========================= */

async function openQuizModal(jsonFile, quizId) {
  try {
    const res = await fetch(jsonFile);
    if (!res.ok) throw new Error('Quiz file not found');

    const quizData = await res.json();
    const questions = shuffle(quizData.questions);

    modalQuizContainer.innerHTML = '';

    const form = document.createElement('form');
    form.id = 'quiz-form';

    /* =========================
       QUESTIONS
    ========================= */

    questions.forEach((q, index) => {
      const correctAnswer = q.options[0];
      const shuffledOptions = shuffle(q.options);

      const card = document.createElement('div');
      card.className = 'question-card';
      card.dataset.correct = correctAnswer;

      card.innerHTML = `
        <p class="question-text">
          ${index + 1}. ${q.question}
        </p>
      `;

      const ul = document.createElement('ul');
      ul.className = 'options';

      shuffledOptions.forEach(option => {
        const li = document.createElement('li');
        li.textContent = option;
        ul.appendChild(li);
      });

      ul.addEventListener('click', e => {
        if (e.target.tagName !== 'LI') return;

        ul.querySelectorAll('li').forEach(li =>
          li.classList.remove('selected')
        );

        e.target.classList.add('selected');
      });

      card.appendChild(ul);
      form.appendChild(card);
    });

    /* =========================
       SUBMIT BUTTON
    ========================= */

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'submit-btn';
    submitBtn.textContent = 'Submit Quiz';

    form.appendChild(submitBtn);

    // ACTIVATE LOCKDOWN SYSTEM
    isQuizActive = true;
    closeModal.style.display = 'none';
    window.addEventListener('beforeunload', preventExit);

    startTime = Date.now();

    /* =========================
       SUBMIT LOGIC
    ========================= */

    form.addEventListener('submit', async e => {
      e.preventDefault();

      submitBtn.disabled = true;
      submitBtn.textContent = 'Processing...';

      endTime = Date.now();

      const timeTakenMs = endTime - startTime;
      const totalQuestions = questions.length;

      let score = 0;
      const answers = [];

      form.querySelectorAll('.question-card').forEach((card, index) => {
        const selected = card.querySelector('.selected');

        const selectedAnswer = selected
          ? selected.textContent
          : null;

        const correctAnswer = card.dataset.correct;
        const isCorrect = selectedAnswer === correctAnswer;

        if (isCorrect) score++;

        answers.push({
          question: questions[index].question,
          selectedAnswer,
          correctAnswer,
          isCorrect,
          options: questions[index].options
        });
      });

      try {
        const lightningEarned = timeTakenMs <= 180000;

        // DEACTIVATE LOCKDOWN SYSTEM ON SUCCESSFUL SUBMISSION
        isQuizActive = false;
        closeModal.style.display = 'block';
        window.removeEventListener('beforeunload', preventExit);

        await db.collection('results').add({
          userId: currentUser.uid,
          quizId,
          level: userLevel,
          score,
          total: totalQuestions,
          timeTaken: timeTakenMs,
          answers,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        const userRef = db.collection('users').doc(currentUser.uid);
        await userRef.set({
          quizCount: firebase.firestore.FieldValue.increment(1),
          correctAnswers: firebase.firestore.FieldValue.increment(score),
          lightningCount: firebase.firestore.FieldValue.increment(lightningEarned ? 1 : 0)
        }, { merge: true });

        openReviewModal({
          score,
          total: totalQuestions,
          answers
        }, lightningEarned ? '⚡ Lightning achievement earned!' : '');

        loadQuizCards();

      } catch (err) {
        console.error(err);
        alert('Failed to submit quiz.');

        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Quiz';
      }
    });

    modalQuizContainer.appendChild(form);
    quizModal.style.display = 'block';

  } catch (err) {
    console.error(err);
    alert('Failed to load quiz.');
  }
}

/* =========================
   REVIEW MODE
========================= */

function openReviewModal(resultData, achievementMessage = '') {
  modalQuizContainer.innerHTML = '';

  const wrapper = document.createElement('div');

  wrapper.innerHTML = `
    <div style="margin-bottom:30px;">
      <h2 style="font-size:32px; margin-bottom:10px;">
        Quiz Review
      </h2>

      <p style="color:#94a3b8;">
        Score: ${resultData.score} / ${resultData.total}
      </p>
      ${achievementMessage ? `<p style="margin-top:10px; color:#f59e0b; font-weight:700;">${achievementMessage}</p>` : ''}
    </div>
  `;

  resultData.answers.forEach((answer, index) => {
    const card = document.createElement('div');
    card.className = 'question-card';

    let optionsHTML = '';

    answer.options.forEach(option => {
      let className = '';

      if (option === answer.correctAnswer) {
        className = 'correct-answer';
      }

      if (
        option === answer.selectedAnswer &&
        !answer.isCorrect
      ) {
        className = 'wrong-answer';
      }

      optionsHTML += `
        <li class="${className}">
          ${option}
          ${option === answer.correctAnswer ? ' ✅' : ''}
          ${option === answer.selectedAnswer && !answer.isCorrect ? ' ❌' : ''}
        </li>
      `;
    });

    const notAnsweredHTML = !answer.selectedAnswer
      ? `<p style="margin-top:10px; color:#fbbf24; font-weight:600;">
          ⚠ Not answered
        </p>`
      : '';

    card.innerHTML = `
      <p class="question-text">
        ${index + 1}. ${answer.question}
      </p>

      <ul class="options review-options">
        ${optionsHTML}
      </ul>

      ${notAnsweredHTML}
    `;

    wrapper.appendChild(card);
  });

  modalQuizContainer.appendChild(wrapper);
  quizModal.style.display = 'block';
}

/* =========================
   CLOSE MODAL
========================= */

closeModal.addEventListener('click', () => {
  if (!isQuizActive) closeQuizModal();
});

window.addEventListener('click', e => {
  // If exam state is running, completely ignore outer backdrop clicks
  if (isQuizActive) return;

  if (e.target === quizModal) {
    closeQuizModal();
  }
});

function closeQuizModal() {
  quizModal.style.display = 'none';
  modalQuizContainer.innerHTML = '';
}
const startModal = document.getElementById('start-confirm-modal');
const confirmStartBtn = document.getElementById('confirm-start');
const cancelStartBtn = document.getElementById('cancel-start');

let pendingQuizFile = null;
let pendingQuizId = null;

function showStartModal(file, quizId) {
  pendingQuizFile = file;
  pendingQuizId = quizId;

  startModal.classList.add('show');
}

cancelStartBtn.addEventListener('click', () => {
  startModal.classList.remove('show');
});

confirmStartBtn.addEventListener('click', () => {
  startModal.classList.remove('show');

  openQuizModal(
    pendingQuizFile,
    pendingQuizId
  );
});