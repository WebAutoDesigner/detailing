const escape = s => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { BOT_TOKEN, CHAT_ID } = process.env;
  if (!BOT_TOKEN || !CHAT_ID) {
    return { statusCode: 500, body: 'Server configuration error' };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { name = '-', phone = '-', service = '', message = '' } = data;

  // Sanitize all user input to prevent HTML injection in Telegram messages
  const safeName    = escape(name).slice(0, 200);
  const safePhone   = escape(phone).slice(0, 50);
  const safeService = escape(service).slice(0, 200);
  const safeMessage = escape(message).slice(0, 1000);

  const text = [
    '📩 <b>Новая заявка с сайта Brooklands</b>',
    '',
    `👤 Имя: ${safeName}`,
    `📞 Телефон: ${safePhone}`,
    safeService ? `🔧 Услуга: ${safeService}` : '',
    safeMessage ? `💬 Комментарий: ${safeMessage}` : '',
  ].filter(Boolean).join('\n');

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Telegram error:', err);
      return { statusCode: 502, body: 'Telegram API error' };
    }

    return { statusCode: 200, body: 'OK' };
  } catch (err) {
    console.error('Fetch error:', err);
    return { statusCode: 500, body: 'Internal error' };
  }
};
