import { BOOKING_TIME_ZONE, TIME_SLOTS } from './bookingSchedule';

// URL Web App публичный. Секреты и Calendar ID в React не передаём.
const webAppUrl = import.meta.env.VITE_APPS_SCRIPT_URL;

function getWebAppUrl() {
  if (!webAppUrl) throw new Error('Онлайн-запись временно недоступна. Свяжитесь с мастером.');
  const url = new URL(webAppUrl);
  if (url.protocol !== 'https:' || url.hostname !== 'script.google.com' || !url.pathname.endsWith('/exec')) {
    throw new Error('Онлайн-запись временно недоступна. Свяжитесь с мастером.');
  }
  return url;
}

export class BookingError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

export async function fetchAvailableSlots(date, serviceId, signal) {
  const url = getWebAppUrl();
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

const bookingErrors = {
  SLOT_UNAVAILABLE: 'Это время уже занято. Выберите другое свободное время.',
  VALIDATION_ERROR: 'Проверьте данные заявки и выбранное время.',
  CHALLENGE_FAILED: 'Не удалось отправить заявку. Обновите страницу или свяжитесь с мастером.',
  RATE_LIMITED: 'Слишком много попыток. Попробуйте позже или свяжитесь с мастером.',
  SERVICE_UNAVAILABLE: 'Онлайн-запись временно недоступна. Свяжитесь с мастером.',
  REQUEST_MISMATCH: 'Данные этой заявки изменились. Свяжитесь с мастером для проверки.',
  BOOKING_UNCERTAIN: 'Статус заявки требует проверки. Свяжитесь с мастером перед новой записью.',
};

export async function submitBooking(booking, signal) {
  const response = await fetch(getWebAppUrl(), {
    method: 'POST', credentials: 'omit', signal,
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    // Это JSON внутри простого текстового запроса, как в проверенном POST.
    body: JSON.stringify({ ...booking, action: 'book' }),
  });
  if (!response.ok) throw new Error('Не удалось прочитать подтверждение записи');
  const data = await response.json();
  if (data?.ok !== true) {
    throw new BookingError(bookingErrors[data?.code] || 'Не удалось подтвердить запись. Повторите отправку без изменения данных.', data?.code || 'UNKNOWN');
  }

  const confirmed = data.booking;
  // Успех — это подтверждение именно нашей заявки. HTTP 200 недостаточно:
  // Apps Script возвращает JSON с ok:false также при прикладной ошибке.
  if (!confirmed || confirmed.requestId !== booking.requestId || confirmed.date !== booking.date ||
      confirmed.time !== booking.time || confirmed.serviceId !== booking.serviceId ||
      confirmed.timeZone !== BOOKING_TIME_ZONE || typeof confirmed.eventId !== 'string' ||
      !confirmed.eventId || typeof data.replayed !== 'boolean') {
    throw new Error('Не удалось проверить подтверждение записи');
  }
  return confirmed;
}
