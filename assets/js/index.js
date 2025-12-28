
const text = document.getElementById('splash-text');

// Step 1: Show whole word briefly
text.style.opacity = 1; // show entire word
setTimeout(() => {
  // Step 2: Split letters for animation
  text.innerHTML = text.textContent
    .split('')
    .map(letter => `<span>${letter}</span>`)
    .join('');

  // Step 3: Fade-in letters
  const letters = text.querySelectorAll('span');
  letters.forEach(letter => {
    letter.style.opacity = 1;
  });

  // Step 4: Fade-out splash after animation
  setTimeout(() => {
    const splash = document.getElementById('splash');
    splash.style.opacity = 0;
    setTimeout(() => {
      splash.style.display = 'none';
    }, 1000);
  }, 1500); // wait for letters animation
}, 1000); // show full word for 1 second

    const texts = {
      uz: {
        login: "Kirish", about: "Biz haqimizda", test: "Bepul test",
        title: "Ingliz tilini ishonch bilan o‘rganing",
        desc: "Bepul test orqali haqiqiy darajangizni aniqlang.",
        btn: "Testni boshlash", why: "Nega AngloRoom?",
        c1t: "Malakali o‘qituvchilar", c1d: "O‘z sohasida oliy ma’lumotga ega, boy tajribali va samarali o‘qita oladigan ustozlar.",
        c2t: "Zamonaviy metodika", c2d: "Darslar suhbat va amaliyotga yo‘naltirilgan, shunda o‘quvchilar o‘rganilgan bilimni darhol qo‘llay oladi.",
        c3t: "Aniq natija", c3d: "Har bir o‘quvchining rivoji muntazam kuzatiladi, natijalar ko‘rinib turadi va ta’lim samaradorligi kafolatlangan.",
        p1t: "Kichik guruhlar",
        p1d: "Bizning guruhlar kichik va har bir o‘quvchi bilan alohida ishlash uchun yetarli vaqt ajratiladi.",
        p2t: "Onlayn Ta’lim Platformasi",
        p2d: "Darslar markazimiz tomonidan rejalashtiriladi va ota-onalar bolalarining rivojini osongina kuzatishi mumkin.",
        p3t: "Professional o‘qituvchilar",
        p3d: "O‘qituvchilarimiz o‘z sohasida oliy ma’lumotga ega va boy tajribaga ega mutaxassislardir.",
        p4t: "Ko‘rinadigan natijalar",
        p4d: "Har bir o‘quvchining rivoji doimiy ravishda kuzatiladi, natijalar aniq ko‘rinadi va samaradorlik kafolatlanadi.",
        quote: "Ta’lim — bu kelajakni o‘zgartirish uchun eng kuchli quroldir.",
        quoteAuthor: "— Nelson Mandela",
        storyTitle: "Talabaning yo‘li qanday boshlanadi",
        story1tag: "Boshlanish",
        story1t: "Ishonchsizlik",
        story1d: "Ko‘pchilik talaba grammatikani biladi, ammo gapirishda ikkilanadi va xatolardan qo‘rqadi.",

        story2tag: "Jarayon",
        story2t: "Amaliyot va qo‘llab-quvvatlash",
        story2d: "Kichik guruhlar va suhbatga yo‘naltirilgan darslar orqali o‘quvchilar bosimlarsiz mashq qilishadi.",

        story3tag: "Natija",
        story3t: "Ishonch va erkinlik",
        story3d: "Vaqt o‘tishi bilan talaba fikrini erkin bildiradi va ingliz tilini kundalik hayotda ishlata boshlaydi."


      },
      ru: {
        login: "Вход", about: "О нас", test: "Бесплатный тест",
        title: "Изучайте английский уверенно",
        desc: "Пройдите тест и узнайте свой реальный уровень.",
        btn: "Начать тест", why: "Почему AngloRoom?",
        c1t: "Опытные преподаватели", c1d: "Высококвалифицированные специалисты с богатым опытом и умением эффективно обучать.",
        c2t: "Современный подход", c2d: "Занятия ориентированы на разговорную практику, чтобы ученики сразу применяли знания на практике.",
        c3t: "Реальный результат", c3d: "Прогресс каждого ученика регулярно отслеживается, результаты наглядны, а эффективность обучения гарантирована.",
        p1t: "Небольшие группы",
        p1d: "Наши группы небольшие, что позволяет уделять каждому ученику достаточно внимания.",
        p2t: "Онлайн-платформа обучения",
        p2d: "Уроки планируются нашим центром, а родители могут легко отслеживать прогресс своих детей.",
        p3t: "Профессиональные преподаватели",
        p3d: "Наши преподаватели имеют высшее образование и богатый опыт работы в своей области.",
        p4t: "Измеримые результаты",
        p4d: "Прогресс каждого ученика отслеживается постоянно, результаты видны и эффективность гарантирована.",
        quote: "Образование — самое мощное оружие, которое можно использовать, чтобы изменить мир.",
        quoteAuthor: "— Нельсон Мандела",
        storyTitle: "Путь каждого студента",
        story1tag: "Начало",
        story1t: "Неуверенность",
        story1d: "Многие знают правила, но боятся говорить и сомневаются в реальном общении.",

        story2tag: "Процесс",
        story2t: "Практика и поддержка",
        story2d: "Занятия в небольших группах создают спокойную среду для регулярной разговорной практики.",

        story3tag: "Результат",
        story3t: "Уверенность и свобода",
        story3d: "Со временем студенты начинают говорить свободнее и использовать английский в жизни."


      }
    };
    function setLang(l) {
      localStorage.setItem("lang", l);
      document.querySelectorAll("[data-i18n]").forEach(e => e.textContent = texts[l][e.dataset.i18n]);
    }
    function toggleMenu() { document.getElementById("nav").classList.toggle("active"); }
    setLang(localStorage.getItem("lang") || "uz");
