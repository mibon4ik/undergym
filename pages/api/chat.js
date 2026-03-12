import { GoogleGenAI } from '@google/genai';

const SYSTEM = `Ты — опытный тренер по продажам фитнес-клуба Underground Fitness.
Помогаешь менеджерам отрабатывать возражения по методу «Правило трёх Н»:
1. Присоединение — не спорим, показываем что услышали
2. Вопрос или аргумент — копаем глубже, ищем настоящую причину
3. Последний козырь — конкретное предложение с ограничением

Давай конкретные, живые, короткие ответы. Предлагай готовые фразы для менеджера.
Никакой воды и корпоративщины. Отвечай только на русском.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { message, history = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: 'GEMINI_API_KEY не задан' });

  try {
    const ai = new GoogleGenAI({ apiKey: key });

    const contents = [
      ...history.slice(-8).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      { role: 'user', parts: [{ text: message }] },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17',
      config: {
        systemInstruction: SYSTEM,
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
      contents,
    });

    const reply = response.text;
    if (!reply) return res.status(500).json({ error: 'Пустой ответ от Gemini' });
    res.json({ reply });
  } catch (e) {
    console.error('Gemini chat error:', e);
    res.status(500).json({ error: e.message });
  }
}
