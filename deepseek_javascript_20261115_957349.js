// ВАЖНО: Замените 'ВАШ_WEBHOOK_URL' на URL, скопированный в Discord
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1571627519638114334/Lg_zk96gkUTrxQBCAm7giIxoIqIySg8GpTGZtdgTuOSJsp1K1G5Crd_prZ4U_xgy91_G';

document.getElementById('reportForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Предотвращаем стандартную отправку формы

    const form = event.target;
    const statusDiv = document.getElementById('formStatus');
    statusDiv.textContent = 'Отправка...';
    statusDiv.className = 'form-status';

    // Собираем данные из полей формы
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

    // Формируем JSON-объект для Discord Embed
    const payload = {
        username: "Канцелярия 41-го ЭРК", // Имя бота
        avatar_url: "https://i.imgur.com/your-logo.png", // Ссылка на аватар (опционально)
        embeds: [{
            title: "Рапорт о изменении звания",
            description: `**Докладывает:**\n${formData.reporting}\n\n**Кто выдал форму:**\n${formData.issuedBy}`,
            color: 16711935, // Цвет полоски (десятичный код). Например, 16711935 — это розовый.
            fields: [
                {
                    name: "Тип рапорта",
                    value: formData.reportType,
                    inline: true
                },
                {
                    name: "Н | П бойца",
                    value: formData.soldierInfo,
                    inline: true
                },
                {
                    name: "Старое звание → Новое звание",
                    value: `[${formData.oldRank}] → [${formData.newRank}]`,
                    inline: false
                },
                {
                    name: "SteamID",
                    value: formData.steamId,
                    inline: false
                },
                {
                    name: "Дата рапорта",
                    value: formData.reportDate,
                    inline: true
                }
            ],
            // Время отправки в формате ISO 8601
            timestamp: new Date().toISOString() 
        }]
    };

    try {
        // Отправляем данные на указанный URL (Webhook)
        const response = await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            statusDiv.textContent = 'Рапорт успешно отправлен в Discord!';
            statusDiv.classList.add('success');
            form.reset(); // Очищаем форму после успешной отправки
        } else {
            // Если Discord вернул ошибку, показываем её
            const errorData = await response.json();
            throw new Error(`Ошибка Discord: ${errorData.message || response.statusText}`);
        }
    } catch (error) {
        // Если произошла ошибка (например, сеть или неверный URL)
        statusDiv.textContent = `Не удалось отправить рапорт: ${error.message}`;
        statusDiv.classList.add('error');
        console.error('Ошибка отправки:', error);
    }
});
