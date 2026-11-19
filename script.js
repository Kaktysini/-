// ВСТАВЬТЕ ВАШИ КЛЮЧИ ИЗ FIREBASE СЮДА (между кавычками)
const firebaseConfig = {
  apiKey: "AIzaSyAOOP79OWQn_RjiI5bFk28a_At6jJ9o6qU",
  authDomain: "raportovanie-41.firebaseapp.com",
  projectId: "raportovanie-41",
  storageBucket: "raportovanie-41.appspot.com",
  messagingSenderId: "1097924602121",
  appId: "1:1097924602121:web:90662309434c46ced9cbd8"
};

// Инициализация Firebase (НЕ ПЕРЕВОДИТЬ!)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Ваш вебхук
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1571627519638114334/Lg_zk96gkUTrxQBCAm7giIxoIqIySg8GpTGZtdgTuOSJsp1K1G5Crd_prZ4U_xgy91_G';

// Проверка: если не вошел — кидаем на страницу логина
auth.onAuthStateChanged((user) => {
    if (!user) {
        console.log("Пользователь не найден, перенаправление на вход...");
        window.location.href = 'login.html';
    } else {
        console.log("Успешный вход! UID:", user.uid);
    }
});
document.getElementById('reportForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const form = event.target;
    const statusDiv = document.getElementById('formStatus');
    statusDiv.textContent = 'Сохранение...';
    statusDiv.className = 'form-status';

    const formData = {
        reporting: form.reporting.value,
        issuedBy: form.issuedBy.value,
        reportType: form.reportType.value,
        soldierInfo: form.soldierInfo.value,
        oldRank: form.oldRank.value,
        newRank: form.newRank.value,
        steamId: form.steamId.value,
        reportDate: form.reportDate.value,
    };

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    try {
        // 1. Сохраняем в базу данных
        const docRef = await db.collection('reports').add({
            ...formData,
            userId: user.uid, 
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            expires_at: firebase.firestore.Timestamp.fromDate(expiresAt)
        });

        statusDiv.textContent = 'Отправка в Discord...';

        // 2. Отправляем в Discord
        const payload = {
            username: "Канцелярия 41-го ЭРК",
            embeds: [{
                title: "📝 Рапорт о изменении звания.",
                color: 9109504,
                description: "📌 **Основные данные**",
                fields: [
                    { name: "Докладывает:", value: `\`${formData.reporting}\``, inline: false },
                    { name: "Кто выдал форму:", value: `\`${formData.issuedBy}\``, inline: false },
                    { name: "Тип рапорта:", value: `**${formData.reportType}**`, inline: false },
                    { name: "Н | П бойца:", value: `${formData.soldierInfo}`, inline: false },
                    { name: "Изменение звания:", value: `~~${formData.oldRank}~~ ➔ **${formData.newRank}**`, inline: false },
                    { name: "SteamID:", value: `\`${formData.steamId}\``, inline: false },
                    { name: "Дата рапорта:", value: `${formData.reportDate}`, inline: false }
                ],
                timestamp: new Date().toISOString()
            }]
        };

        const response = await fetch(`${DISCORD_WEBHOOK_URL}?wait=true`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const createdMessage = await response.json();
            // 3. Запоминаем ID сообщения Discord в базе
            await docRef.update({ discordMessageId: createdMessage.id });

            statusDiv.textContent = 'Рапорт отправлен и сохранен!';
            statusDiv.classList.add('success');
            form.reset();
        }
    } catch (error) {
        statusDiv.textContent = 'Ошибка: ' + error.message;
        statusDiv.classList.add('error');
    }
});
// Логика кнопки "Выйти"
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => {
            // После выхода перенаправляем на страницу логина
            window.location.href = 'login.html';
        }).catch((error) => {
            console.error('Ошибка при выходе:', error);
        });
    });
}
