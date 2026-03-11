const SYSTEM = `Ты — опытный тренер по продажам фитнес-клуба Underground Fitness.
Помогаешь менеджерам отрабатывать возражения по методу «Правило трёх Н»:
1. Присоединение — не спорим, показываем что услышали
2. Вопрос или аргумент — копаем глубже, ищем настоящую причину
3. Последний козырь — конкретное предложение с ограничением

Давай конкретные, живые, короткие ответы. Предлагай готовые фразы для менеджера.
Никакой воды и корпоративщины. Отвечай только на русском.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { message, history = [], mode } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: 'GEMINI_API_KEY не задан' });

  const contents = [
    ...history.slice(-8).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: message }] },
  ];

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM }] },
          contents,
          generationConfig: { maxOutputTokens: 1000, temperature: 0.7 },
        }),
      }
    );
    const data = await r.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) return res.status(500).json({ error: 'Пустой ответ от Gemini' });
    res.json({ reply });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
