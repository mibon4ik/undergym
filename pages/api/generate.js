import { GoogleGenAI } from '@google/genai';

const MODEL = 'gemini-3.1-pro-preview';

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
    const ai = new GoogleGenAI({ apiKey: key });

    const config = {
      thinkingConfig: {
        thinkingBudget: 8000,
      },
      maxOutputTokens: 1500,
      temperature: 0.8,
    };

    const contents = [
      { role: 'user', parts: [{ text: prompt }] },
    ];

    const response = await ai.models.generateContentStream({
      model: MODEL,
      config,
      contents,
    });

    let text = '';
    for await (const chunk of response) {
      if (chunk.text) text += chunk.text;
    }

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
    console.error('Gemini generate error:', e);
    res.status(500).json({ error: e.message });
  }
}
