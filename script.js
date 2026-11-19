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

auth.onAuthStateChanged((user) => {
    if (!user) window.location.href = 'login.html';
});

document.getElementById('reportForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const form = event.target;
    const statusDiv = document.getElementById('formStatus');
    statusDiv.textContent = 'Создание рапорта...';
    statusDiv.className = 'form-status';

    const formData = {
        reporting: form.reporting.value,
        issuedBy: form.issuedBy.value,
        soldierInfo: form.soldierInfo.value,
        oldRank: form.oldRank.value,
        newRank: form.newRank.value,
        steamId: form.steamId.value,
        reportDate: form.reportDate.value,
        reportType: "Новый рапорт"
    };

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    try {
        // 1. Создаем в Firestore
        const docRef = await db.collection('reports').add({
            ...formData,
            userId: user.uid, 
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            expires_at: firebase.firestore.Timestamp.fromDate(expiresAt)
        });

        statusDiv.textContent = 'Отправка в Discord...';

        // 2. Отправляем новое сообщение в Discord
        const payload = {
            username: "Канцелярия 41-го ЭРК",
            embeds: [{
                title: "📝 Новый рапорт о изменении звания.",
                color: 3096367, // Зеленый
                description: "📌 **Основные данные**",
                fields: [
                    { name: "Докладывает:", value: `\`${formData.reporting}\``, inline: false },
                    { name: "Кто выдал форму:", value: `\`${formData.issuedBy}\``, inline: false },
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
            // Сохраняем ID сообщения для будущего редактирования
            await docRef.update({ discordMessageId: createdMessage.id });
            statusDiv.textContent = 'Рапорт успешно отправлен!';
            statusDiv.classList.add('success');
            form.reset();
        }
    } catch (error) {
        statusDiv.textContent = 'Ошибка: ' + error.message;
        statusDiv.classList.add('error');
    }
});

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => window.location.href = 'login.html');
    });
}
