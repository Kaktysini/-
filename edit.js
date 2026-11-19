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
const db = firebase.firestore();
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1571627519638114334/Lg_zk96gkUTrxQBCAm7giIxoIqIySg8GpTGZtdgTuOSJsp1K1G5Crd_prZ4U_xgy91_G';

const listDiv = document.getElementById('reportsList');

auth.onAuthStateChanged((user) => {
    if (user) {
        loadReports(user);
    } else {
        setTimeout(() => {
            if (!auth.currentUser) window.location.href = 'login.html';
        }, 1000);
    }
});

async function loadReports(user) {
    listDiv.innerHTML = 'Поиск...';
    try {
        const snapshot = await db.collection('reports').where('userId', '==', user.uid).get();
        listDiv.innerHTML = '';
        const now = new Date();
        let count = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.expires_at && data.expires_at.toDate() > now) {
                count++;
                const card = document.createElement('div');
                card.style.cssText = 'border: 1px solid #374151; padding: 15px; margin-bottom: 15px; background-color: #1a1e1b; border-radius: 4px;';
                card.innerHTML = `
                    <p><strong>Боец:</strong> ${data.soldierInfo}</p>
                    <p><strong>Звание:</strong> ${data.oldRank} ➔ ${data.newRank}</p>
                    <p><strong>Дата:</strong> ${data.reportDate}</p>
                    <button class="btn-submit" style="margin-top: 10px; padding: 8px 15px; font-size: 14px;" 
                        onclick='openModal("${doc.id}", ${JSON.stringify(data).replace(/'/g, "&#39;")})'>
                        Редактировать
                    </button>
                `;
                listDiv.appendChild(card);
            }
        });

        if (count === 0) listDiv.innerHTML = '<p>У вас нет активных рапортов.</p>';
    } catch (error) {
        listDiv.innerHTML = `<p style="color: red;">Ошибка: ${error.message}</p>`;
    }
}

// Открытие модального окна и заполнение полей
window.openModal = function(docId, data) {
    document.getElementById('editDocId').value = docId;
    document.getElementById('editReporting').value = data.reporting || '';
    document.getElementById('editIssuedBy').value = data.issuedBy || '';
    document.getElementById('editSoldierInfo').value = data.soldierInfo || '';
    document.getElementById('editSteamId').value = data.steamId || '';
    document.getElementById('editOldRank').value = data.oldRank || '';
    document.getElementById('editNewRank').value = data.newRank || '';
    document.getElementById('editReportDate').value = data.reportDate || '';
    
    document.getElementById('editModal').style.display = 'flex';
}

window.closeModal = function() {
    document.getElementById('editModal').style.display = 'none';
}

// Сохранение изменений
document.getElementById('editForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const docId = document.getElementById('editDocId').value;
    
    const updatedData = {
        reporting: document.getElementById('editReporting').value,
        issuedBy: document.getElementById('editIssuedBy').value,
        soldierInfo: document.getElementById('editSoldierInfo').value,
        steamId: document.getElementById('editSteamId').value,
        oldRank: document.getElementById('editOldRank').value,
        newRank: document.getElementById('editNewRank').value,
        reportDate: document.getElementById('editReportDate').value
    };

    try {
        const docRef = db.collection('reports').doc(docId);
        
        // 1. Обновляем в базе данных
        await docRef.update(updatedData);
        
        // 2. Получаем ID сообщения Discord для редактирования
        const docSnap = await docRef.get();
        const messageId = docSnap.data().discordMessageId;
        
        // 3. Редактируем сообщение в Discord (PATCH)
        if (messageId) {
            const payload = {
                embeds: [{
                    title: "📝 РАПОРТ (Отредактировано бойцом)",
                    color: 9109504, // Красный оттенок для привлечения внимания
                    fields: [
                        { name: "Докладывает:", value: `\`${updatedData.reporting}\``, inline: false },
                        { name: "Кто выдал форму:", value: `\`${updatedData.issuedBy}\``, inline: false },
                        { name: "Н | П бойца:", value: `${updatedData.soldierInfo}`, inline: false },
                        { name: "Изменение звания:", value: `~~${updatedData.oldRank}~~ ➔ **${updatedData.newRank}**`, inline: false },
                        { name: "SteamID:", value: `\`${updatedData.steamId}\``, inline: false },
                        { name: "Дата рапорта:", value: `${updatedData.reportDate}`, inline: false }
                    ],
                    timestamp: new Date().toISOString()
                }]
            };

            await fetch(`${DISCORD_WEBHOOK_URL}/messages/${messageId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }
        
        alert('Рапорт успешно обновлен!');
        closeModal();
        window.location.reload();
    } catch (error) {
        alert('Ошибка при обновлении: ' + error.message);
    }
});

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => window.location.href = 'login.html');
    });
}
