const Address = () => {
const ADDRESS = 'г. Избербаш, ул. Гаджиева, д. 10';


const LON = 47.873400;
const LAT = 42.557500;
const ZOOM = 16;

const MAP_SRC = `https://yandex.ru/map-widget/v1/?ll=${LON}%2C${LAT}&z=${ZOOM}&pt=${LON},${LAT},pm2rdm`;
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
              title={`Карта: ${ADDRESS}`}
              src={MAP_SRC}
              width="100%"
              height="400"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Address;
