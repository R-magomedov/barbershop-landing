import { useState } from 'react';
import { getBookingMonths, getMonthDays, getMoscowDateKey, isDateAvailable, isTimeAvailable, TIME_SLOTS, toDateKey } from '../bookingSchedule';

const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const fullDate = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

function BookingCalendar({ date, time, serviceId, onDateChange, onTimeChange, errors, now, availability, onReload }) {
  const months = getBookingMonths(now);
  const [visibleMonth, setVisibleMonth] = useState(toDateKey(months[0]));
  const month = months.find((item) => toDateKey(item) === visibleMonth) || months[0];
  const days = getMonthDays(month);
  // Локальная проверка убирает уже прошедшие часы даже после ответа сервера.
  const availableTimes = availability.slots.filter((slot) => isTimeAvailable(date, slot, now));
  let timeHint = 'Сначала выберите услугу и день в календаре.';
  if (serviceId && date) {
    if (availability.status === 'loading') timeHint = 'Загружаем свободное время…';
    else if (availability.status === 'error') timeHint = availability.error;
    else if (availability.status === 'success') {
      timeHint = availableTimes.length ? '' : 'На этот день свободного времени нет. Выберите другую дату.';
    }
  }

  return (
    <div className="booking-calendar">
      <fieldset className="booking-calendar__group" tabIndex={-1} aria-invalid={Boolean(errors.date)} aria-describedby={errors.date ? 'date-error' : undefined}>
        <legend className="booking-calendar__title">Выберите дату <span className="booking__required">*</span></legend>
        <div className="booking-calendar__months" role="group" aria-label="Месяц записи">
          {months.map((item) => (
            <button key={toDateKey(item)} type="button" className="booking-calendar__month" aria-pressed={toDateKey(item) === toDateKey(month)} aria-label={item.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })} onClick={() => setVisibleMonth(toDateKey(item))}>
              {item.toLocaleDateString('ru-RU', { month: 'long' })}
              <span>{item.getFullYear()}</span>
            </button>
          ))}
        </div>
        <table className="booking-calendar__days">
          <caption className="visually-hidden">{month.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}</caption>
          <thead><tr>{weekdays.map((day) => <th key={day} scope="col">{day}</th>)}</tr></thead>
          <tbody>
            {Array.from({ length: days.length / 7 }, (_, week) => (
              <tr key={week}>
                {days.slice(week * 7, week * 7 + 7).map((day, index) => (
                  <td key={index}>
                    {day && (
                      <button type="button" className="booking-calendar__day" disabled={!isDateAvailable(toDateKey(day), now)} aria-label={fullDate.format(day)} aria-pressed={date === toDateKey(day)} aria-current={toDateKey(day) === getMoscowDateKey(now) ? 'date' : undefined} onClick={() => onDateChange(toDateKey(day))}>
                        {day.getDate()}
                      </button>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {errors.date && <p id="date-error" className="booking__error">{errors.date}</p>}
      </fieldset>
      <fieldset className="booking-calendar__group booking-calendar__times" tabIndex={-1} aria-invalid={Boolean(errors.time)} aria-describedby={errors.time ? 'time-error' : 'time-hint'}>
        <legend className="booking-calendar__title">Выберите время <span className="booking__required">*</span></legend>
        <p id="time-hint" className="booking-calendar__hint" role="status">{timeHint}</p>
        <div className="booking-calendar__slots" role="group" aria-label="Время записи" aria-busy={availability.status === 'loading'}>
          {/* Час можно выбрать только после ответа для текущей даты и услуги.
              При ошибке не подменяем реальную занятость демонстрационными часами. */}
          {TIME_SLOTS.map((slot) => (
            <button key={slot} type="button" className="booking-calendar__slot" disabled={availability.status !== 'success' || !availableTimes.includes(slot)} aria-pressed={time === slot} onClick={() => onTimeChange(slot)}>{slot}</button>
          ))}
        </div>
        {serviceId && date && (
          <button type="button" className="booking-calendar__reload" disabled={availability.status === 'loading'} onClick={onReload}>
            {availability.status === 'error' ? 'Попробовать ещё раз' : 'Обновить время'}
          </button>
        )}
        {errors.time && <p id="time-error" className="booking__error">{errors.time}</p>}
      </fieldset>
      <p className="booking-calendar__summary" role="status">
        {date ? `${fullDate.format(new Date(`${date}T12:00:00`))}${time ? `  ${time}` : ' · выберите время'}` : 'Дата и время пока не выбраны'}
      </p>
      <p className="booking-calendar__hint">Время по Москве. Занятые часы недоступны для выбора.</p>
    </div>
  );
}

export default BookingCalendar;
