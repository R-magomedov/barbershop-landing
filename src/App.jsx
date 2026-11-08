import Header from './components/Header';
import Hero from './components/Hero';
import BookingForm from './components/BookingForm';
import PriceList from './components/PriceList';
import Contacts from './components/Contacts';
import Address from './components/Address';
import Footer from './components/Footer';

function App() {
  return (
    <>
      {/* Фиксированная шапка с навигацией */}
      <Header />

      {/* Основной контент с отступом для фиксированного header */}
      <main style={{ paddingTop: '70px' }}>
        <Hero />
        <BookingForm />
        <PriceList />
        <Contacts />
        <Address />
      </main>

      <Footer />
    </>
  );
}

export default App;
