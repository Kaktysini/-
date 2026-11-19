// 🔴 ВСТАВЬТЕ ВАШИ КЛЮЧИ ИЗ FIREBASE СЮДА 🔴
const firebaseConfig = {
  apiKey: "AIzaSyAOOP79OWQn_RjiI5bFk28a_At6jJ9o6qU",
  authDomain: "raportovanie-41.firebaseapp.com",
  projectId: "raportovanie-41",
  storageBucket: "raportovanie-41.appspot.com",
  messagingSenderId: "1097924602121",
  appId: "1:1097924602121:web:90662309434c46ced9cbd8"
};
};
// 🔴 КОНЕЦ ВСТАВКИ 🔴

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1571627519638114334/Lg_zk96gkUTrxQBCAm7giIxoIqIySg8GpTGZtdgTuOSJsp1K1G5Crd_prZ4U_xgy91_G';

auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    const listDiv = document.getElementById('reportsList');
    listDiv.innerHTML = 'Поиск...';

    try {
        const now = new Date();
        // Ищем рапорты только этого бойца, у которых срок не истек
        const snapshot = await db.collection('reports')
            .where('userId', '==', user.uid)
            .where('expires_at', '>', firebase.firestore.Timestamp.fromDate(now))
            .get();

        listDiv.innerHTML = '';
        if (snapshot.empty) {
            listDiv.innerHTML = '<p>У вас нет активных рапортов.</p>';
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            const card = document.createElement('div');
            // Применяем стили, чтобы карточки выглядели аккуратно
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
        });
    } catch (error) {
        listDiv.innerHTML = `<p style="color: red;">Ошибка: ${error.message}</p>`;
    }
});

// Функция изменения звания
window.editReport = async function(reportId) {
    const newRank = prompt("Введите новое звание (например: Рядовой):");
    if (!newRank) return;

    try {
        const docRef = db.collection('reports').doc(reportId);
        await docRef.update({ newRank: newRank }); // Обновляем в базе
        
        // Обновляем в Discord
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
