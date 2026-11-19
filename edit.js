// 🔴 ВАШИ КЛЮЧИ
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

// Ждем, пока Firebase проверит сессию
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        console.log("Пользователь не найден сразу. Ждем 2 секунды...");
        // Даем Firebase 2 секунды, чтобы "проснуться"
        setTimeout(async () => {
            if (auth.currentUser) {
                // Если за это время пользователь появился — грузим рапорты
                loadReports(auth.currentUser);
            } else {
                // Если так и не появился — на страницу входа
                console.log("Сессия не найдена, выходим.");
                window.location.href = 'login.html';
            }
        }, 2000);
        return;
    }
    
    // Если пользователь найден сразу
    loadReports(user);
});

// Отдельная функция для загрузки рапортов
async function loadReports(user) {
    console.log("Загрузка рапортов для UID:", user.uid);
    const listDiv = document.getElementById('reportsList');
    listDiv.innerHTML = 'Поиск...';

    try {
        // Ищем рапорты только этого бойца
        const snapshot = await db.collection('reports')
            .where('userId', '==', user.uid)
            .get();

        listDiv.innerHTML = '';
        const now = new Date();
        let hasActiveReports = false;

        snapshot.forEach(doc => {
            const data = doc.data();
            
            // Проверяем дату удаления здесь (если она есть)
            if (data.expires_at && data.expires_at.toDate() > now) {
                hasActiveReports = true;
                
                const card = document.createElement('div');
                card.style.border = '1px solid #374151';
                card.style.padding = '15px';
                card.style.marginBottom = '15px';
                card.style.backgroundColor = '#1a1e1b';
                card.style.borderRadius = '4px';
                
                card.innerHTML = `
                    <p><strong>Боец:</strong> ${data.soldierInfo}</p>
                    <p><strong>Звание:</strong> ${data.oldRank} ➔ ${data.newRank}</p>
                    <p><strong>Дата:</strong> ${data.reportDate}</p>
                    <button class="btn-submit" style="margin-top: 10px; padding: 8px 15px; font-size: 14px;" onclick="editReport('${doc.id}')">Изменить звание</button>
                `;
                listDiv.appendChild(card);
            }
        });

        if (!hasActiveReports) {
            listDiv.innerHTML = '<p>У вас нет активных рапортов (или срок их действия истек).</p>';
        }
        
    } catch (error) {
        listDiv.innerHTML = `<p style="color: red;">Ошибка: ${error.message}</p>`;
    }
}

// Функция изменения звания
window.editReport = async function(reportId) {
    const newRank = prompt("Введите новое звание (например: Рядовой):");
    if (!newRank) return;

    try {
        const docRef = db.collection('reports').doc(reportId);
        await docRef.update({ newRank: newRank });
        
        const docSnap = await docRef.get();
        const data = docSnap.data();
        const messageId = data.discordMessageId;
        
        if (messageId) {
            const payload = {
                embeds: [{
                    title: "📝 ИСПРАВЛЕНИЕ РАПОРТА (Отредактировано)",
                    color: 9109504,
                    fields: [
                        { name: "Докладывает:", value: `\`${data.reporting}\``, inline: false },
                        { name: "Н | П бойца:", value: `${data.soldierInfo}`, inline: false },
                        { name: "Изменение звания:", value: `~~${data.oldRank}~~ ➔ **${newRank}**`, inline: false }
                    ]
                }]
            };

            await fetch(`${DISCORD_WEBHOOK_URL}/messages/${messageId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }
        
        alert('Рапорт успешно обновлен!');
        window.location.reload();
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
};

// Кнопка выхода
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => {
            window.location.href = 'login.html';
        });
    });
}
