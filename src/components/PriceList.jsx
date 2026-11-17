import { BOOKING_SERVICES } from '../bookingSchedule';

const PriceList = () => {
  return (
    <section id="price" className="price-section">
      <div className="price-section__container">
        <h2 className="section-title">ПРАЙС</h2>

        {/* Список услуг с ценами */}
        <div className="price-list">
          {BOOKING_SERVICES.map((item) => (
            <div key={item.id} className="price-item">
              <div className="price-item__info">
                <h3 className="price-item__name">{item.label}</h3>
                <p className="price-item__desc">{item.desc}</p>
              </div>
              <span className="price-item__price">{item.price}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PriceList;
