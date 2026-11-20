const firebaseConfig = {
    apiKey: "AIzaSyAOOP79OWQn_RjiI5bFk28a_At6jJ9o6qU",
    authDomain: "raportovanie-41.firebaseapp.com",
    projectId: "raportovanie-41",
    storageBucket: "raportovanie-41.appspot.com",
    messagingSenderId: "1097924602121",
    appId: "1:1097924602121:web:90662309434c46ced9cbd8"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Слушаем состояние авторизации
auth.onAuthStateChanged((user) => {
    if (user) {
        // Если пользователь вошел, достаем его номер из "почты" (до символа @)
        const soldierNumber = user.email.split('@')[0];
        document.getElementById('profileNumber').textContent = `Боец № ${soldierNumber}`;
    } else {
        // Если не вошел - на страницу логина
        window.location.href = '../login/login.html';
    }
});

// Кнопка выхода
document.getElementById('logoutBtn').addEventListener('click', () => {
    auth.signOut().then(() => {
        window.location.href = '../login/login.html';
    });
});
