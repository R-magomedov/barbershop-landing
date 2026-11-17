import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Vite подставляет URL при сборке; в Node заменяем только эту настройку.
// fetch ниже подставной: тест не отправляет контакты и не создаёт событий.
test('POST проверяет подтверждение именно нашей заявки', async () => {
  const schedule = new URL('../src/bookingSchedule.js', import.meta.url).href;
  const source = (await readFile(new URL('../src/bookingApi.js', import.meta.url), 'utf8'))
    .replace("'./bookingSchedule'", JSON.stringify(schedule))
    .replace('import.meta.env.VITE_APPS_SCRIPT_URL', JSON.stringify('https://script.google.com/macros/s/TEST/exec'));
  const { submitBooking, BookingError } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
  const booking = { serviceId: 'haircut', name: 'Тест', phone: '70000000000', date: '2026-11-17', time: '13:00', requestId: '12345678-1234-1234-1234-123456789abc', website: '' };
  const valid = { ok: true, replayed: false, booking: { eventId: 'test', requestId: booking.requestId, serviceId: booking.serviceId, date: booking.date, time: booking.time, timeZone: 'Europe/Moscow' } };
  let answer = valid;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.equal(options.method, 'POST');
    assert.equal(options.credentials, 'omit');
    const body = JSON.parse(options.body);
    assert.equal('turnstileToken' in body, false);
    assert.equal(body.action, 'book');
    assert.equal('testToken' in body, false);
    return { ok: true, json: async () => answer };
  };
  try {
    assert.equal((await submitBooking(booking)).eventId, 'test');
    for (const patch of [{ requestId: 'other' }, { date: '2026-11-18' }, { time: '14:00' }, { serviceId: 'edging' }, { timeZone: 'UTC' }, { eventId: '' }]) {
      answer = { ...valid, booking: { ...valid.booking, ...patch } };
      await assert.rejects(submitBooking(booking));
    }
    answer = { ...valid, replayed: undefined };
    await assert.rejects(submitBooking(booking));
    for (const code of ['SLOT_UNAVAILABLE', 'CHALLENGE_FAILED', 'RATE_LIMITED', 'SERVICE_UNAVAILABLE', 'BOOKING_UNCERTAIN']) {
      answer = { ok: false, code };
      await assert.rejects(submitBooking(booking), (error) => error instanceof BookingError && error.code === code);
    }
    globalThis.fetch = async () => ({ ok: false });
    await assert.rejects(submitBooking(booking));
    globalThis.fetch = async () => { throw new TypeError('Network failure'); };
    await assert.rejects(submitBooking(booking));
  } finally { globalThis.fetch = originalFetch; }
});
