import { useState } from 'react';

// Доступные услуги барбершопа
const services = [
  'Стрижка головы',
  'Окантовка',
  'Моделирование бороды',
  'Камуфляж седины головы',
];

const BookingForm = () => {
  // Начальное состояние формы
  const initialState = {
    service: '',
    name: '',
    phone: '',
    date: '',
  };

  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Обработчик изменения любого поля формы
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Сбрасываем ошибку для текущего поля при вводе
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  // Валидация формы перед отправкой
  const validate = () => {
    const newErrors = {};

    // Обязательные поля
    if (!form.service) newErrors.service = 'Выберите услугу';
    if (!form.name.trim()) newErrors.name = 'Введите имя';
    if (!form.phone.trim()) newErrors.phone = 'Введите номер телефона';

    // Телефон: минимум 10 цифр (отбрасываем все не-цифры для проверки)
    const digitsOnly = form.phone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      newErrors.phone = 'Номер должен содержать минимум 10 цифр';
    }

    if (!form.date) newErrors.date = 'Выберите дату';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Отправка формы
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) return;

    // Показываем сообщение об успехе
    setIsSubmitted(true);
    setForm(initialState);

    // Скрываем сообщение через 4 секунды
    setTimeout(() => setIsSubmitted(false), 4000);
  };

  return (
    <section id="booking" className="booking">
      <div className="booking__container">
        <h2 className="section-title">ЗАПИСЬ ОНЛАЙН</h2>

        {/* Сообщение об успешной отправке */}
        {isSubmitted && (
          <div className="booking__success">
            ✓ Заявка отправлена! Мы свяжемся с вами для подтверждения.
          </div>
        )}

        <form className="booking__form" onSubmit={handleSubmit}>
          {/* Поле: Услуга (select) */}
          <div className="booking__field">
            <label className="booking__label" htmlFor="service">
              Услуга <span className="booking__required">*</span>
            </label>
            <select
              id="service"
              name="service"
              value={form.service}
              onChange={handleChange}
              className={`booking__select ${errors.service ? 'booking__select--error' : ''}`}
            >
              <option value="">Выберите услугу</option>
              {services.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {errors.service && <span className="booking__error">{errors.service}</span>}
          </div>

          {/* Поле: Имя */}
          <div className="booking__field">
            <label className="booking__label" htmlFor="name">
              Имя <span className="booking__required">*</span>
            </label>
            <input
              id="name"
              type="text"
              name="name"
              placeholder="Ваше имя"
              value={form.name}
              onChange={handleChange}
              className={`booking__input ${errors.name ? 'booking__input--error' : ''}`}
            />
            {errors.name && <span className="booking__error">{errors.name}</span>}
          </div>

          {/* Поле: Телефон */}
          <div className="booking__field">
            <label className="booking__label" htmlFor="phone">
              Телефон <span className="booking__required">*</span>
            </label>
            <input
              id="phone"
              type="tel"
              name="phone"
              placeholder="+7 (___) ___-__-__"
              value={form.phone}
              onChange={handleChange}
              className={`booking__input ${errors.phone ? 'booking__input--error' : ''}`}
            />
            {errors.phone && <span className="booking__error">{errors.phone}</span>}
          </div>

          {/* Поле: Дата */}
          <div className="booking__field">
            <label className="booking__label" htmlFor="date">
              Дата <span className="booking__required">*</span>
            </label>
            <input
              id="date"
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className={`booking__input ${errors.date ? 'booking__input--error' : ''}`}
            />
            {errors.date && <span className="booking__error">{errors.date}</span>}
          </div>

          {/* Кнопка отправки */}
          <button type="submit" className="btn btn--primary btn--full">
            ОТПРАВИТЬ ЗАЯВКУ
          </button>
        </form>
      </div>
    </section>
  );
};

export default BookingForm;
