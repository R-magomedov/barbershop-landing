// Временное расписание для интерфейса. Занятость Google Календаря пока не учитывается.
export const TIME_SLOTS = Array.from({ length: 9 }, (_, index) => {
  const minutes = 10 * 60 + index * 60;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
});

// Местная дата: UTC не должен сдвигать выбранный день.
export function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function getBookingMonths(now) {
  return Array.from({ length: 3 }, (_, index) => new Date(now.getFullYear(), now.getMonth() + index, 1));
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
  const appointment = new Date(`${date}T${time}:00`);
  const lastMonth = getBookingMonths(now)[2];
  const lastDay = toDateKey(new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0));
  return toDateKey(appointment) === date && date <= lastDay && appointment > now;
}

export function isDateAvailable(date, now) {
  return TIME_SLOTS.some((time) => isTimeAvailable(date, time, now));
}
