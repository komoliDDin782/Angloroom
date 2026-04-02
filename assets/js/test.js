const texts = {
  uz: {
    home: 'Bosh sahifa',
    heroTitle: 'Darajangizni bilib oling',
    heroDesc: 'Quyidagi savollarga javob bering va darajangizni aniqlang.',
    submitQuiz: 'Testni yakunlash',
    fullName: 'To‘liq ism',
    phoneNumber: 'Telefon raqam',
    submitInfo: 'Yuborish',
    level: 'Sizning darajangiz',
    footerDesc: 'Haqiqiy natijalarga yo‘naltirilgan ingliz tili markazi.',
     examInfo: 'Natijangizni bilish uchun ism va raqamingizni kiriting.'
  },
  ru: {
    home: 'Главная',
    heroTitle: 'Определите ваш уровень',
    heroDesc: 'Ответьте на вопросы, чтобы узнать свой уровень.',
    submitQuiz: 'Завершить тест',
    fullName: 'Полное имя',
    phoneNumber: 'Телефон',
    submitInfo: 'Отправить',
    level: 'Ваш уровень',
    footerDesc: 'Центр английского языка с реальными результатами.',
    examInfo: 'Введите имя и номер, чтобы узнать результат.'
  }
};
// ================= TASKS =================
const tasks = [
  {
    type: 'gap',
    title: { uz: 'Hafta kunlari', ru: 'Дни недели' },
    desc: { uz: 'Bo‘sh joylarni to‘ldiring.', ru: 'Заполните пропуски.' },
    questions: [
      { question: 'Monday, Tuesday, ___,', answer: 'Wednesday' },
      { question: 'Thursday, ___, Sunday', answer: 'Friday' }
    ]
  },
  {
    type: 'gap',
    title: { uz: 'To be fe’li', ru: 'Глагол to be' },
    desc: { uz: 'To‘g‘ri shaklni yozing.', ru: 'Напишите формы.' },
    questions: [
      { question: 'I ___ a pupil.', answer: 'am' },
      { question: 'She ___ my friend.', answer: 'is' },
      { question: 'We ___ from Uzbekistan.', answer: 'are' }
    ]
  },
  {
    type: 'gap',
    title: { uz: 'Oddiy gaplar', ru: 'Простые предложения' },
    desc: { uz: 'Bo‘sh joylarni to‘ldiring.', ru: 'Заполните пропуски.' },
    questions: [
      { question: 'My name ___ Kevin', answer: 'is' },
      { question: 'I live ___ Uzbekistan.', answer: 'in' },
      { question: 'We ___ a friend.', answer: 'have' },
      { question: 'She ___ got a cat.', answer: 'has' },
      { question: 'The cat ___ black.', answer: 'is' }
    ]
  },
  {
    type: 'gap',
    title: { uz: 'Sonlar', ru: 'Числа' },
    desc: { uz: 'Davomini yozing.', ru: 'Продолжите.' },
    questions: [
      { question: 'One, ___, three', answer: 'two' },
      { question: '___, seventeen, sixteen,', answer: 'sixteen' },
      { question: ' twenty, ___ , forty', answer: 'thirty' },
      { question: 'fifty, ___, seventy ', answer: 'sixty' },
      { question: 'eighty, ___, one hundred ', answer: 'seventy' }

    ]
  },
  {
    type: 'gap',
    title: { uz: 'Ko‘plik shakli', ru: 'Множественное число' },
    desc: { uz: 'Ko‘plikka o‘tkazing.', ru: 'Поставьте во множественное число.' },
    questions: [
      { question: 'This is a bird → ___', answer: 'These are birds' },
      { question: 'Is that a bird? → ___', answer: 'Are those birds?' },
      { question: 'No, it is a mouse → ___', answer: 'No, they are mice' }
    ]
  },
  {
    type: 'gap',
    title: { uz: 'Some / Any / No', ru: 'Some / Any / No' },
    desc: { uz: 'To‘g‘ri variantni qo‘ying.', ru: 'Вставьте правильное слово.' },
    questions: [
      { question: 'There are ___ pictures in the book.', answer: 'some' },
      { question: 'Do you have ___ money?', answer: 'any' },
      { question: 'There is ___ sugar in my tea.', answer: 'no' }
    ]
  },
  {
    type: 'gap',
    title: { uz: 'Solishtirma daraja', ru: 'Степени сравнения' },
    desc: { uz: 'To‘g‘ri shaklni yozing.', ru: 'Заполните форму.' },
    questions: [
      { question: 'This man is ___ (tall) than that one.', answer: 'taller' },
      { question: 'Mary is a ___ (good) student than Lucy.', answer: 'better' },
      { question: 'This garden is the ___ (beautiful) in our town.', answer: 'most beautiful' }
    ]
  },
  {
    type: 'gap',
    title: { uz: 'Predloglar va iboralar', ru: 'Предлоги и выражения' },
    desc: { uz: 'Bo‘sh joylarni to‘ldiring.', ru: 'Заполните пропуски.' },
    questions: [
      { question: 'He decided to get rid ___ his old phone.', answer: 'of' },
      { question: '___ Sunday I get up at nine o’clock.', answer: 'On' },
      { question: 'My mother is afraid ___ dogs.', answer: 'of' }
    ]
  },
  {
    type: 'gap',
    title: { uz: 'Zamonlar', ru: 'Времена' },
    desc: { uz: 'To‘g‘ri zamonni qo‘llang.', ru: 'Используйте правильное время.' },
    questions: [
      { question: 'The boys ___ (run) now.', answer: 'are running' },
      { question: 'She ___ (do) homework every evening.', answer: 'does' },
      { question: 'They ___ (go) to the library on Saturdays.', answer: 'go' },
      { question: 'She ___ (not drink) coffee now.', answer: 'is not drinking' },
      { question: 'Mother ___ (cook) when Nick came.', answer: 'was cooking' },
      { question: 'Tomorrow at this time we ___ (go) to school.', answer: 'will be going' },
      { question: 'My sister ___ (sleep).', answer: 'is sleeping' },
      { question: 'He has just ___ (tell) me.', answer: 'told' },
      { question: 'They have ___ (ask) questions.', answer: 'asked' },
      { question: '___ you ___ (be) at home tomorrow?', answer: 'Will, be' }
    ]
  },
  {
    type: 'gap',
    title: { uz: 'Zamonni aniqlang', ru: 'Определите время' },
    desc: { uz: 'Zamonini yozing.', ru: 'Определите время.' },
    questions: [
      { question: 'She remembered she had forgotten.', answer: 'Past Perfect' },
      { question: 'This book is very ancient.', answer: 'Present Simple' },
      { question: 'I had to call the police.', answer: 'Past Simple' },
      { question: 'If it rains, I will stay at home.', answer: 'first conditional' },
      { question: 'I learn many languages.', answer: 'Present Simple' }
    ]
  }
];
// ================= LANGUAGE SETUP =================
function setLang(lang) {
  localStorage.setItem('lang', lang);

  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = texts[lang][el.dataset.i18n];
  });

  const examInfoText = document.getElementById('examInfoText');
  if (examInfoText) examInfoText.textContent = texts[lang].examInfo;
}

// Initialize language
const currentLang = localStorage.getItem('lang') || 'uz';
setLang(currentLang);

// ================= DOM REFERENCES =================
const quizSection = document.getElementById('quizSection');
const resultCard = document.getElementById('resultCard'); // make sure it exists in HTML
let correctAnswers = 0;

// ================= CREATE QUIZ HTML =================
tasks.forEach((task, i) => {
  const taskCard = document.createElement('div');
  taskCard.className = 'task-card';
  taskCard.dataset.task = i;

  const lang = localStorage.getItem('lang') || 'uz';

  // Task title
  const h3 = document.createElement('h3');
  h3.textContent = `${i + 1}. ${task.title[lang]}`;
  taskCard.appendChild(h3);

  // Task description
  const desc = document.createElement('p');
  desc.textContent = task.desc[lang];
  taskCard.appendChild(desc);

  // Questions
  task.questions.forEach(q => {
    const label = document.createElement('label');
    label.textContent = q.question;

    const input = document.createElement('input');
    input.type = 'text';
    input.dataset.answer = q.answer.toLowerCase();

    label.appendChild(document.createElement('br'));
    label.appendChild(input);
    taskCard.appendChild(label);
  });

  quizSection.appendChild(taskCard);
});

// ================= SUBMIT QUIZ BUTTON =================
const submitQuizBtn = document.createElement('button');
submitQuizBtn.textContent = texts[currentLang].submitQuiz;
submitQuizBtn.className = 'submit-quiz-btn';
quizSection.appendChild(submitQuizBtn);

// ================= QUIZ SUBMIT HANDLER =================
submitQuizBtn.addEventListener('click', () => {
  correctAnswers = 0;

  document.querySelectorAll('.task-card').forEach(card => {
    card.querySelectorAll('input').forEach(input => {
      // Remove old hints
      input.parentElement.querySelectorAll('small').forEach(el => el.remove());

      const val = input.value.trim().toLowerCase();
      const answer = input.dataset.answer;

      if (val === answer) {
        correctAnswers++;
        input.parentElement.classList.add('correct');
        input.parentElement.classList.remove('incorrect');
      } else {
        input.parentElement.classList.add('incorrect');
        input.parentElement.classList.remove('correct');

        const hint = document.createElement('small');
        hint.style.display = 'block';
        hint.style.color = '#f8fafc';
        hint.textContent = `Correct: ${answer}`;
        input.parentElement.appendChild(hint);
      }

      input.disabled = true; // disable input after checking
    });
  });

  // ================= SHOW RESULT =================
  let level = '';
  if (correctAnswers <= 30) level = 'Beginner';
  else if (correctAnswers <= 50) level = 'Elementary';
  else if (correctAnswers <= 60) level = 'Intermediate';
  else level = 'Advanced';

  if (resultCard) {
    resultCard.style.display = 'block';
    resultCard.querySelector('#score').textContent = `${correctAnswers} correct, Level: ${level}`;
  }

  // Disable submit button after submission
  submitQuizBtn.disabled = true;
});