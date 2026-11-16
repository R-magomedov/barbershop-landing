import { BOOKING_TIME_ZONE, TIME_SLOTS } from './bookingSchedule';

// URL Web App публичный. Секреты и Calendar ID в React не передаём.
const webAppUrl = import.meta.env.VITE_APPS_SCRIPT_URL;

export async function fetchAvailableSlots(date, serviceId, signal) {
  if (!webAppUrl) {
    throw new Error('Онлайн-расписание временно недоступно. Свяжитесь с мастером.');
  }

  const url = new URL(webAppUrl);
  if (url.protocol !== 'https:' || url.hostname !== 'script.google.com' || !url.pathname.endsWith('/exec')) {
    throw new Error('Онлайн-расписание временно недоступно. Свяжитесь с мастером.');
  }
  url.searchParams.set('action', 'slots');
  url.searchParams.set('date', date);
  url.searchParams.set('serviceId', serviceId);

  // Передаём только дату и услугу. Имя и телефон для чтения занятости не нужны.
  const response = await fetch(url, { credentials: 'omit', cache: 'no-store', signal });
  if (!response.ok) throw new Error('Не удалось загрузить время. Попробуйте ещё раз.');

  const data = await response.json();
  // Не включаем кнопки по одному только HTTP 200: проверяем смысл ответа.
  if (data?.ok !== true) throw new Error('Сервис не смог получить свободное время. Попробуйте ещё раз.');
  if (
    data.date !== date || data.serviceId !== serviceId || data.timeZone !== BOOKING_TIME_ZONE ||
    !Array.isArray(data.slots) || data.slots.some((slot) => !TIME_SLOTS.includes(slot))
  ) {
    throw new Error('Получен некорректный ответ расписания. Попробуйте ещё раз.');
  }
  return [...new Set(data.slots)].sort();
}
