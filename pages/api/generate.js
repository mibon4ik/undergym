export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { phrase } = req.body;
  if (!phrase?.trim()) return res.status(400).json({ error: 'phrase required' });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: 'GEMINI_API_KEY не задан' });

  const prompt = `Ты тренер по продажам в фитнес-клубе Underground Fitness.
Создай полный скрипт отработки возражения клиента по методу "Правило трёх Н".

Возражение от пользователя: "${phrase}"

Верни ТОЛЬКО валидный JSON (без markdown, без \`\`\`json, без пояснений):
{
  "title": "Название возражения (3-5 слов, кратко)",
  "icon": "одно подходящее emoji",
  "phrase": "точная фраза клиента (1-2 предложения, естественно)",
  "principle": "Принцип работы с этим возражением — психология клиента и что важно делать (2-3 предложения)",
  "dialogue": [
    {"step": 1, "role": "client", "text": "фраза клиента"},
    {"step": 1, "role": "manager", "text": "ответ менеджера — шаг Н1 присоединение"},
    {"step": 1, "role": "client", "text": "реакция клиента"},
    {"step": 2, "role": "manager", "text": "аргумент — шаг Н2 вопрос или аргумент"},
    {"step": 2, "role": "client", "text": "реакция клиента"},
    {"step": 3, "role": "manager", "text": "последний козырь — шаг Н3 конкретное предложение"}
  ],
  "tip": "Практический совет для менеджера (1-2 предложения)",
  "keyPhrase": "Ключевая фраза которую стоит запомнить и скопировать"
}`;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 1500, temperature: 0.8 },
        }),
      }
    );
    const data = await r.json();
    if (data.error) return res.status(500).json({ error: data.error.message });

    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    // Strip any markdown fences just in case
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let objection;
    try {
      objection = JSON.parse(text);
    } catch {
      return res.status(500).json({ error: 'Gemini вернул не валидный JSON. Попробуй ещё раз.' });
    }

    res.json({ objection });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
