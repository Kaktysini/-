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
const PROMOTION_WEBHOOK_URL = 'ССЫЛКА_НА_ВАШ_НОВЫЙ_ВЕБХУК'; // Не забудьте вставить сюда ваш 2-й вебхук!

const rankChangeList = document.getElementById('rankChangeList');
const promotionList = document.getElementById('promotionList');

auth.onAuthStateChanged((user) => {
    if (user) {
        loadReports(user);
    } else {
        setTimeout(() => {
            if (!auth.currentUser) window.location.href = '../login/login.html';
        }, 1000);
    }
});

async function loadReports(user) {
    rankChangeList.innerHTML = 'Поиск...';
    promotionList.innerHTML = 'Поиск...';

    try {
        const snapshot = await db.collection('reports').where('userId', '==', user.uid).get();
        
        rankChangeList.innerHTML = '';
        promotionList.innerHTML = '';
        
        const now = new Date();
        let hasRank = false;
        let hasPromo = false;

        snapshot.forEach(doc => {
            const data = doc.data();
            
            // Проверяем срок
            if (data.expires_at && data.expires_at.toDate() > now) {
                // Создаем карточку
                const card = document.createElement('div');
                card.style.cssText = 'border: 1px solid #374151; padding: 15px; margin-bottom: 15px; background-color: #1a1e1b; border-radius: 4px;';
                
                const safeData = JSON.stringify(data).replace(/'/g, "&#39;");
                const btnHTML = `<button class="btn-submit" style="margin-top: 10px; padding: 8px 15px; font-size: 14px;" onclick='openModal("${doc.id}", ${safeData})'>Редактировать</button>`;

                // Сортируем по спискам
                if (data.formType === "Запрос на повышение") {
                    hasPromo = true;
                    card.innerHTML = `
                        <p><strong>Докладывает:</strong> ${data.reporting}</p>
                        <p><strong>Запрос:</strong> ${data.requestedRank}</p>
                        ${btnHTML}
                    `;
                    promotionList.appendChild(card);
                } else {
                    hasRank = true;
                    card.innerHTML = `
                        <p><strong>Боец:</strong> ${data.soldierInfo}</p>
                        <p><strong>Звание:</strong> ${data.oldRank} ➔ ${data.newRank}</p>
                        <p><strong>Дата:</strong> ${data.reportDate}</p>
                        ${btnHTML}
                    `;
                    rankChangeList.appendChild(card);
                }
            } else {
                // Удаляем просроченные
                doc.ref.delete().catch(err => console.error("Ошибка удаления:", err));
            }
        });

        if (!hasRank) rankChangeList.innerHTML = '<p>У вас нет активных рапортов этого типа.</p>';
        if (!hasPromo) promotionList.innerHTML = '<p>У вас нет активных рапортов этого типа.</p>';

    } catch (error) {
        rankChangeList.innerHTML = `<p style="color: red;">Ошибка: ${error.message}</p>`;
        promotionList.innerHTML = '';
    }
}

// Открытие модального окна с адаптацией под форму
window.openModal = function(docId, data) {
    document.getElementById('editDocId').value = docId;
    document.getElementById('editFormType').value = data.formType || "Новый рапорт";
    
    // Заполняем общие поля
    document.getElementById('editReporting').value = data.reporting || '';

    const groupRank = document.getElementById('group-rank');
    const groupPromo = document.getElementById('group-promotion');
    const modalTitle = document.getElementById('modalTitle');

    if (data.formType === "Запрос на повышение") {
        // Настраиваем окно под запрос на повышение
        modalTitle.textContent = "Редактирование запроса на повышение";
        groupRank.style.display = 'none'; // Скрываем лишние поля
        groupPromo.style.display = 'block'; // Показываем нужное
        
        document.getElementById('editRequestedRank').value = data.requestedRank || '';
    } else {
        // Настраиваем окно под обычный рапорт
        modalTitle.textContent = "Редактирование рапорта";
        groupRank.style.display = 'block';
        groupPromo.style.display = 'none';
        
        document.getElementById('editIssuedBy').value = data.issuedBy || '';
        document.getElementById('editSoldierInfo').value = data.soldierInfo || '';
        document.getElementById('editSteamId').value = data.steamId || '';
        document.getElementById('editOldRank').value = data.oldRank || '';
        document.getElementById('editNewRank').value = data.newRank || '';
    }
    
    document.getElementById('editModal').style.display = 'flex';
}

window.closeModal = function() {
    document.getElementById('editModal').style.display = 'none';
}

// Сохранение изменений
document.getElementById('editForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const docId = document.getElementById('editDocId').value;
    const formType = document.getElementById('editFormType').value;
    
    let updatedData = { reporting: document.getElementById('editReporting').value };
    let payload = {};

    if (formType === "Запрос на повышение") {
        updatedData.requestedRank = document.getElementById('editRequestedRank').value;
        
        // Шаблон для Discord (Запрос)
        payload = {
            embeds: [{
                title: "Форма рапорта запроса на проверку готовности к повышению (ИЗМЕНЕНО)",
                color: 9109504,
                fields: [
                    { name: "Докладывает:", value: `\`${updatedData.reporting}\``, inline: false },
                    { name: "Запрашиваю проверку на повышение в звании", value: `**${updatedData.requestedRank}**`, inline: false }
                ],
                timestamp: new Date().toISOString()
            }]
        };
    } else {
        updatedData.issuedBy = document.getElementById('editIssuedBy').value;
        updatedData.soldierInfo = document.getElementById('editSoldierInfo').value;
        updatedData.steamId = document.getElementById('editSteamId').value;
        updatedData.oldRank = document.getElementById('editOldRank').value;
        updatedData.newRank = document.getElementById('editNewRank').value;
        
        // Шаблон для Discord (Изменение звания)
        payload = {
            embeds: [{
                title: "📝 РАПОРТ (Отредактировано бойцом)",
                color: 9109504,
                fields: [
                    { name: "Докладывает:", value: `\`${updatedData.reporting}\``, inline: false },
                    { name: "Кто выдал форму:", value: `\`${updatedData.issuedBy}\``, inline: false },
                    { name: "Н | П бойца:", value: `${updatedData.soldierInfo}`, inline: false },
                    { name: "Изменение звания:", value: `~~${updatedData.oldRank}~~ ➔ **${updatedData.newRank}**`, inline: false },
                    { name: "SteamID:", value: `\`${updatedData.steamId}\``, inline: false }
                ],
                timestamp: new Date().toISOString()
            }]
        };
    }

    try {
        const docRef = db.collection('reports').doc(docId);
        await docRef.update(updatedData);
        
        const docSnap = await docRef.get();
        const messageId = docSnap.data().discordMessageId;
        
        if (messageId) {
            // Выбираем правильный вебхук в зависимости от типа
            const webhookUrl = (formType === "Запрос на повышение") ? PROMOTION_WEBHOOK_URL : DISCORD_WEBHOOK_URL;

            await fetch(`${webhookUrl}/messages/${messageId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }
        
        alert('Запись успешно обновлена!');
        closeModal();
        window.location.reload();
    } catch (error) {
        alert('Ошибка при обновлении: ' + error.message);
    }
});

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => window.location.href = '../login/login.html');
    });
}
