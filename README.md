# 🏋️ Underground Fitness — Отработка возражений

Справочник менеджера по продажам. React + Next.js + Gemini AI.

## Стек
- **Next.js 14** — фреймворк
- **Gemini 2.0 Flash** — AI-оценка в тренажёре + генерация скриптов
- **Vercel KV** — хранилище скриптов сообщества

## Функции
- 📚 15+ скриптов отработки возражений по методу «Правило трёх Н»
- 🎯 Тренажёр с оценкой ответов от Gemini (оценка 1-10, советы)
- 🤖 Gemini-ассистент — чат по любой ситуации с клиентом
- 🌐 Сообщество — предлагай возражение, Gemini генерирует скрипт, виден всем
- ⭐ Избранное, заметки, прогресс, таймер

## Запуск локально

```bash
npm install

# Создай .env.local:
echo "GEMINI_API_KEY=твой_ключ" > .env.local

npm run dev
```

## Деплой на Vercel

1. Push на GitHub
2. Импортируй репозиторий в [vercel.com](https://vercel.com)
3. Добавь переменную: `GEMINI_API_KEY`
4. Для сообщества: `Storage → Create KV Store → Link to project`

## Получить Gemini API ключ

[aistudio.google.com](https://aistudio.google.com) → Get API key (бесплатно)
"# undergym" 
