const Contacts = () => {
  return (
    <section id="contacts" className="contacts">
      <div className="contacts__container">
        <h2 className="section-title">КОНТАКТЫ</h2>

        <div className="contacts__list">
          {/* Телефон */}
          <a href="tel:+79991234567" className="contact">
            <div className="contact__top">
              <span className="contact__icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6.62 10.79a11.458 11.458 0 005.59 5.59l2.2-2.2a1.003 1.003 0 011.12-.27c1.12.44 2.33.67 3.58.67a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.67a1 1 0 011 1c0 1.25.23 2.46.67 3.58a1.003 1.003 0 01-.27 1.12l-2.2 2.2z" fill="currentColor"/>
                </svg>
              </span>
              <span className="contact__label">Телефон</span>
            </div>
            <span className="contact__value">+7 999 123-45-67</span>
            <span className="contact__hint">Ежедневно, 10:00 — 21:00</span>
          </a>

          {/* WhatsApp */}
          <a
            href="https://wa.me/79991234567"
            target="_blank"
            rel="noopener noreferrer"
            className="contact contact--wa"
          >
            <div className="contact__top">
              <span className="contact__icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 17.403c-.301.151-1.776.879-2.056.981-.28.102-.484.152-.688.152-.204 0-.408-.025-.612-.076-.301-.076-.612-.254-.947-.508-.306-.228-.644-.522-.974-.852-.958-.958-1.59-1.976-1.794-2.311-.204-.335-.051-.514.127-.691.151-.151.335-.405.503-.609.151-.204.202-.335.303-.563.101-.228.051-.432-.025-.61-.076-.178-.688-1.658-.943-2.27-.25-.6-.504-.518-.688-.527-.178-.008-.382-.013-.586-.013-.204 0-.534.076-.813.38-.28.304-.996.972-.996 2.371 0 1.4 1.02 2.751 1.161 2.93.141.179 2.005 3.06 4.855 4.291.68.294 1.211.47 1.625.602.681.217 1.302.186 1.792.113.547-.082 1.776-.726 2.029-1.428.253-.702.253-1.304.177-1.428-.076-.124-.28-.204-.584-.355z" fill="currentColor"/>
                  <path d="M12.003 2.002c-5.517 0-10 4.483-10 10 0 1.794.476 3.544 1.379 5.088L2 22l4.943-1.3c1.496.814 3.187 1.244 4.912 1.244 5.517 0 10-4.483 10-10s-4.483-10-10-10zm0 18.25c-1.594 0-3.124-.42-4.47-1.217l-.32-.189-2.967.78.793-2.892-.21-.334C3.46 14.93 3.003 13.506 3.003 12.002c0-4.962 4.038-9 9-9s9 4.038 9 9-4.038 9-9 9zm4.225-6.663c-.274-.137-1.62-.8-1.871-.89-.25-.09-.433-.137-.616.137-.183.274-.709.89-.87 1.073-.162.183-.324.205-.6.068-.274-.137-1.156-.426-2.2-1.358-.809-.723-1.355-1.616-1.514-1.89-.16-.274-.017-.422.12-.559.124-.123.274-.324.411-.486.137-.162.183-.274.274-.457.091-.183.045-.345-.023-.482-.068-.137-.616-1.487-.844-2.038-.222-.537-.448-.464-.616-.472-.157-.007-.34-.009-.523-.009-.183 0-.48.068-.731.345-.25.274-.966.944-.966 2.303 0 1.359.989 2.67 1.126 2.852.137.183 1.938 2.958 4.694 4.147.657.283 1.169.452 1.568.578.659.207 1.259.178 1.732.108.528-.078 1.62-.662 1.85-1.301.23-.639.23-1.187.162-1.301-.068-.114-.25-.183-.524-.32z" fill="currentColor"/>
                </svg>
              </span>
              <span className="contact__label">WhatsApp</span>
            </div>
            <span className="contact__value">+7 999 123-45-67</span>
            <span className="contact__hint">Отвечаем в часы работы</span>
            <span className="contact__arrow" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 17L17 7M17 7H8M17 7v9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square"/>
              </svg>
            </span>
          </a>

          {/* Telegram */}
          <a
            href="https://t.me/barberblack"
            target="_blank"
            rel="noopener noreferrer"
            className="contact contact--tg"
          >
            <div className="contact__top">
              <span className="contact__icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" fill="currentColor"/>
                </svg>
              </span>
              <span className="contact__label">Telegram</span>
            </div>
            <span className="contact__value">@barberblack</span>
            <span className="contact__hint">Свободные окна и запись</span>
            <span className="contact__arrow" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 17L17 7M17 7H8M17 7v9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square"/>
              </svg>
            </span>
          </a>

          {/* Адрес */}
          <a href="#address" className="contact">
            <div className="contact__top">
              <span className="contact__icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6.5a2.5 2.5 0 010 5z" fill="currentColor"/>
                </svg>
              </span>
              <span className="contact__label">Адрес</span>
            </div>
            <span className="contact__value">ул. Гаджиева, 10</span>
            <span className="contact__hint">Избербаш · парковка во дворе</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Contacts;
