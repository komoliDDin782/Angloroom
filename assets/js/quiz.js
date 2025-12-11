const quizContainer = document.getElementById('quiz-container');
let currentUser;

// Modal elements
const quizModal = document.getElementById('quiz-modal');
const modalQuizContainer = document.getElementById('modal-quiz-container');
const closeModal = document.getElementById('close-modal');

// Shuffle helper
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Check authentication
auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    loadQuizCards();
  } else {
    window.location.href = "index.html";
  }
});

// Load quiz cards dynamically from index.json
async function loadQuizCards() {
  try {
    const response = await fetch('data/quizzes/index.json');
    const quizzes = await response.json();

    quizzes.forEach(quiz => {
      const card = document.createElement('div');
      card.classList.add('quiz-card');
      card.textContent = quiz.title;

      card.addEventListener('click', () => openQuizModal(`data/quizzes/${quiz.file}`, quiz.id));
      quizContainer.appendChild(card);
    });
  } catch (err) {
    console.error("Failed to load quizzes:", err);
    alert("Failed to load quizzes. Please try again later.");
  }
}

// Open modal and load quiz questions
async function openQuizModal(jsonFile, quizId) {
  try {
    const response = await fetch(jsonFile);
    const quizData = await response.json();

    let html = `<h2>${quizData.title}</h2><form id="quiz-form">`;

    const questions = shuffle(quizData.questions);

    questions.forEach((q, i) => {
      html += `
        <div class="question-card">
          <div class="question-text">${i + 1}. ${q.question}</div>
          <ul class="options">
            ${shuffle([...q.options]).map(opt => `
              <li>
                <label>
                  <input type="radio" name="q${i}" value="${opt}" required> ${opt}
                </label>
              </li>
            `).join('')}
          </ul>
        </div>
      `;
    });

    html += `<button type="submit">Submit</button></form>`;
    modalQuizContainer.innerHTML = html;
    quizModal.style.display = 'block';

    const quizForm = document.getElementById('quiz-form');
    let submitted = false; // prevent multiple submissions

    quizForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (submitted) return; // do nothing if already submitted
      submitted = true;

      const submitButton = quizForm.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = "Submitting...";

      let score = 0;
      questions.forEach((q, i) => {
        const selected = quizForm[`q${i}`].value;
        if (selected === q.options[0]) score++; // first option is correct
      });

      try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        const nickname = userDoc.exists && userDoc.data().nickname ? userDoc.data().nickname : "";

        await db.collection('results').add({
          userId: currentUser.uid,
          nickname: nickname,
          quizId: quizId,
          score: score,
          total: questions.length,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert(`You scored ${score}/${questions.length}`);
        quizModal.style.display = 'none';
        modalQuizContainer.innerHTML = '';
      } catch (err) {
        console.error("Failed to submit results:", err);
        alert("Failed to submit quiz. Please try again.");
        submitButton.disabled = false;
        submitButton.textContent = "Submit";
        submitted = false;
      }
    });

  } catch (err) {
    console.error("Failed to load quiz JSON:", err);
    alert("Failed to load quiz. Please try again later.");
  }
}

// Close modal
closeModal.addEventListener('click', () => {
  quizModal.style.display = 'none';
  modalQuizContainer.innerHTML = '';
});

// Close modal if clicked outside
window.addEventListener('click', (e) => {
  if (e.target === quizModal) {
    quizModal.style.display = 'none';
    modalQuizContainer.innerHTML = '';
  }
});
