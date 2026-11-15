import { useEffect, useState } from 'react';
import BookingCalendar from './BookingCalendar';
import { isDateAvailable, isTimeAvailable } from '../bookingSchedule';

const services = ['Стрижка головы', 'Окантовка', 'Моделирование бороды', 'Камуфляж седины головы'];
const initialState = { service: '', name: '', phone: '', date: '', time: '' };

const BookingForm = () => {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [isChecked, setIsChecked] = useState(false);
  const [now, setNow] = useState(() => new Date());

  // Обновляем прошедшие слоты, даже если страница долго остаётся открытой.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const updateField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setIsChecked(false);
  };

  const changeDate = (date) => {
    setForm((current) => ({ ...current, date, time: current.date === date ? current.time : '' }));
    setErrors((current) => ({ ...current, date: '', time: '' }));
    setIsChecked(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const currentTime = new Date();
    const newErrors = {};
    if (!services.includes(form.service)) newErrors.service = 'Выберите услугу';
    if (!form.name.trim()) newErrors.name = 'Введите имя';
    if (form.phone.replace(/\D/g, '').length < 10) newErrors.phone = 'Номер должен содержать минимум 10 цифр';
    if (!form.date) newErrors.date = 'Выберите дату';
    else if (!isDateAvailable(form.date, currentTime)) newErrors.date = 'Выберите будущую дату с доступным временем';
    if (!form.time) newErrors.time = 'Выберите время';
    else if (!isTimeAvailable(form.date, form.time, currentTime)) newErrors.time = 'Это время уже недоступно. Выберите другое';

    setNow(currentTime);
    setErrors(newErrors);
    setIsChecked(Object.keys(newErrors).length === 0);
    if (Object.keys(newErrors).length) {
      // После отрисовки ошибок переводим фокус к первому проблемному полю.
      const element = event.currentTarget;
      window.requestAnimationFrame(() => element.querySelector('[aria-invalid="true"]')?.focus());
    }
  };

  return (
    <section id="booking" className="booking">
      <div className="booking__container">
        <h2 className="section-title">ЗАПИСЬ ОНЛАЙН</h2>
        <form className="booking__form" onSubmit={handleSubmit} noValidate>
          <p className="booking__notice">Пока это демоформа: можно выбрать дату и время, но заявка ещё не отправляется.</p>
          <div className="booking__field">
            <label className="booking__label" htmlFor="service">Услуга <span className="booking__required">*</span></label>
            <select id="service" name="service" required value={form.service} onChange={(event) => updateField('service', event.target.value)} aria-invalid={Boolean(errors.service)} aria-describedby={errors.service ? 'service-error' : undefined} className={`booking__select ${errors.service ? 'booking__select--error' : ''}`}>
              <option value="">Выберите услугу</option>
              {services.map((service) => <option key={service} value={service}>{service}</option>)}
            </select>
            {errors.service && <span id="service-error" className="booking__error">{errors.service}</span>}
          </div>
          <div className="booking__field">
            <label className="booking__label" htmlFor="name">Имя <span className="booking__required">*</span></label>
            <input id="name" type="text" name="name" autoComplete="given-name" required placeholder="Ваше имя" value={form.name} onChange={(event) => updateField('name', event.target.value)} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'name-error' : undefined} className={`booking__input ${errors.name ? 'booking__input--error' : ''}`} />
            {errors.name && <span id="name-error" className="booking__error">{errors.name}</span>}
          </div>
          <div className="booking__field">
            <label className="booking__label" htmlFor="phone">Телефон <span className="booking__required">*</span></label>
            <input id="phone" type="tel" name="phone" autoComplete="tel" required placeholder="+7 (___) ___-__-__" value={form.phone} onChange={(event) => updateField('phone', event.target.value)} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'phone-error' : undefined} className={`booking__input ${errors.phone ? 'booking__input--error' : ''}`} />
            {errors.phone && <span id="phone-error" className="booking__error">{errors.phone}</span>}
          </div>
          <BookingCalendar date={form.date} time={form.time} onDateChange={changeDate} onTimeChange={(time) => updateField('time', time)} errors={errors} now={now} />
          <button type="submit" className="btn btn--primary btn--full">Записаться</button>
          <div role="status" aria-live="polite">
            {Object.values(errors).some(Boolean) && <p className="booking__error">Проверьте отмеченные поля.</p>}
            {isChecked && <p className="booking__success">Данные заполнены верно. Это демопроверка: заявка не отправлена. Подключение записи — следующий шаг.</p>}
          </div>
        </form>
      </div>
    </section>
  );
};

export default BookingForm;
