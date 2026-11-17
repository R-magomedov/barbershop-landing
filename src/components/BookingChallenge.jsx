import { useEffect, useRef, useState } from 'react';

let scriptPromise;

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    const timeout = window.setTimeout(fail, 15000);
    function fail() {
      window.clearTimeout(timeout);
      script.remove();
      scriptPromise = undefined;
      reject(new Error('Не удалось загрузить проверку безопасности'));
    }
    script.onerror = fail;
    script.onload = () => {
      window.clearTimeout(timeout);
      if (window.turnstile) resolve(window.turnstile);
      else fail();
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export default function BookingChallenge({ resetKey, onToken }) {
  const container = useRef(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [size, setSize] = useState('compact');
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  useEffect(() => {
    // У виджета есть минимальная ширина. На узком телефоне используем
    // компактный вариант, в широкой форме — растягивающийся.
    const observer = new ResizeObserver(([entry]) => {
      setSize(entry.contentRect.width < 300 ? 'compact' : 'flexible');
    });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let active = true;
    let widgetId;
    let api;
    onToken('');
    setError('');
    if (!siteKey) {
      setError('Онлайн-запись временно недоступна. Свяжитесь с мастером.');
      return;
    }

    loadTurnstile().then((turnstile) => {
      if (!active) return;
      api = turnstile;
      // React сам управляет появлением и удалением виджета. Публичный siteKey
      // разрешён в браузере; секретный ключ остаётся только в Apps Script.
      widgetId = api.render(container.current, {
        sitekey: siteKey, action: 'booking', theme: 'dark', size, language: 'ru',
        'response-field': false,
        callback: (token) => {
          if (active) { setError(''); onToken(token); }
        },
        'expired-callback': () => {
          if (active) {
            onToken('');
            setError('Проверка устарела. Повторите её перед отправкой.');
          }
        },
        'error-callback': () => {
          if (active) {
            onToken('');
            setError('Проверка безопасности недоступна. Попробуйте ещё раз.');
          }
          return true;
        },
      });
    }).catch(() => {
      if (active) setError('Не удалось загрузить проверку безопасности. Попробуйте ещё раз.');
    });

    return () => {
      active = false;
      if (widgetId !== undefined) api.remove(widgetId);
    };
  }, [siteKey, resetKey, retry, size, onToken]);

  return (
    <div className="booking__challenge">
      <p className="booking__label">Проверка безопасности</p>
      <div ref={container} />
      {error && <p className="booking__error" role="status">{error}</p>}
      {error && siteKey && <button type="button" className="booking__retry" onClick={() => setRetry((value) => value + 1)}>Повторить проверку</button>}
    </div>
  );
}
