// Ваш тестовый вебхук
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1571627519638114334/Lg_zk96gkUTrxQBCAm7giIxoIqIySg8GpTGZtdgTuOSJsp1K1G5Crd_prZ4U_xgy91_G';
const STORAGE_KEY = 'last_report_message_id';

document.getElementById('reportForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const form = event.target;
    const statusDiv = document.getElementById('formStatus');
    statusDiv.textContent = 'Отправка...';
    statusDiv.className = 'form-status';

    // Собираем данные
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

    // --- ШАГ 1: УДАЛЕНИЕ СТАРОГО РАПОРТА (ТОЛЬКО ПРИ ИСПРАВЛЕНИИ) ---
    if (formData.reportType === 'ИСПРАВЛЕНИЕ') {
        const lastMessageId = localStorage.getItem(STORAGE_KEY);
        if (lastMessageId) {
            statusDiv.textContent = 'Удаление предыдущего рапорта...';
            try {
                const deleteUrl = `${DISCORD_WEBHOOK_URL}/messages/${lastMessageId}`;
                await fetch(deleteUrl, { method: 'DELETE' });
                localStorage.removeItem(STORAGE_KEY);
            } catch (error) {
                console.error('Ошибка при удалении:', error);
            }
        }
    }

    // --- ШАГ 2: ФОРМИРОВАНИЕ НОВОГО РАПОРТА ---
    const isCorrection = formData.reportType === 'ИСПРАВЛЕНИЕ';

    const payload = {
        username: "Канцелярия 41-го ЭРК",
        avatar_url: "https://i.imgur.com/your-logo.png", // Логотип бота
        embeds: [{
            title: isCorrection ? "📝 ИСПРАВЛЕНИЕ РАПОРТА." : "📝 Рапорт о изменении звания.",
            color: 9109504, // Темно-красный цвет
            description: "📌 **Основные данные**",
            
            // ИЗМЕНЕНИЕ ЗДЕСЬ: Вместо image используем thumbnail для картинки справа
            thumbnail: {
                url: "https://i.imgur.com/8Y6jX5b.jpeg" // Ссылка на вашу картинку
            },
            
            fields: [
                { name: "Докладывает:", value: `\`${formData.reporting}\``, inline: false },
                { name: "Кто выдал форму:", value: `\`${formData.issuedBy}\``, inline: false },
                { name: "Тип рапорта:", value: `**${formData.reportType}**`, inline: false },
                { name: "Н | П бойца:", value: `${formData.soldierInfo}`, inline: false },
                { name: "Изменение звания:", value: `~~${formData.oldRank}~~ ➔ **${formData.newRank}**`, inline: false },
                { name: "SteamID:", value: `\`${formData.steamId}\``, inline: false },
                { name: "Дата рапорта:", value: `${formData.reportDate}`, inline: false }
            ],
            footer: {
                text: "Портал служебных рапортов 41-го ЭРК"
            },
            timestamp: new Date().toISOString()
        }]
    };

    try {
        statusDiv.textContent = 'Отправка нового рапорта...';

        const postUrl = `${DISCORD_WEBHOOK_URL}?wait=true`;
        const response = await fetch(postUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const createdMessage = await response.json();
            if (createdMessage.id) {
                localStorage.setItem(STORAGE_KEY, createdMessage.id);
            }
            statusDiv.textContent = 'Рапорт успешно отправлен!';
            statusDiv.classList.add('success');
            form.reset();
        } else {
            throw new Error('Ошибка при отправке в Discord');
        }
    } catch (error) {
        statusDiv.textContent = `Не удалось отправить рапорт: ${error.message}`;
        statusDiv.classList.add('error');
    }
});
