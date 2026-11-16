// Вставлен ваш тестовый вебхук
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

    // --- ШАГ 1: УДАЛЕНИЕ СТАРОГО РАПОРТА (ТОЛЬКО ЕСЛИ ВЫБРАНО "ИСПРАВЛЕНИЕ") ---
    if (formData.reportType === 'ИСПРАВЛЕНИЕ') {
        const lastMessageId = localStorage.getItem(STORAGE_KEY);
        if (lastMessageId) {
            statusDiv.textContent = 'Удаление предыдущего рапорта...';
            try {
                const deleteUrl = `${DISCORD_WEBHOOK_URL}/messages/${lastMessageId}`;
                const deleteResponse = await fetch(deleteUrl, { method: 'DELETE' });

                if (!deleteResponse.ok && deleteResponse.status !== 404) {
                    console.warn('Не удалось удалить старое сообщение.');
                }
                // Очищаем память от старого ID
                localStorage.removeItem(STORAGE_KEY);
            } catch (error) {
                console.error('Ошибка при удалении:', error);
            }
        }
    }

    // --- ШАГ 2: ОТПРАВЛЯЕМ НОВЫЙ РАПОРТ ---
    const isCorrection = formData.reportType === 'ИСПРАВЛЕНИЕ';

    const payload = {
        username: "Канцелярия 41-го ЭРК",
        embeds: [{
            title: isCorrection ? "🚨 ИСПРАВЛЕННЫЙ РАПОРТ" : "Рапорт о изменении звания",
            color: isCorrection ? 16711680 : 16711935, // Красный для исправления, розовый для нового
            description: `**Докладывает:**\n${formData.reporting}\n\n**Кто выдал форму:**\n${formData.issuedBy}`,
            fields: [
                { name: "Тип рапорта", value: formData.reportType, inline: true },
                { name: "Н | П бойца", value: formData.soldierInfo, inline: true },
                { name: "Старое звание → Новое звание", value: `[${formData.oldRank}] → [${formData.newRank}]`, inline: false },
                { name: "SteamID", value: formData.steamId, inline: false },
                { name: "Дата рапорта", value: formData.reportDate, inline: true }
            ],
            timestamp: new Date().toISOString()
        }]
    };

    try {
        statusDiv.textContent = 'Отправка нового рапорта...';

        // ?wait=true нужен, чтобы Discord вернул ID нового сообщения
        const postUrl = `${DISCORD_WEBHOOK_URL}?wait=true`;
        
        const response = await fetch(postUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const createdMessage = await response.json();
            
            // Всегда сохраняем ID последнего отправленного сообщения
            if (createdMessage.id) {
                localStorage.setItem(STORAGE_KEY, createdMessage.id);
            }

            // Меняем текст успеха в зависимости от того, было ли это исправление
            if (isCorrection) {
                statusDiv.textContent = 'Рапорт успешно исправлен (старый удален)!';
            } else {
                statusDiv.textContent = 'Новый рапорт успешно отправлен!';
            }
            
            statusDiv.classList.add('success');
            form.reset();
        } else {
            const errorData = await response.json();
            throw new Error(`Ошибка Discord: ${errorData.message || response.statusText}`);
        }
    } catch (error) {
        statusDiv.textContent = `Не удалось отправить рапорт: ${error.message}`;
        statusDiv.classList.add('error');
        console.error('Ошибка отправки:', error);
    }
});
