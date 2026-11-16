export const BOOKING_TIME_ZONE = 'Europe/Moscow';

// id совпадает с обозначением услуги в Apps Script; label видит посетитель.
export const BOOKING_SERVICES = [
  { id: 'haircut', label: 'Стрижка головы', duration: 60 },
  { id: 'edging', label: 'Окантовка', duration: 30 },
  { id: 'beard', label: 'Моделирование бороды', duration: 30 },
  { id: 'camouflage', label: 'Камуфляж седины головы', duration: 40 },
];

// Это сетка кнопок, а не список свободных часов. Занятость приходит с сервера.
export const TIME_SLOTS = Array.from({ length: 9 }, (_, index) => {
  const minutes = 10 * 60 + index * 60;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
});

// Местная дата: UTC не должен сдвигать выбранный день.
export function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Текущий день определяет часовой пояс мастера, а не посетителя сайта.
export function getMoscowDateKey(date) {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: BOOKING_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function getBookingMonths(now) {
  const [year, month] = getMoscowDateKey(now).split('-').map(Number);
  return Array.from({ length: 3 }, (_, index) => new Date(year, month - 1 + index, 1));
}

export function getMonthDays(month) {
  const offset = (month.getDay() + 6) % 7;
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return Array.from({ length: Math.ceil((offset + count) / 7) * 7 }, (_, index) => {
    const day = index - offset + 1;
    return day > 0 && day <= count ? new Date(month.getFullYear(), month.getMonth(), day) : null;
  });
}

export function isTimeAvailable(date, time, now) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !TIME_SLOTS.includes(time)) return false;
  // У Москвы UTC+03:00. Начало записи — один и тот же момент для всех клиентов.
  const appointment = new Date(`${date}T${time}:00+03:00`);
  const lastMonth = getBookingMonths(now)[2];
  const lastDay = toDateKey(new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0));
  return !Number.isNaN(appointment.getTime()) && getMoscowDateKey(appointment) === date && date <= lastDay && appointment > now;
}

export function isDateAvailable(date, now) {
  return TIME_SLOTS.some((time) => isTimeAvailable(date, time, now));
}
