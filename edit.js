const firebaseConfig = {
    apiKey: "AIzaSyAOpQ79QMQRjIi5bFk28a_At6j9o6qU",
    authDomain: "raportovanie-41.firebaseapp.com",
    projectId: "raportovanie-41",
    storageBucket: "raportovanie-41.appspot.com",
    messagingSenderId: "1097924602121",
    appId: "1:1097924602121:web:9066230943a4c6c9dcb8"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1571627519638114334/Lg_zk96gkUTrxQBCAm7giIxoIqIySg8GpTGZtdgTuOSJsp1K1G5Crd_prZ4U_xgy91_G';

const listDiv = document.getElementById('reportsList');
listDiv.innerHTML = '<p>Проверка сессии...</p>';

// Обертка для ожидания начального состояния аутентификации в compat-версии
function waitForAuth() {
    return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            unsubscribe(); // Отписываемся после первого срабатывания
            resolve(user);
        });
    });
}

// Запускаем проверку
waitForAuth().then((user) => {
    if (user) {
        console.log("Сессия подтверждена. UID:", user.uid);
        loadReports(user);
    } else {
        console.log("Сессия не найдена. Перенаправление на вход.");
        window.location.href = 'login.html';
    }
}).catch((error) => {
    console.error("Ошибка проверки сессии:", error);
    listDiv.innerHTML = `<p style="color: red;">Ошибка: ${error.message}</p>`;
});

// Функция загрузки рапортов
async function loadReports(user) {
    listDiv.innerHTML = 'Поиск...';
    try {
        const snapshot = await db.collection('reports').where('userId', '==', user.uid).get();
        listDiv.innerHTML = '';
        const now = new Date();
        let hasActiveReports = false;

        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.expires_at && data.expires_at.toDate() > now) {
                hasActiveReports = true;
                const card = document.createElement('div');
                card.style.cssText = 'border: 1px solid #374151; padding: 15px; margin-bottom: 15px; background-color: #1a1e1b; border-radius: 4px;';
                card.innerHTML = `
                    <p><strong>Боец:</strong> ${data.soldierInfo}</p>
                    <p><strong>Звание:</strong> ${data.oldRank} ➔ ${data.newRank}</p>
                    <p><strong>Дата:</strong> ${data.reportDate}</p>
                    <button class="btn-submit" style="margin-top: 10px; padding: 8px 15px; font-size: 14px;" onclick="editReport('${doc.id}')">Изменить звание</button>
                `;
                listDiv.appendChild(card);
            }
        });

        if (!hasActiveReports) listDiv.innerHTML = '<p>У вас нет активных рапортов.</p>';
    } catch (error) {
        listDiv.innerHTML = `<p style="color: red;">Ошибка: ${error.message}</p>`;
    }
}

// Функция редактирования (без изменений)
window.editReport = async function(reportId) {
    const newRank = prompt("Введите новое звание (например: Рядовой):");
    if (!newRank) return;
    try {
        const docRef = db.collection('reports').doc(reportId);
        await docRef.update({ newRank: newRank });
        const docSnap = await docRef.get();
        const data = docSnap.data();
        if (data.discordMessageId) {
            await fetch(`${DISCORD_WEBHOOK_URL}/messages/${data.discordMessageId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    embeds: [{
                        title: "📝 ИСПРАВЛЕНИЕ РАПОРТА (Отредактировано)",
                        color: 9109504,
                        fields: [
                            { name: "Докладывает:", value: `\`${data.reporting}\``, inline: false },
                            { name: "Н | П бойца:", value: `${data.soldierInfo}`, inline: false },
                            { name: "Изменение звания:", value: `~~${data.oldRank}~~ ➔ **${newRank}**`, inline: false }
                        ]
                    }]
                })
            });
        }
        alert('Рапорт успешно обновлен!');
        window.location.reload();
    } catch (error) { alert('Ошибка: ' + error.message); }
};

// Кнопка выхода
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => window.location.href = 'login.html');
    });
}
