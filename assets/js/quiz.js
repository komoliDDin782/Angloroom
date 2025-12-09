// assets/js/quiz.js

const quizContainer = document.getElementById('quiz-container');
let currentUser;

// Helper: shuffle an array
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Check user
auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    loadQuiz();
  } else {
    window.location.href = "index.html";
  }
});

// Load quiz from local JSON
async function loadQuiz() {
  const response = await fetch('data/quizzes/quiz1.json');
  const quiz = await response.json();

  // Shuffle questions
  const questions = shuffle(quiz.questions);

  let html = `<h2>${quiz.title}</h2><form id="quiz-form">`;

  questions.forEach((q, i) => {
    html += `<p>${i + 1}. ${q.question}</p>`;

    // Shuffle options
    const shuffledOptions = shuffle([...q.options]);

    shuffledOptions.forEach(opt => {
      html += `<label>
                 <input type="radio" name="q${i}" value="${opt}" required> ${opt}
               </label><br>`;
    });
  });

  html += `<button type="submit">Submit</button></form>`;
  quizContainer.innerHTML = html;

  // Handle submission
  const quizForm = document.getElementById('quiz-form');
  quizForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    let score = 0;

    questions.forEach((q, i) => {
      const selected = quizForm[`q${i}`].value;
      if (selected === q.options[0]) score++; // first option is correct
    });

    // Save result in Firebase
    await db.collection('results').add({
      userId: currentUser.uid,
      nickname: "", // can fetch from profile later
      quizId: "quiz1",
      score: score,
      total: questions.length,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert(`You scored ${score}/${questions.length}`);
  });
}
