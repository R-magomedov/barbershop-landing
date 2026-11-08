const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__top">
          {/* Логотип в футере */}
          <a href="#" className="footer__logo">
            <span className="footer__logo-text">BARBERSHOP</span>
          </a>

          {/* Навигация в футере */}
          <nav className="footer__nav">
            <a href="#price" className="footer__link">Прайс</a>
            <a href="#booking" className="footer__link">Записаться</a>
            <a href="#contacts" className="footer__link">Контакты</a>
            <a href="#address" className="footer__link">Адрес</a>
          </nav>
        </div>

        <div className="footer__bottom">
          <p className="footer__copyright">© 2026 Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
