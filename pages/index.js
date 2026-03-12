import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import Head from 'next/head';
import { OBJECTIONS } from '../lib/objections';

/* ─── CONTEXT ─────────────────────────────────────── */
const Ctx = createContext(null);
const useApp = () => useContext(Ctx);

/* ─── UTILS ───────────────────────────────────────── */
function cls(...args) { return args.filter(Boolean).join(' '); }

/* ══════════════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════════════ */
function Toast() {
  const { toast } = useApp();
  return (
    <div className={cls('toast', toast?.type, toast && 'show')}>
      {toast?.msg}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   TIMER WIDGET
══════════════════════════════════════════════════════ */
function TimerWidget() {
  const { setTimerOpen } = useApp();
  const [secs, setSecs] = useState(0);
  const [running, setRunning] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (running) { ref.current = setInterval(() => setSecs(s => s + 1), 1000); }
    else clearInterval(ref.current);
    return () => clearInterval(ref.current);
  }, [running]);

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="timer-widget">
      <div className="timer-label">⏱ Таймер отработки</div>
      <div className="timer-display">{fmt(secs)}</div>
      <div className="timer-ctrls">
        <button className="timer-btn" onClick={() => setRunning(r => !r)}>{running ? '⏸' : '▶'}</button>
        <button className="timer-btn" onClick={() => { setRunning(false); setSecs(0); }}>↺</button>
        <button className="timer-btn" onClick={() => setTimerOpen(false)}>✕</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   HEADER
══════════════════════════════════════════════════════ */
function Header() {
  const { navigate, setSidebarOpen, setTimerOpen, showToast } = useApp();
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  const search = useCallback((val) => {
    setQ(val);
    if (!val.trim()) { setResults([]); setOpen(false); return; }
    const lv = val.toLowerCase();
    const r = OBJECTIONS.filter(o =>
      o.title.toLowerCase().includes(lv) ||
      o.phrase.toLowerCase().includes(lv) ||
      o.principle.toLowerCase().includes(lv)
    ).slice(0, 6);
    setResults(r); setOpen(true);
  }, []);

  const random = () => {
    const obj = OBJECTIONS[Math.floor(Math.random() * OBJECTIONS.length)];
    navigate('objection', obj.id);
    showToast(`🎲 ${obj.icon} ${obj.title}`, 'info');
  };

  return (
    <header className="header">
      <button className="hamburger" onClick={() => setSidebarOpen(o => !o)}>
        <span /><span /><span />
      </button>
      <div className="logo">UNDERGROUND <span>FITNESS</span></div>

      <div className="header-search">
        <span className="search-icon">🔍</span>
        <input
          ref={inputRef}
          className="search-input"
          placeholder="Поиск по возражениям..."
          value={q}
          onChange={e => search(e.target.value)}
          onFocus={() => q && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        {open && (
          <div className="search-dropdown">
            {results.length === 0
              ? <div className="search-empty">Ничего не найдено</div>
              : results.map(r => (
                <div key={r.id} className="search-item" onMouseDown={() => {
                  navigate('objection', r.id); setQ(''); setOpen(false);
                }}>
                  <div className="search-item-title">{r.icon} {r.title}</div>
                  <div className="search-item-snippet">{r.phrase.slice(0, 80)}...</div>
                </div>
              ))
            }
          </div>
        )}
      </div>

      <div className="header-actions">
        <button className="hbtn" onClick={random}>🎲 Случайное</button>
        <button className="hbtn" onClick={() => setTimerOpen(o => !o)}>⏱ Таймер</button>
      </div>
    </header>
  );
}

/* ══════════════════════════════════════════════════════
   SIDEBAR
══════════════════════════════════════════════════════ */
function Sidebar() {
  const { view, currentObjId, navigate, studied, favorites, sidebarOpen } = useApp();
  const done = studied.length;
  const pct = Math.round(done / OBJECTIONS.length * 100);

  const navBtn = (id, icon, label, isObj = false, objId = null) => {
    const active = isObj ? (view === 'objection' && currentObjId === objId) : view === id;
    const isStudied = objId && studied.includes(objId);
    return (
      <button
        key={objId || id}
        className={cls('nav-btn', active && 'active', isStudied && 'studied')}
        onClick={() => isObj ? navigate('objection', objId) : navigate(id)}
      >
        <span className="nav-icon">{icon}</span>
        {label}
        <span className="nav-dot" />
      </button>
    );
  };

  return (
    <nav className={cls('sidebar', sidebarOpen && 'open')}>
      <div className="sidebar-prog">
        <div className="prog-bar-wrap">
          <div className="prog-bar-fill" style={{ width: pct + '%' }} />
        </div>
        <div className="prog-text">{done} из {OBJECTIONS.length} изучено</div>
      </div>
      <div className="sidebar-divider" />
      <div className="sidebar-title">Меню</div>
      {navBtn('home', '🏠', 'Главная')}
      {navBtn('stats', '📊', 'Статистика')}
      {navBtn('trainer', '🎯', 'Тренажёр')}
      {navBtn('ai', '🤖', 'Gemini-ассистент')}
      {navBtn('favorites', '⭐', 'Избранное')}
      {navBtn('community', '🌐', 'Сообщество')}

      <div className="sidebar-divider" />
      <div className="sidebar-section">Классические</div>
      {OBJECTIONS.filter(o => o.cat === 'Классические').map(o =>
        navBtn('objection', o.icon, o.title, true, o.id)
      )}

      <div className="sidebar-divider" />
      <div className="sidebar-section">Сложные</div>
      {OBJECTIONS.filter(o => o.cat === 'Сложные').map(o =>
        navBtn('objection', o.icon, o.title, true, o.id)
      )}

      <div className="sidebar-divider" />
      <div className="sidebar-section">Новые</div>
      {OBJECTIONS.filter(o => o.cat === 'Новые').map(o =>
        navBtn('objection', o.icon, o.title, true, o.id)
      )}
    </nav>
  );
}

/* ══════════════════════════════════════════════════════
   HOME PAGE
══════════════════════════════════════════════════════ */
function HomePage() {
  const { navigate, studied } = useApp();
  return (
    <div className="page-anim">
      <div className="page-header">
        <div className="page-header-text">
          <div className="page-eyebrow">Справочник менеджера</div>
          <div className="page-title">ПРАВИЛО<br />ТРЁХ Н</div>
          <div className="page-desc">Три отказа — не повод сдаться. Каждый ответ клиента — это сигнал, а не финал. Выбери возражение.</div>
        </div>
      </div>

      <div className="rule-grid">
        {[
          { n: '1', t: 'Присоединение', d: 'Не спорим, не давим. Показываем что услышали клиента.' },
          { n: '2', t: 'Вопрос или аргумент', d: 'Копаем глубже. Ищем настоящую причину возражения.' },
          { n: '3', t: 'Последний козырь', d: 'Конкретное предложение с ограничением. После — отпускаем.' },
        ].map(r => (
          <div key={r.n} className="rule-card">
            <div className="rule-num">{r.n}</div>
            <div className="rule-title">{r.t}</div>
            <div className="rule-desc">{r.d}</div>
          </div>
        ))}
      </div>

      <div className="section-label">Все возражения</div>
      <div className="home-grid">
        {OBJECTIONS.map(o => (
          <div
            key={o.id}
            className={cls('home-card', studied.includes(o.id) && 'done')}
            onClick={() => navigate('objection', o.id)}
          >
            {studied.includes(o.id) && <span className="home-card-check">✓</span>}
            <div className="home-card-icon">{o.icon}</div>
            <div className="home-card-title">{o.title}</div>
            <div className="home-card-desc">{o.phrase.slice(0, 55)}...</div>
          </div>
        ))}
        <div className="home-card" style={{ borderStyle: 'dashed' }} onClick={() => navigate('community')}>
          <div className="home-card-icon">🌐</div>
          <div className="home-card-title">Сообщество</div>
          <div className="home-card-desc">Возражения от других менеджеров, сгенерированные Gemini</div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   OBJECTION PAGE
══════════════════════════════════════════════════════ */
function ObjectionPage() {
  const { currentObjId, studied, setStudied, favorites, setFavorites, notes, setNotes, showToast } = useApp();
  const obj = OBJECTIONS.find(o => o.id === currentObjId);
  const [notesOpen, setNotesOpen] = useState(false);
  const [noteVal, setNoteVal] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (obj) setNoteVal(notes[obj.id] || '');
  }, [obj?.id]);

  if (!obj) return <div style={{ color: 'var(--muted)', padding: '40px' }}>Возражение не найдено</div>;

  const isFav = favorites.includes(obj.id);
  const isStudied = studied.includes(obj.id);

  const toggleFav = () => {
    setFavorites(prev => isFav ? prev.filter(f => f !== obj.id) : [...prev, obj.id]);
    showToast(isFav ? 'Удалено из избранного' : '⭐ Добавлено в избранное', isFav ? 'info' : 'success');
  };

  const toggleStudied = () => {
    setStudied(prev => isStudied ? prev.filter(s => s !== obj.id) : [...prev, obj.id]);
    showToast(isStudied ? 'Отметка снята' : '✅ Отмечено как изучено', isStudied ? 'info' : 'success');
  };

  const saveNote = () => {
    setNotes(prev => ({ ...prev, [obj.id]: noteVal }));
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 1500);
  };

  const copyPhrase = () => {
    navigator.clipboard.writeText(obj.keyPhrase);
    setCopied(true);
    showToast('📋 Скопировано!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const stepNums = [...new Set(obj.steps.map(s => s.n))];

  return (
    <div className="page-anim">
      <div className="page-header">
        <div className="page-header-text">
          <div className="page-eyebrow">{obj.cat === 'Новые' ? 'Новое возражение' : obj.cat === 'Сложные' ? 'Сложное возражение' : 'Возражение'}</div>
          <div className="page-title">{obj.title.toUpperCase()}</div>
        </div>
        <div className="page-actions">
          <button className={cls('page-action-btn', isFav && 'fav-on')} onClick={toggleFav}>
            {isFav ? '★ В избранном' : '⭐ В избранное'}
          </button>
          <button className={cls('page-action-btn', isStudied && 'study-on')} onClick={toggleStudied}>
            {isStudied ? '✅ Изучено' : '✓ Изучено'}
          </button>
        </div>
      </div>

      <div className="principle">
        <div className="principle-label">⚡ Принцип</div>
        <div className="principle-text">{obj.principle}</div>
      </div>

      {stepNums.map(n => (
        <div key={n}>
          <div className="step-badge">Н <span>{n}</span></div>
          <div style={{ marginBottom: 10 }}>
            {obj.steps.find(s => s.n === n)?.lines.map((line, i) => (
              <div key={i} className="dialog-line">
                <span className={cls('speaker', line.role === 'client' ? 'speaker-c' : 'speaker-m')}>
                  {line.role === 'client' ? 'К' : 'М'}
                </span>
                <div
                  className={cls('bubble', line.role === 'client' ? 'bubble-client' : 'bubble-manager')}
                  dangerouslySetInnerHTML={{ __html: line.text }}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="tip-box"><strong>Совет:</strong> {obj.tip}</div>

      <button className={cls('copy-btn', copied && 'copied')} onClick={copyPhrase}>
        {copied ? '✓ Скопировано' : '📋 Скопировать ключевую фразу'}
      </button>

      <div className="notes-panel">
        <div className="notes-head" onClick={() => setNotesOpen(o => !o)}>
          <span>📝</span>
          <span className="notes-head-title">Личные заметки</span>
          <span style={{ color: 'var(--muted)', fontSize: 12 }}>{notesOpen ? '▲' : '▼'}</span>
        </div>
        <div className={cls('notes-body', notesOpen && 'open')}>
          <textarea
            className="notes-textarea"
            value={noteVal}
            onChange={e => setNoteVal(e.target.value)}
            placeholder="Запиши свои наблюдения, что работает у тебя..."
          />
          <button className={cls('notes-save', noteSaved && 'saved')} onClick={saveNote}>
            {noteSaved ? '✓ Сохранено' : 'Сохранить заметку'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   STATS PAGE
══════════════════════════════════════════════════════ */
function StatsPage() {
  const { navigate, studied, setStudied, favorites, setFavorites, setNotes, showToast } = useApp();
  const [confirm, setConfirm] = useState(false);
  const total = OBJECTIONS.length;
  const done = studied.length;

  const reset = () => {
    setStudied([]); setFavorites([]); setNotes({});
    setConfirm(false);
    showToast('Прогресс сброшен', 'info');
  };

  return (
    <div className="page-anim">
      <div className="page-header">
        <div className="page-header-text">
          <div className="page-eyebrow">Дашборд</div>
          <div className="page-title">СТАТИСТИКА</div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-num" style={{ color: 'var(--green)' }}>{done}</div><div className="stat-label">Изучено</div></div>
        <div className="stat-card"><div className="stat-num" style={{ color: 'var(--red)' }}>{total - done}</div><div className="stat-label">Осталось</div></div>
        <div className="stat-card"><div className="stat-num" style={{ color: 'var(--gold)' }}>{favorites.length}</div><div className="stat-label">В избранном</div></div>
        <div className="stat-card"><div className="stat-num" style={{ color: 'var(--blue)' }}>{Math.round(done / total * 100)}%</div><div className="stat-label">Прогресс</div></div>
      </div>

      <div className="section-label">Все возражения</div>
      {OBJECTIONS.map(o => (
        <div key={o.id} className={cls('obj-row', studied.includes(o.id) && 'done')} onClick={() => navigate('objection', o.id)}>
          <span style={{ fontSize: 16 }}>{o.icon}</span>
          <span className="obj-row-name">{o.title}</span>
          <span className={cls('tag', o.cat === 'Сложные' ? 'red' : o.cat === 'Новые' ? 'gold' : '')}>{o.cat}</span>
          <div className="obj-row-bar">
            <div className="obj-row-bar-fill" style={{ width: studied.includes(o.id) ? '100%' : '0%' }} />
          </div>
          <span className="obj-row-check">✓</span>
        </div>
      ))}

      <div style={{ marginTop: 20 }}>
        <button className="hbtn" style={{ color: 'var(--red)', borderColor: 'var(--red-dim)' }} onClick={() => setConfirm(true)}>
          🗑 Сбросить прогресс
        </button>
      </div>

      {confirm && (
        <div className="modal-overlay" onClick={() => setConfirm(false)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="confirm-title">Сбросить прогресс?</div>
            <div className="confirm-text">Все отметки «изучено» и заметки будут удалены. Это нельзя отменить.</div>
            <div className="confirm-btns">
              <button className="confirm-btn confirm-btn-cancel" onClick={() => setConfirm(false)}>Отмена</button>
              <button className="confirm-btn confirm-btn-ok" onClick={reset}>Сбросить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   TRAINER PAGE
══════════════════════════════════════════════════════ */
function TrainerPage() {
  const { studied, setStudied, showToast } = useApp();
  const [cards, setCards] = useState(() => [...OBJECTIONS].sort(() => Math.random() - 0.5));
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [showRef, setShowRef] = useState(false);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [correct, setCorrect] = useState(0);

  const card = cards[idx];

  const shuffle = () => {
    setCards([...OBJECTIONS].sort(() => Math.random() - 0.5));
    setIdx(0); setAnswer(''); setShowRef(false); setAiFeedback(null); setCorrect(0);
  };

  const next = () => {
    if (idx >= cards.length - 1) { shuffle(); return; }
    setIdx(i => i + 1); setAnswer(''); setShowRef(false); setAiFeedback(null);
  };

  const reveal = () => setShowRef(true);

  const checkWithAI = async () => {
    if (!answer.trim()) { showToast('Напиши свой ответ сначала', 'info'); return; }
    setAiLoading(true); setAiFeedback(null); setShowRef(true);
    const prompt = `Ты тренер по продажам. Оцени ответ менеджера на возражение клиента.

Возражение клиента: "${card.phrase}"
Ответ менеджера: "${answer}"
Эталонный ответ: "${card.trainerAnswer}"

Ответь ТОЛЬКО валидным JSON без markdown:
{"score":7,"verdict":"Хорошо","strengths":"что хорошо сделал менеджер","improvements":"что улучшить конкретно","ideal":"идеальная короткая фраза для закрытия этого возражения"}`;

    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt }),
      });
      const data = await r.json();
      let text = data.reply || '';
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const fb = JSON.parse(text);
      setAiFeedback(fb);
    } catch {
      showToast('Не удалось получить оценку от Gemini', 'info');
    }
    setAiLoading(false);
  };

  const mark = (wasCorrect) => {
    if (wasCorrect) {
      setCorrect(c => c + 1);
      if (!studied.includes(card.id)) {
        setStudied(prev => [...prev, card.id]);
        showToast('✅ Отмечено как изучено', 'success');
      }
    }
    next();
  };

  const pct = Math.round(idx / cards.length * 100);
  const scoreColor = aiFeedback ? (aiFeedback.score >= 8 ? 'var(--green)' : aiFeedback.score >= 5 ? 'var(--gold)' : 'var(--red)') : '';

  return (
    <div className="page-anim">
      <div className="page-header">
        <div className="page-header-text">
          <div className="page-eyebrow">Режим практики</div>
          <div className="page-title">ТРЕНАЖЁР</div>
          <div className="page-desc">Читай возражение → пиши ответ своими словами → получи оценку от Gemini.</div>
        </div>
      </div>

      <div className="trainer-progress-bar-wrap">
        <div className="trainer-prog-text">Карточка {Math.min(idx + 1, cards.length)} из {cards.length}</div>
        <div className="trainer-prog-bar">
          <div className="trainer-prog-fill" style={{ width: pct + '%' }} />
        </div>
        <div className="trainer-prog-badge">{correct} ✓</div>
      </div>

      <div className="trainer-card">
        <div className="trainer-cat">{card?.cat || ''}</div>
        <div className="trainer-obj">{card?.phrase || ''}</div>
        <div className="trainer-sub" style={{ color: 'var(--muted)' }}>{card?.title || ''}</div>

        <textarea
          className="trainer-input"
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          placeholder="Напиши свой ответ здесь... Как бы ты ответил на это возражение?"
        />

        <div className="trainer-btns">
          <button className="tbtn-primary" onClick={checkWithAI} disabled={aiLoading}>
            {aiLoading ? '⏳ Оцениваю...' : '🤖 Проверить с Gemini'}
          </button>
          <button className="tbtn-sec" onClick={reveal}>Показать ответ</button>
          <button className="tbtn-sec" onClick={shuffle}>🔀 Перемешать</button>
          <button className="tbtn-sec" onClick={next}>Пропустить →</button>
        </div>

        {showRef && (
          <div className="trainer-answer">
            <div className="trainer-answer-label">⚡ Эталонный ответ</div>
            <div className="trainer-answer-text">{card?.trainerAnswer}</div>

            {aiLoading && (
              <div style={{ marginTop: 14, color: 'var(--muted)', fontSize: 13 }}>
                🤖 Gemini оценивает твой ответ...
              </div>
            )}

            {aiFeedback && (
              <div className="ai-feedback">
                <div className="ai-feedback-label">🤖 Оценка Gemini</div>
                <div className="ai-score-row">
                  <div className="ai-score-num" style={{ color: scoreColor }}>{aiFeedback.score}/10</div>
                  <div className="ai-score-verdict" style={{ color: scoreColor }}>{aiFeedback.verdict}</div>
                </div>
                {aiFeedback.strengths && (
                  <div className="ai-feedback-text" style={{ marginBottom: 6 }}>
                    <strong style={{ color: 'var(--green)' }}>✓ Хорошо:</strong> {aiFeedback.strengths}
                  </div>
                )}
                {aiFeedback.improvements && (
                  <div className="ai-feedback-text" style={{ marginBottom: 6 }}>
                    <strong style={{ color: 'var(--gold)' }}>→ Улучши:</strong> {aiFeedback.improvements}
                  </div>
                )}
                {aiFeedback.ideal && (
                  <div className="ai-feedback-text" style={{ padding: '8px 12px', background: 'rgba(59,111,212,0.1)', borderRadius: 6, borderLeft: '2px solid #3b6fd4' }}>
                    <strong style={{ color: '#7eb8f7' }}>💬 Идеальная фраза:</strong> {aiFeedback.ideal}
                  </div>
                )}
              </div>
            )}

            <div className="score-btns">
              <button className="score-btn score-easy" onClick={() => mark(true)}>✓ Знал это</button>
              <button className="score-btn score-hard" onClick={() => mark(false)}>× Нужно повторить</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   AI CHAT PAGE
══════════════════════════════════════════════════════ */
function AiPage() {
  const [msgs, setMsgs] = useState([
    { role: 'ai', text: 'Привет! Я Gemini — AI-тренер по продажам Underground Fitness. Расскажи что за клиент, какое возражение — помогу найти правильный ответ. 💪' }
  ]);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const msgsRef = useRef(null);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [msgs, loading]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setMsgs(prev => [...prev, { role: 'user', text: msg }]);
    setLoading(true);

    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history }),
      });
      const data = await r.json();
      const reply = data.reply || data.error || 'Ошибка';
      setHistory(prev => [...prev, { role: 'user', content: msg }, { role: 'assistant', content: reply }]);
      setMsgs(prev => [...prev, { role: 'ai', text: reply }]);
    } catch {
      setMsgs(prev => [...prev, { role: 'ai', text: '❌ Ошибка подключения к Gemini' }]);
    }
    setLoading(false);
  };

  const quick = [
    ['💰 Дорого', 'Как работать с клиентом который говорит что дорого?'],
    ['🤔 Подумаю', 'Клиент сказал подумает и ушёл. Как вернуть?'],
    ['🚫 Не верит', 'Клиент не верит что получит результат. Что говорить?'],
    ['😤 Негатив', 'Клиент уже был у нас и не понравилось. Как убедить вернуться?'],
    ['🎯 Закрытие', 'Дай 3 лучших фразы для закрытия сделки в фитнес-клубе'],
  ];

  return (
    <div className="page-anim">
      <div className="page-header">
        <div className="page-header-text">
          <div className="page-eyebrow">Искусственный интеллект</div>
          <div className="page-title">GEMINI<br />АССИСТЕНТ</div>
          <div className="page-desc">Спроси совета по сложной ситуации с клиентом. Gemini знает все скрипты.</div>
        </div>
      </div>

      <div className="chat-wrap">
        <div className="chat-msgs" ref={msgsRef}>
          {msgs.map((m, i) => (
            <div key={i} className={cls('chat-msg', m.role)}>
              <div className="chat-avatar">{m.role === 'ai' ? 'AI' : 'Вы'}</div>
              <div className="chat-bubble" style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
            </div>
          ))}
          {loading && (
            <div className="chat-msg ai">
              <div className="chat-avatar">AI</div>
              <div className="chat-typing"><span /><span /><span /></div>
            </div>
          )}
        </div>
        <div className="chat-quick">
          {quick.map(([label, q]) => (
            <button key={label} className="chat-quick-btn" onClick={() => send(q)}>{label}</button>
          ))}
        </div>
        <div className="chat-input-row">
          <textarea
            className="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Опиши ситуацию с клиентом..."
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          />
          <button className="chat-send" onClick={() => send()} disabled={loading}>➤</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   FAVORITES PAGE
══════════════════════════════════════════════════════ */
function FavoritesPage() {
  const { navigate, favorites, setFavorites, showToast } = useApp();

  const remove = (id) => {
    setFavorites(prev => prev.filter(f => f !== id));
    showToast('Удалено из избранного', 'info');
  };

  return (
    <div className="page-anim">
      <div className="page-header">
        <div className="page-header-text">
          <div className="page-eyebrow">Сохранённое</div>
          <div className="page-title">ИЗБРАННОЕ</div>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="fav-empty">
          <div className="fav-empty-icon">⭐</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Избранное пусто</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>Нажми «В избранное» на любом возражении</div>
        </div>
      ) : (
        <div className="fav-grid">
          {favorites.map(id => {
            const obj = OBJECTIONS.find(o => o.id === id);
            if (!obj) return null;
            return (
              <div key={id} className="fav-card" onClick={() => navigate('objection', id)}>
                <div className="fav-icon">{obj.icon}</div>
                <div className="fav-info">
                  <div className="fav-name">{obj.title}</div>
                  <div className="fav-cat">{obj.cat}</div>
                </div>
                <button className="fav-rm" onClick={e => { e.stopPropagation(); remove(id); }}>✕</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   GENERATE MODAL
══════════════════════════════════════════════════════ */
function GenerateModal({ onClose, onPublish }) {
  const { showToast } = useApp();
  const [phrase, setPhrase] = useState('');
  const [generated, setGenerated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const generate = async () => {
    if (!phrase.trim()) { showToast('Напиши возражение клиента', 'info'); return; }
    setLoading(true); setGenerated(null);
    try {
      const r = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phrase }),
      });
      const data = await r.json();
      if (data.error) { showToast('Ошибка: ' + data.error, 'info'); setLoading(false); return; }
      setGenerated(data.objection);
    } catch (e) {
      showToast('Ошибка подключения', 'info');
    }
    setLoading(false);
  };

  const publish = async () => {
    if (!generated) return;
    setPublishing(true);
    try {
      const r = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generated),
      });
      const data = await r.json();
      if (data.error) { showToast('Ошибка: ' + data.error, 'info'); setPublishing(false); return; }
      showToast('🌐 Возражение опубликовано!', 'success');
      onPublish(data.objection || generated);
      onClose();
    } catch {
      showToast('Ошибка при публикации', 'info');
    }
    setPublishing(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="gen-modal" onClick={e => e.stopPropagation()}>
        <div className="gen-modal-title">🤖 Создать возражение с Gemini</div>
        <div className="gen-modal-sub">
          Опиши возражение клиента — Gemini создаст полный скрипт отработки по методу «Правило трёх Н».
          Скрипт появится в разделе «Сообщество» и его увидят все менеджеры.
        </div>

        <textarea
          className="gen-input"
          value={phrase}
          onChange={e => setPhrase(e.target.value)}
          placeholder="Например: «У меня уже есть тренажёр дома, зачем мне зал?» или «Я слышал что онлайн-тренировки не работают»..."
        />

        <div className="gen-btns">
          <button className="gen-btn" onClick={generate} disabled={loading || !phrase.trim()}>
            {loading ? '⏳ Gemini генерирует...' : '✨ Сгенерировать скрипт'}
          </button>
          <button className="gen-btn gen-btn-cancel" onClick={onClose}>Отмена</button>
        </div>

        {loading && (
          <div className="gen-loading">
            <span className="gen-loading-icon">⚙️</span>
            Gemini создаёт скрипт отработки...
          </div>
        )}

        {generated && (
          <>
            <div className="gen-preview">
              <div className="gen-preview-label">Предпросмотр</div>
              <div className="gen-preview-title">{generated.icon} {generated.title}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10, fontStyle: 'italic' }}>
                «{generated.phrase}»
              </div>
              <div className="gen-preview-principle">{generated.principle}</div>
              <div className="gen-preview-dialogue">
                {generated.dialogue?.map((line, i) => (
                  <div key={i} className="gen-preview-line">
                    <span className={cls('who', line.role === 'client' ? 'c' : 'm')}>
                      {line.role === 'client' ? 'К:' : 'М:'}
                    </span>
                    {line.text}
                  </div>
                ))}
              </div>
              {generated.tip && (
                <div className="gen-preview-tip">💡 {generated.tip}</div>
              )}
            </div>

            <button className="gen-publish-btn" onClick={publish} disabled={publishing}>
              {publishing ? 'Публикую...' : '🌐 ОПУБЛИКОВАТЬ ДЛЯ ВСЕХ'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   COMMUNITY PAGE
══════════════════════════════════════════════════════ */
function CommunityPage() {
  const { showToast } = useApp();
  const [objections, setObjections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noBlob, setNoBlob] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [voted, setVoted] = useState({});

  useEffect(() => {
    fetch('/api/community')
      .then(r => r.json())
      .then(data => {
        setObjections(data.objections || []);
        setNoBlob(!!data.noBlob);
      })
      .catch(() => setObjections([]))
      .finally(() => setLoading(false));
  }, []);

  const vote = async (id) => {
    if (voted[id]) return;
    setVoted(v => ({ ...v, [id]: true }));
    const r = await fetch('/api/community', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const data = await r.json();
    if (data.ok) {
      setObjections(prev => prev.map(o => o.id === id ? { ...o, votes: data.votes } : o));
      showToast('👍 Проголосовал!', 'success');
    }
  };

  const onPublish = (obj) => {
    setObjections(prev => [obj, ...prev]);
  };

  const fmt = (iso) => {
    try { return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }); }
    catch { return ''; }
  };

  return (
    <div className="page-anim">
      <div className="page-header">
        <div className="page-header-text">
          <div className="page-eyebrow">Совместная база знаний</div>
          <div className="page-title">СООБЩЕСТВО</div>
          <div className="page-desc">
            Менеджеры предлагают возражения — Gemini создаёт скрипты. Все скрипты видят все. Голосуй за лучшие.
          </div>
        </div>
      </div>

      {noBlob && (
        <div className="comm-no-kv">
          <div className="comm-no-kv-title">⚠️ Vercel Blob не подключён</div>
          <div className="comm-no-kv-text">
            Для хранения общих возражений нужен Vercel Blob Store.<br />
            В Vercel Dashboard: <code>Storage → Create Blob Store → Link to project</code>.<br />
            После этого переменная <code>BLOB_READ_WRITE_TOKEN</code> добавится автоматически.
          </div>
        </div>
      )}

      <div className="community-header-actions">
        <button className="propose-btn" onClick={() => setShowModal(true)}>
          ✨ ПРЕДЛОЖИТЬ ВОЗРАЖЕНИЕ
        </button>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>
          {objections.length > 0 && `${objections.length} возражений в базе`}
        </span>
      </div>

      {loading ? (
        <div className="comm-loading">⏳ Загружаем возражения...</div>
      ) : objections.length === 0 ? (
        <div className="comm-empty">
          <div className="comm-empty-icon">🌱</div>
          <div className="comm-empty-text">База пока пуста</div>
          <div className="comm-empty-sub">Будь первым — предложи возражение и Gemini создаст скрипт!</div>
        </div>
      ) : (
        <div className="comm-grid">
          {objections.map(obj => (
            <div key={obj.id} className="comm-card">
              <div className="comm-card-head">
                <div className="comm-card-icon">{obj.icon || '💬'}</div>
                <div>
                  <div className="comm-card-title">{obj.title}</div>
                  <div className="comm-card-phrase">«{obj.phrase}»</div>
                </div>
              </div>
              <div className="comm-card-principle">{obj.principle}</div>
              {obj.dialogue && obj.dialogue.slice(0, 4).map((line, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: line.role === 'client' ? 'var(--muted)' : '#4a7fc1', marginTop: 2, flexShrink: 0 }}>
                    {line.role === 'client' ? 'К' : 'М'}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{line.text}</span>
                </div>
              ))}
              {obj.tip && <div className="comm-card-tip">💡 {obj.tip}</div>}
              <div className="comm-card-foot">
                <div className="comm-card-meta">{fmt(obj.createdAt)}</div>
                <button
                  className={cls('vote-btn', voted[obj.id] && 'voted')}
                  onClick={() => vote(obj.id)}
                  disabled={voted[obj.id]}
                >
                  👍 {obj.votes || 0}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <GenerateModal
          onClose={() => setShowModal(false)}
          onPublish={onPublish}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN APP
══════════════════════════════════════════════════════ */
export default function App() {
  const [view, setView] = useState('home');
  const [currentObjId, setCurrentObjId] = useState(null);
  const [studied, setStudied] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [notes, setNotes] = useState({});
  const [toast, setToast] = useState(null);
  const [timerOpen, setTimerOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toastTimer = useRef(null);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('uf_state') || '{}');
      if (s.studied) setStudied(s.studied);
      if (s.favorites) setFavorites(s.favorites);
      if (s.notes) setNotes(s.notes);
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem('uf_state', JSON.stringify({ studied, favorites, notes })); } catch {}
  }, [studied, favorites, notes]);

  const showToast = useCallback((msg, type = 'info') => {
    setToast({ msg, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  const navigate = useCallback((newView, objId = null) => {
    setView(newView);
    if (objId) setCurrentObjId(objId);
    setSidebarOpen(false);
    document.querySelector('.main-area')?.scrollTo(0, 0);
  }, []);

  const ctx = {
    view, navigate,
    currentObjId, setCurrentObjId,
    studied, setStudied,
    favorites, setFavorites,
    notes, setNotes,
    toast, showToast,
    timerOpen, setTimerOpen,
    sidebarOpen, setSidebarOpen,
  };

  const renderView = () => {
    switch (view) {
      case 'home':      return <HomePage />;
      case 'objection': return <ObjectionPage />;
      case 'stats':     return <StatsPage />;
      case 'trainer':   return <TrainerPage />;
      case 'ai':        return <AiPage />;
      case 'favorites': return <FavoritesPage />;
      case 'community': return <CommunityPage />;
      default:          return <HomePage />;
    }
  };

  return (
    <Ctx.Provider value={ctx}>
      <Head>
        <title>Underground Fitness — Отработка возражений</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="app-root">
        <Header />
        <div className="app-body">
          <Sidebar />
          {sidebarOpen && (
            <div
              onClick={() => setSidebarOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 140 }}
            />
          )}
          <main className="main-area">{renderView()}</main>
        </div>
        <Toast />
        {timerOpen && <TimerWidget />}
      </div>
    </Ctx.Provider>
  );
}
