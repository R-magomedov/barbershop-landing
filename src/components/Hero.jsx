const Hero = () => {
  return (
    <section className="hero">
      <div className="hero__container">
        <h1 className="hero__title">
          СТРИЖКА ДЛЯ<br />
          <span className="hero__title-accent">МУЖЧИН</span>
        </h1>
        <p className="hero__subtitle">
          Классические мужские стрижки, моделирование бороды
        </p>
        <a href="#booking" className="btn btn--primary">
          Записаться
        </a>
      </div>
    </section>
  );
};

export default Hero;
