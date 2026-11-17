import { useEffect, useRef, useState } from 'react';
import BookingCalendar from './BookingCalendar';
import { BOOKING_SERVICES, isDateAvailable, isTimeAvailable } from '../bookingSchedule';
import { useAvailableSlots } from '../useAvailableSlots';
import { BookingError, submitBooking } from '../bookingApi';

const initialState = { service: '', name: '', phone: '', date: '', time: '', website: '' };

const BookingForm = () => {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [now, setNow] = useState(() => new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [uncertainAttempt, setUncertainAttempt] = useState(false);
  const [confirmed, setConfirmed] = useState(null);
  const attempt = useRef(null);
  const sending = useRef(false);
  const controller = useRef(null);
  const mounted = useRef(false);
  const resultRef = useRef(null);
  const availability = useAvailableSlots(form.date, form.service);

  useEffect(() => {
    mounted.current = true;
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => {
      mounted.current = false;
      window.clearInterval(timer);
      controller.current?.abort();
    };
  }, []);

  const updateField = (name, value) => {
    // Другая услуга имеет другую длительность: старое время сбрасываем.
    setForm((current) => ({ ...current, [name]: value, ...(name === 'service' ? { time: '' } : {}) }));
    setErrors((current) => ({ ...current, [name]: '', ...(name === 'service' ? { time: '' } : {}) }));
    setSubmitError('');
    setConfirmed(null);
    setUncertainAttempt(false);
  };

  const changeDate = (date) => {
    setForm((current) => ({ ...current, date, time: current.date === date ? current.time : '' }));
    setErrors((current) => ({ ...current, date: '', time: '' }));
    setSubmitError('');
    setConfirmed(null);
    setUncertainAttempt(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    // Ref блокирует повторный вызов сразу, до следующей отрисовки React.
    if (sending.current) return;
    const formElement = event.currentTarget;
    const currentTime = new Date();
    const phone = form.phone.replace(/\D/g, '');
    const payload = {
      serviceId: form.service, name: form.name.trim(), phone,
      date: form.date, time: form.time, website: form.website,
    };
    const signature = JSON.stringify(payload);
    const isRetry = uncertainAttempt && attempt.current?.signature === signature;
    const newErrors = {};
    if (!BOOKING_SERVICES.some((service) => service.id === form.service)) newErrors.service = 'Выберите услугу';
    if (!form.name.trim() || form.name.trim().length > 80 || /[\r\n]/.test(form.name)) newErrors.name = 'Введите имя длиной до 80 символов';
    if (!/^\+?[\d ()-]{10,30}$/.test(form.phone.trim()) || phone.length < 10 || phone.length > 15) newErrors.phone = 'Введите телефон: от 10 до 15 цифр';
    if (!form.date) newErrors.date = 'Выберите дату';
    else if (!isRetry && !isDateAvailable(form.date, currentTime)) newErrors.date = 'Выберите будущую дату с доступным временем';
    if (!form.time) newErrors.time = 'Выберите время';
    else if (!isRetry && !isTimeAvailable(form.date, form.time, currentTime)) newErrors.time = 'Это время уже прошло. Выберите другое';
    else if (!isRetry && (availability.status !== 'success' || !availability.slots.includes(form.time))) newErrors.time = 'Дождитесь загрузки и выберите свободное время';

    setNow(currentTime);
    setErrors(newErrors);
    setSubmitError('');
    setConfirmed(null);
    if (Object.keys(newErrors).length) {
      window.requestAnimationFrame(() => formElement.querySelector('[aria-invalid="true"]')?.focus());
      return;
    }

    // После ошибки сети повторяем тот же requestId, пока данные не изменились.
    // Сервер вернёт прежнее подтверждение вместо создания второго события.
    if (attempt.current?.signature !== signature) {
      attempt.current = { signature, requestId: crypto.randomUUID() };
    }
    sending.current = true;
    setIsSubmitting(true);
    controller.current = new AbortController();
    const timeout = window.setTimeout(() => controller.current?.abort(), 30000);
    try {
      const booking = await submitBooking({ ...payload, requestId: attempt.current.requestId }, controller.current.signal);
      if (!mounted.current) return;
      setConfirmed(booking);
      setUncertainAttempt(false);
      // Очищаем ввод только после проверки подтверждения конкретной заявки.
      setForm(initialState);
      setErrors({});
      attempt.current = null;
    } catch (error) {
      if (!mounted.current) return;
      setSubmitError(error instanceof BookingError ? error.message : 'Ответ не получен. Запись могла сохраниться. Повторите отправку без изменения полей — мы проверим ту же заявку.');
      setUncertainAttempt(!(error instanceof BookingError) || ['UNKNOWN', 'SERVER_ERROR'].includes(error.code));
      // Если время успел занять другой клиент, обновляем часы, сохраняя контакты.
      if (error.code === 'SLOT_UNAVAILABLE') {
        setForm((current) => ({ ...current, time: '' }));
        availability.reload();
      }
    } finally {
      window.clearTimeout(timeout);
      sending.current = false;
      if (mounted.current) {
        setIsSubmitting(false);
        window.requestAnimationFrame(() => resultRef.current?.focus());
      }
    }
  };

  return (
    <section id="booking" className="booking">
      <div className="booking__container">
        <h2 className="section-title">ЗАПИСЬ ОНЛАЙН</h2>
        <form className="booking__form" onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
          <p className="booking__notice">Выберите услугу, дату и свободное время. Все часы указаны по Москве.</p>
          <fieldset className="booking__inputs" disabled={isSubmitting}>
            <legend className="visually-hidden">Данные для записи</legend>
            <div className="booking__field">
              <label className="booking__label" htmlFor="service">Услуга <span className="booking__required">*</span></label>
              <select id="service" name="service" required value={form.service} onChange={(event) => updateField('service', event.target.value)} aria-invalid={Boolean(errors.service)} aria-describedby={errors.service ? 'service-error' : undefined} className={`booking__select ${errors.service ? 'booking__select--error' : ''}`}>
                <option value="">Выберите услугу</option>
                {BOOKING_SERVICES.map((service) => <option key={service.id} value={service.id}>{service.label}</option>)}
              </select>
              {errors.service && <span id="service-error" className="booking__error">{errors.service}</span>}
            </div>
            <div className="booking__field">
              <label className="booking__label" htmlFor="name">Имя <span className="booking__required">*</span></label>
              <input id="name" type="text" name="name" autoComplete="given-name" required maxLength={80} placeholder="Ваше имя" value={form.name} onChange={(event) => updateField('name', event.target.value)} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'name-error' : undefined} className={`booking__input ${errors.name ? 'booking__input--error' : ''}`} />
              {errors.name && <span id="name-error" className="booking__error">{errors.name}</span>}
            </div>
            <div className="booking__field">
              <label className="booking__label" htmlFor="phone">Телефон <span className="booking__required">*</span></label>
              <input id="phone" type="tel" name="phone" autoComplete="tel" required maxLength={30} placeholder="+7 (___) ___-__-__" value={form.phone} onChange={(event) => updateField('phone', event.target.value)} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'phone-error' : undefined} className={`booking__input ${errors.phone ? 'booking__input--error' : ''}`} />
              {errors.phone && <span id="phone-error" className="booking__error">{errors.phone}</span>}
            </div>
            {/* Невидимая ловушка для простых ботов; основная защита — на сервере. */}
            <div className="booking__honeypot" aria-hidden="true">
              <label htmlFor="booking-website">Website</label>
              <input id="booking-website" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => updateField('website', event.target.value)} />
            </div>
            <BookingCalendar date={form.date} time={form.time} serviceId={form.service} onDateChange={changeDate} onTimeChange={(time) => updateField('time', time)} errors={errors} now={now} availability={availability} onReload={() => { updateField('time', ''); availability.reload(); }} />
            <button type="submit" className="btn btn--primary btn--full" disabled={isSubmitting}>
              {isSubmitting && <span className="booking__spinner" aria-hidden="true" />}
              {isSubmitting ? 'Отправляем…' : uncertainAttempt ? 'Проверить заявку' : 'Записаться'}
            </button>
          </fieldset>
          <div ref={resultRef} tabIndex={-1} role="status" aria-live="polite">
            {Object.values(errors).some(Boolean) && <p className="booking__error">Проверьте отмеченные поля.</p>}
            {submitError && <p className="booking__error">{submitError}</p>}
            {confirmed && <p className="booking__success">Запись подтверждена: {BOOKING_SERVICES.find((service) => service.id === confirmed.serviceId)?.label}, {new Date(`${confirmed.date}T12:00:00`).toLocaleDateString('ru-RU')} в {confirmed.time} по Москве. Ждём вас!</p>}
          </div>
        </form>
      </div>
    </section>
  );
};

export default BookingForm;
