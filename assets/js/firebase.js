// assets/js/firebase.js

const firebaseConfig = {
    apiKey: "AIzaSyDcrscDuMq8nEXCgvP-K-0fwevIEMyKkfM",
    authDomain: "angloroom.firebaseapp.com",
    projectId: "angloroom",
    storageBucket: "angloroom.firebasestorage.app",
    messagingSenderId: "378782387414",
    appId: "1:378782387414:web:42facc82e7b0c76989cd77",
    measurementId: "G-Y2PBYHPXLL",
    


  };
  
  firebase.initializeApp(firebaseConfig);
  
  const auth = firebase.auth();
  const db = firebase.firestore();
  const storage = firebase.storage();
  