const Address = () => {
  return (
    <section id="address" className="address">
      <div className="address__container">
        <h2 className="section-title">АДРЕС</h2>

        <div className="address__content">
          <div className="address__info">
            <p className="address__text">
              <strong>г. Избербаш, ул. Гаджиева, д. 10</strong>
            </p>
            <p className="address__text address__text--muted">
              Бесплатная парковка для клиентов во дворе.
            </p>
          </div>

          {/* Яндекс-карта: iframe без API-ключа */}
          <div className="address__map-wrapper">
            <iframe
              className="address__map"
              src="https://yandex.ru/map-widget/v1/?um=constructor%3A1d2a3e7b5f0c4d6a8b9e0f1c2d3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1&amp;source=constructor"
              width="100%"
              height="400"
              frameBorder="0"
              title="Карта — Чёрный Бритва"
              loading="lazy"
            />
            {/*
              Если iframe с Яндекс-картой не отображается (например, в dev-режиме
              блокируется), оставьте только текстовый адрес выше. Для продакшена
              получите свой iframe-код на https://yandex.ru/map-widget/
            */}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Address;
