import { useState, useEffect } from 'react';

const Header = () => {
  // Состояние бургер-меню: открыто/закрыто
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Блокируем прокрутку body когда меню открыто
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    // При размонтировании компонента убираем блокировку скролла
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const openMenu = () => setIsMenuOpen(true);
  const closeMenu = () => setIsMenuOpen(false);

  const navLinks = [
    { href: '#price', label: 'Прайс' },
    { href: '#contacts', label: 'Контакты' },
    { href: '#address', label: 'Адрес' },
  ];

  return (
    <>
      <header className="header">
        <div className="header__container">
        {/* Логотип: SVG-иконка бритвы + название */}
        <a href="#" className="header__logo">
      
          <span className="header__logo-text">BARBERSHOP</span>
        </a>

        {/* Десктопная навигация */}
        <nav className="header__nav">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="header__nav-link">
              {link.label}
            </a>
          ))}
        </nav>

        {/* Бургер-кнопка — видна только на мобильных */}
        <button
          className="header__burger"
          onClick={openMenu}
          aria-label="Открыть меню"
        >
          <span className="header__burger-line" />
          <span className="header__burger-line" />
          <span className="header__burger-line" />
        </button>
      </div>
      </header>

      {/*
        Мобильное меню: оверлей + панель справа.
        ВАЖНО: они вынесены ЗА пределы <header>, потому что у шапки есть
        backdrop-filter — он создаёт новый контекст наложения, и fixed-элементы
        внутри него позиционируются относительно шапки, а не экрана
        (панель получала непрозрачный фон только на высоте шапки).
      */}
      <div
        className={`menu-overlay ${isMenuOpen ? 'menu-overlay--active' : ''}`}
        onClick={closeMenu}
      />
      <aside className={`burger-menu ${isMenuOpen ? 'burger-menu--open' : ''}`}>
        <div className="burger-menu__header">
          <span className="burger-menu__title">МЕНЮ</span>
          <button
            className="burger-menu__close"
            onClick={closeMenu}
            aria-label="Закрыть меню"
          >
            ✕
          </button>
        </div>
        <nav className="burger-menu__nav">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="burger-menu__link"
              onClick={closeMenu}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Header;
