// Реалистичные цены барбершопа
const priceData = [
  { service: 'Мужская стрижка', price: '1 500 ₽', desc: 'Классика, полустрижка, машинка' },
  { service: 'Стрижка бороды / окантовка', price: '800 ₽', desc: 'Моделирование формы, расчётка' },
  { service: 'Камуфляж седины (борода)', price: '1 200 ₽', desc: 'Нюансное тонирование, естественный результат' },
  { service: 'Камуфляж седины (голова)', price: '2 000 ₽', desc: 'Полное или частичное тонирование' },
  { service: 'Комплекс «Под ключ»', price: '3 000 ₽', desc: 'Стрижка + борода + уход' },
  { service: 'Детская стрижка (до 12 лет)', price: '1 000 ₽', desc: 'Бережный подход, игровая атмосфера' },
  { service: 'Чистка лица', price: '1 000 ₽', desc: 'Распаривание, скраб, уход' },
];

const PriceList = () => {
  return (
    <section id="price" className="price-section">
      <div className="price-section__container">
        <h2 className="section-title">ПРАЙС</h2>

        {/* Список услуг с ценами */}
        <div className="price-list">
          {priceData.map((item, index) => (
            <div key={index} className="price-item">
              <div className="price-item__info">
                <h3 className="price-item__name">{item.service}</h3>
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
