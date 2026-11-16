import { useEffect, useState } from 'react';
import { fetchAvailableSlots } from './bookingApi';

export function useAvailableSlots(date, serviceId) {
  const [result, setResult] = useState({ key: '', status: 'idle', slots: [], error: '' });
  const [attempt, setAttempt] = useState(0);
  const key = `${date}/${serviceId}`;

  useEffect(() => {
    if (!date || !serviceId) {
      setResult({ key: '', status: 'idle', slots: [], error: '' });
      return;
    }

    const controller = new AbortController();
    let active = true;
    let timedOut = false;
    setResult({ key, status: 'loading', slots: [], error: '' });
    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 15000);

    fetchAvailableSlots(date, serviceId, controller.signal)
      .then((slots) => {
        if (active) setResult({ key, status: 'success', slots, error: '' });
      })
      .catch(() => {
        if (active) setResult({
          key, status: 'error', slots: [],
          error: timedOut ? 'Сервис долго не отвечает. Попробуйте ещё раз.' : 'Не удалось загрузить свободное время. Попробуйте ещё раз.',
        });
      })
      .finally(() => window.clearTimeout(timeout));

    // Если посетитель быстро меняет день/услугу, старый ответ не должен
    // перезаписать новое расписание. Отменяем запрос и запрещаем его обработку.
    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [date, serviceId, key, attempt]);

  // До запуска эффекта уже блокируем часы от предыдущей даты/услуги.
  const current = !date || !serviceId
    ? { status: 'idle', slots: [], error: '' }
    : result.key === key ? result : { status: 'loading', slots: [], error: '' };

  return { ...current, reload: () => {
    setResult({ key, status: 'loading', slots: [], error: '' });
    setAttempt((value) => value + 1);
  } };
}
