const quizContainer = document.getElementById('quiz-container');
const quizModal = document.getElementById('quiz-modal');
const modalQuizContainer = document.getElementById('modal-quiz-container');
const closeModal = document.getElementById('close-modal');

let currentUser;
let userLevel;
let startTime, endTime;

/* ---------- Utils ---------- */
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

/* ---------- Auth ---------- */
auth.onAuthStateChanged(async user => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  currentUser = user;

  try {
    const userDoc = await db.collection('users').doc(user.uid).get();
    userLevel = userDoc.exists ? userDoc.data().level || 'beginner' : 'beginner';
    
    // Show video lesson only for intermediate users
    const videoLesson = document.getElementById('video-lesson');
    if (videoLesson && userLevel === 'intermediate') {
      videoLesson.style.display = 'block';
    }
    
    loadQuizCards();
  } catch (err) {
    console.error(err);
    alert('Failed to load user data.');
  }
});

/* ---------- Load quiz cards ---------- */
async function loadQuizCards() {
  try {
    const res = await fetch('data/quizzes/index.json');
    const quizzes = await res.json();

    quizContainer.innerHTML = '';

    for (const quiz of quizzes) {
      // Only show quizzes matching the user's level
      if (quiz.level !== userLevel) continue;

      const card = document.createElement('div');
      card.className = 'quiz-card';
      card.textContent = quiz.title;

      const completed = await db.collection('results')
        .where('userId', '==', currentUser.uid)
        .where('quizId', '==', quiz.id)
        .get();
      if (!completed.empty) {
        card.style.opacity = '0.5';
        card.style.cursor = 'not-allowed';
        card.title = 'Quiz already completed';
      } else {
        card.addEventListener('click', () =>
          openQuizModal(`data/quizzes/${quiz.file}`, quiz.id)
        );
      }

      quizContainer.appendChild(card);
    }

  } catch (err) {
    console.error(err);
    alert('Failed to load quizzes.');
  }
}

/* ---------- Open quiz ---------- */
async function openQuizModal(jsonFile, quizId) {
  try {
    const res = await fetch(jsonFile);
    const quizData = await res.json();

    modalQuizContainer.innerHTML = '';

    const questions = shuffle(quizData.questions);
    const form = document.createElement('form');
    form.id = 'quiz-form';

    questions.forEach((q, index) => {
      const correctAnswer = q.options[0];
      const shuffledOptions = shuffle(q.options);

      const qCard = document.createElement('div');
      qCard.className = 'question-card';
      qCard.dataset.correct = correctAnswer;

      qCard.innerHTML = `<p class="question-text">${index + 1}. ${q.question}</p>`;
      const ul = document.createElement('ul');
      ul.className = 'options';

      shuffledOptions.forEach(opt => {
        const li = document.createElement('li');
        li.textContent = opt;
        li.addEventListener('click', () => {
          ul.querySelectorAll('li').forEach(el => el.classList.remove('selected'));
          li.classList.add('selected');
        });
        ul.appendChild(li);
      });

      qCard.appendChild(ul);
      form.appendChild(qCard);
    });

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.textContent = 'Submit Quiz';
    submitBtn.style.marginTop = '20px';
    form.appendChild(submitBtn);

    // START TIMER
    startTime = Date.now();

    form.addEventListener('submit', async e => {
      e.preventDefault();
      endTime = Date.now();
      const timeTakenMs = endTime - startTime;

      let score = 0;
      form.querySelectorAll('.question-card').forEach(card => {
        const selected = card.querySelector('.selected');
        if (selected && selected.textContent === card.dataset.correct) score++;
      });

      try {
        await db.collection('results').add({
          userId: currentUser.uid,
          quizId: quizId,
          score,
          total: form.querySelectorAll('.question-card').length,
          level: userLevel,
          timeTaken: timeTakenMs,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert(`Result: ${score} / ${form.querySelectorAll('.question-card').length} in ${formatTime(timeTakenMs)}`);
        quizModal.style.display = 'none';
        modalQuizContainer.innerHTML = '';
        loadQuizCards();
      } catch (err) {
        console.error(err);
        alert('Failed to submit quiz.');
      }
    });

    modalQuizContainer.appendChild(form);
    quizModal.style.display = 'block';
  } catch (err) {
    console.error(err);
    alert('Failed to load quiz.');
  }
}

/* ---------- Close modal ---------- */
closeModal.addEventListener('click', () => {
  quizModal.style.display = 'none';
  modalQuizContainer.innerHTML = '';
});

window.addEventListener('click', e => {
  if (e.target === quizModal) {
    quizModal.style.display = 'none';
    modalQuizContainer.innerHTML = '';
  }
});
