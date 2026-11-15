import { useState } from 'react';
import { getBookingMonths, getMonthDays, isDateAvailable, isTimeAvailable, TIME_SLOTS, toDateKey } from '../bookingSchedule';

const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const fullDate = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

function BookingCalendar({ date, time, onDateChange, onTimeChange, errors, now }) {
  const months = getBookingMonths(now);
  const [visibleMonth, setVisibleMonth] = useState(toDateKey(months[0]));
  const month = months.find((item) => toDateKey(item) === visibleMonth) || months[0];
  const days = getMonthDays(month);

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
                      <button type="button" className="booking-calendar__day" disabled={!isDateAvailable(toDateKey(day), now)} aria-label={fullDate.format(day)} aria-pressed={date === toDateKey(day)} aria-current={toDateKey(day) === toDateKey(now) ? 'date' : undefined} onClick={() => onDateChange(toDateKey(day))}>
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
        <div className="booking-calendar__slots" role="group" aria-label="Время записи">
          {TIME_SLOTS.map((slot) => (
            <button key={slot} type="button" className="booking-calendar__slot" disabled={!isTimeAvailable(date, slot, now)} aria-pressed={time === slot} onClick={() => onTimeChange(slot)}>{slot}</button>
          ))}
        </div>
        {date && !isDateAvailable(date, now) && <p className="booking-calendar__hint">На этот день время уже прошло. Выберите другую дату.</p>}
        {errors.time && <p id="time-error" className="booking__error">{errors.time}</p>}
      </fieldset>
      <p className="booking-calendar__summary" role="status">
        {date ? `${fullDate.format(new Date(`${date}T12:00:00`))}${time ? `  ${time}` : ' · выберите время'}` : 'Дата и время пока не выбраны'}
      </p>
      <p className="booking-calendar__hint">Демонстрационное расписание. Занятость мастера пока не учитывается.</p>
    </div>
  );
}

export default BookingCalendar;
