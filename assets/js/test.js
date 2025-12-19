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

function setLang(lang) {
  localStorage.setItem('lang', lang);
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = texts[lang][el.dataset.i18n];
  });

  // NEW: set exam info text
  const examInfoText = document.getElementById('examInfoText');
  if(examInfoText) examInfoText.textContent = texts[lang].examInfo;
}

// Initialize
setLang(localStorage.getItem('lang') || 'uz');


const quizSection = document.getElementById('quizSection');
const registrationModal = document.getElementById('registrationModal');
// ================= TASKS =================
const tasks = [
  {
    type: 'gap', 
    title: { uz: '1-topshiriq: Haftaning kunlari', ru: '1-задание: Дни недели' },
    desc: { uz: 'Bo‘sh joylarni to‘ldiring.', ru: 'Заполните пропуски.' },
    questions: [
      { question: 'Mon___', answer: 'day' },
      { question: 'Tue___', answer: 'sday' },
      { question: 'Wed___', answer: 'nesday' },
      { question: 'Thu___', answer: 'rsday' },
      { question: 'Fri___', answer: 'day' },
      { question: 'S___day', answer: 'aturday' },
      { question: 'S___day', answer: 'unday' },
    ]
  },
  {
    type: 'gap',
    title: { uz: '2-topshiriq: To Be', ru: '2-задание: To Be' },
    desc: { uz: 'Bo‘sh joylarni to‘ldiring.', ru: 'Заполните пропуски.' },
    questions: [
      { question: 'I ___ a student.', answer: 'am' },
      { question: 'He ___ from Russia.', answer: 'is' },
      { question: 'They ___ teachers.', answer: 'are' },
      { question: 'She ___ my sister.', answer: 'is' },
      { question: 'We ___ friends.', answer: 'are' },
    ]
  },
  {
    type: 'gap',
    title: { uz: '3-topshiriq: Oddiy gaplar', ru: '3-задание: Простые предложения' },
    desc: { uz: 'Bo‘sh joylarni to‘ldiring.', ru: 'Заполните пропуски.' },
    questions: [
      { question: 'I ___ from Uzbekistan.', answer: 'am' },
      { question: 'She ___ a friend.', answer: 'is' },
      { question: 'They ___ happy.', answer: 'are' },
      { question: 'We ___ in school.', answer: 'are' },
      { question: 'He ___ a doctor.', answer: 'is' },
    ]
  },
  {
    type: 'gap',
    title: { uz: '4-topshiriq: Raqamlar', ru: '4-задание: Числа' },
    desc: { uz: 'Bo‘sh joylarni to‘ldiring (harflarda).', ru: 'Заполните пропуски (словами).' },
    questions: [
      { question: '1, 2, ___, 4, 5', answer: 'three' },
      { question: '6, ___, 8, 9, 10', answer: 'seven' },
      { question: '11, 12, ___, 14, 15', answer: 'thirteen' },
      { question: '20, ___, 40, 50', answer: 'thirty' },
      { question: '60, ___, 80, 90', answer: 'seventy' },
    ]
  },
  {
    type: 'gap',
    title: { uz: '5-topshiriq: Ko‘plik', ru: '5-задание: Множественное число' },
    desc: { uz: 'Quyidagi otlarni ko‘plik shaklida yozing.', ru: 'Напишите существительные во множественном числе.' },
    questions: [
      { question: 'Mouse -> ___', answer: 'mice' },
      { question: 'Child -> ___', answer: 'children' },
      { question: 'Book -> ___', answer: 'books' },
      { question: 'Man -> ___', answer: 'men' },
      { question: 'Woman -> ___', answer: 'women' },
    ]
  },
  {
    type: 'gap',
    title: { uz: '6-topshiriq: Some/Any/No', ru: '6-задание: Some/Any/No' },
    desc: { uz: 'To‘g‘ri variantni tanlang.', ru: 'Выберите правильный вариант.' },
    questions: [
      { question: 'I have ___ apples. (some/any/no)', answer: 'some' },
      { question: 'Do you have ___ milk? (some/any/no)', answer: 'any' },
      { question: 'There is ___ water in the bottle. (some/any/no)', answer: 'some' },
      { question: 'He has ___ friends. (some/any/no)', answer: 'no' },
      { question: 'Is there ___ sugar? (some/any/no)', answer: 'any' },
    ]
  },
  {
    type: 'gap',
    title: { uz: '7-topshiriq: Solishtirma va eng yuqori daraja', ru: '7-задание: Comparative and Superlative' },
    desc: { uz: 'Bo‘sh joylarni to‘ldiring.', ru: 'Заполните пропуски.' },
    questions: [
      { question: 'This car is ___ (fast) than that one.', answer: 'faster' },
      { question: 'She is the ___ (smart) in class.', answer: 'smartest' },
      { question: 'My house is ___ (big) than yours.', answer: 'bigger' },
      { question: 'He is ___ (tall) than his brother.', answer: 'taller' },
      { question: 'This is the ___ (beautiful) park.', answer: 'most beautiful' },
    ]
  },
  {
    type: 'gap',
    title: { uz: '8-topshiriq: Predloglar', ru: '8-задание: Предлоги' },
    desc: { uz: 'To‘g‘ri variantni tanlang.', ru: 'Выберите правильный вариант.' },
    questions: [
      { question: 'The cat is ___ the table. (on/in/under)', answer: 'on' },
      { question: 'He goes ___ school every day. (to/in/at)', answer: 'to' },
      { question: 'The picture hangs ___ the wall. (on/in/under)', answer: 'on' },
      { question: 'The dog is hiding ___ the bed. (on/in/under)', answer: 'under' },
      { question: 'I live ___ Tashkent. (at/in/on)', answer: 'in' },
    ]
  },
  {
    type: 'gap',
    title: { uz: '9-topshiriq: Fe’llar zamonlar bo‘yicha', ru: '9-задание: Времена глаголов' },
    desc: { uz: 'Bo‘sh joylarni to‘ldiring.', ru: 'Заполните пропуски.' },
    questions: [
      { question: 'Yesterday, I ___ (go) to school.', answer: 'went' },
      { question: 'I ___ (eat) breakfast every morning.', answer: 'eat' },
      { question: 'She ___ (finish) her homework last night.', answer: 'finished' },
      { question: 'They ___ (play) football now.', answer: 'are playing' },
      { question: 'We ___ (see) that movie before.', answer: 'have seen' },
    ]
  },
  {
    type: 'gap',
    title: { uz: '10-topshiriq: Zamondagi ovoz', ru: '10-задание: Passive Voice' },
    desc: { uz: 'Bo‘sh joylarni to‘ldiring.', ru: 'Заполните пропуски.' },
    questions: [
      { question: 'The cake ___ (make) by my mom.', answer: 'was made' },
      { question: 'Letters ___ (send) yesterday.', answer: 'were sent' },
      { question: 'The room ___ (clean) every day.', answer: 'is cleaned' },
      { question: 'This book ___ (write) by him.', answer: 'was written' },
      { question: 'The windows ___ (open) now.', answer: 'are opened' },
    ]
  }
];

// ================= CREATE QUIZ HTML =================
tasks.forEach((task, i) => {
  const taskCard = document.createElement('div');
  taskCard.className = 'task-card';
  taskCard.dataset.task = i;

  const lang = localStorage.getItem('lang') || 'uz';
  const h3 = document.createElement('h3');
  h3.textContent = `${i + 1}. ${task.title[lang]}`;
  taskCard.appendChild(h3);

  const desc = document.createElement('p');
  desc.textContent = task.desc[lang];
  taskCard.appendChild(desc);

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

// ================= SUBMIT QUIZ =================
let correctAnswers = 0;

const submitQuizBtn = document.createElement('button');
submitQuizBtn.textContent = texts[localStorage.getItem('lang') || 'uz'].submitQuiz;
submitQuizBtn.className = 'submit-quiz-btn';
quizSection.appendChild(submitQuizBtn);

submitQuizBtn.addEventListener('click', () => {
  correctAnswers = 0;
  document.querySelectorAll('.task-card').forEach(card => {
    card.querySelectorAll('input').forEach(input => {
      const val = input.value.trim().toLowerCase();
      const answer = input.dataset.answer;
      if(val === answer) {
        correctAnswers++;
        input.parentElement.classList.add('correct');
      } else {
        input.parentElement.classList.add('incorrect');
        const hint = document.createElement('small');
        hint.style.display = 'block';
        hint.style.color = '#155724';
        hint.textContent = `Correct: ${answer}`;
        input.parentElement.appendChild(hint);
      }
      input.disabled = true;
    });
  });
  // Show registration modal
  registrationModal.style.display = 'flex';
});

// ================= SUBMIT STUDENT INFO =================
const submitInfoBtn = document.getElementById('submitInfoBtn');
submitInfoBtn.addEventListener('click', async () => {
  const name = document.getElementById('studentName').value.trim();
  const phone = document.getElementById('studentPhone').value.trim();
  if(!name || !phone) { alert('Please fill all fields'); return; }

  let level = '';
  if(correctAnswers <= 10) level='Beginner';
  else if(correctAnswers <= 30) level='Elementary';
  else if(correctAnswers <= 50) level='Intermediate';
  else level='Advanced';

  try {
    const db = firebase.firestore();
    await db.collection('NewStudents').add({ name, phone, correctAnswers, level, timestamp: new Date() });
    registrationModal.style.display = 'none';

    const resultCard = document.getElementById('resultCard');
    resultCard.style.display = 'block';
    resultCard.querySelector('#score').textContent = `${correctAnswers} correct, Level: ${level}`;
  } catch(e) {
    alert('Failed to save data: ' + e.message);
  }
});