// Настройки барбершопа. Длительности и id должны совпадать с bookingSchedule.js.
const BOOKING_CONFIG = {
  timeZone: 'Europe/Moscow',
  services: {
    haircut: { title: 'Стрижка головы', minutes: 60 },
    edging: { title: 'Окантовка', minutes: 30 },
    beard: { title: 'Моделирование бороды', minutes: 30 },
    camouflage: { title: 'Камуфляж седины головы', minutes: 40 }
  },
  perMinute: 5, perDay: 30, perPhonePerDay: 2,
  retentionDays: 120
};

function doGet(e) {
  let result;
  try {
    const params = e && e.parameter ? e.parameter : {};
    if (!params.action) {
      result = { ok: true, message: 'Связь с Apps Script работает', timeZone: BOOKING_CONFIG.timeZone };
    } else if (params.action === 'slots') {
      checkBookingDate_(params.date, false);
      result = {
        ok: true, date: params.date, serviceId: params.serviceId,
        timeZone: BOOKING_CONFIG.timeZone,
        slots: getAvailableSlots(params.date, params.serviceId)
      };
    } else {
      throw new Error('Неизвестная команда');
    }
  } catch (error) {
    result = { ok: false, error: 'Не удалось получить расписание. Проверьте дату и услугу.' };
  }
  return jsonOutput_(result);
}

function doPost(e) {
  try {
    const body = e && e.postData && e.postData.contents;
    if (typeof body !== 'string' || body.length > 8192) {
      failBooking_('VALIDATION_ERROR', 'Некорректный запрос');
    }
    let data;
    try { data = JSON.parse(body); }
    catch (error) { failBooking_('VALIDATION_ERROR', 'Ожидался JSON'); }
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      failBooking_('VALIDATION_ERROR', 'Некорректный запрос');
    }
    if (data.action === 'ping') return jsonOutput_({ ok: true, message: 'POST работает', action: 'ping' });
    if (data.action !== 'book') failBooking_('VALIDATION_ERROR', 'Неизвестная команда');
    if (data.website) failBooking_('CHALLENGE_FAILED', 'Запрос отклонён');

    const properties = PropertiesService.getScriptProperties();
    // Для уже известной заявки новый CAPTCHA-токен не нужен. createBooking
    // сверит отпечаток всех полей и только вернёт/восстановит прежний результат.
    // Даже неопределённую старую попытку эта ветка не создаёт заново.
    const booking = validateBooking(data, true);
    if (properties.getProperty('BOOKING_' + booking.requestId)) {
      return jsonOutput_(createBooking(booking));
    }

    validateBooking(data, false);
    verifyBookingChallenge_(data.turnstileToken, booking.requestId);
    enforceBookingLimits_(booking, data.turnstileToken);
    return jsonOutput_(createBooking(booking));
  } catch (error) {
    return jsonOutput_(publicBookingError_(error));
  }
}

function jsonOutput_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
function failBooking_(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}
function publicBookingError_(error) {
  let code = error.code;
  const known = {
    'Это время уже занято или прошло. Выберите другое': 'SLOT_UNAVAILABLE',
    'Этот requestId уже использован для другой заявки': 'REQUEST_MISMATCH',
    'Статус предыдущей заявки требует проверки у мастера': 'BOOKING_UNCERTAIN',
    'Запись была изменена. Уточните время у мастера': 'BOOKING_UNCERTAIN',
    'Сервис занят. Повторите попытку с тем же requestId': 'SERVER_ERROR',
    'Календарь не найден': 'SERVICE_UNAVAILABLE'
  };
  if (!code) code = known[error.message] || 'SERVER_ERROR';
  // Не раскрываем детали исключений Google, ключи или входные данные.
  return { ok: false, code: code, error: 'Заявка не подтверждена. Код: ' + code };
}
function sha256_(text) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8)
    .map((byte) => (byte & 255).toString(16).padStart(2, '0')).join('');
}

function verifyBookingChallenge_(token, requestId) {
  if (typeof token !== 'string' || !token || token.length > 2048) {
    failBooking_('CHALLENGE_FAILED', 'Пройдите проверку безопасности');
  }
  const properties = PropertiesService.getScriptProperties();
  const secret = properties.getProperty('TURNSTILE_SECRET_KEY');
  const hosts = (properties.getProperty('BOOKING_ALLOWED_HOSTNAMES') || '')
    .split(',').map((host) => host.trim().toLowerCase()).filter(Boolean);
  // Официальные dummy-ключи подходят для локальных тестов, но не для публикации.
  if (!secret || secret.length < 20 || /^[123]x0{20,}/.test(secret) || !hosts.length) {
    failBooking_('SERVICE_UNAVAILABLE', 'Защита формы не настроена');
  }
  let response;
  // Повтор Siteverify с тем же токеном использует тот же UUID. Новый токен
  // получает другой UUID, даже если это повтор прежней заявки после ошибки.
  const hash = sha256_(requestId + ':' + token);
  const verificationId = hash.slice(0, 8) + '-' + hash.slice(8, 12) + '-4' +
    hash.slice(13, 16) + '-8' + hash.slice(17, 20) + '-' + hash.slice(20, 32);
  try {
    response = UrlFetchApp.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'post', muteHttpExceptions: true,
      payload: { secret: secret, response: token, idempotency_key: verificationId }
    });
  } catch (error) { failBooking_('SERVICE_UNAVAILABLE', 'Проверка безопасности недоступна'); }
  if (response.getResponseCode() !== 200) failBooking_('SERVICE_UNAVAILABLE', 'Проверка безопасности недоступна');
  let verification;
  try { verification = JSON.parse(response.getContentText()); }
  catch (error) { failBooking_('SERVICE_UNAVAILABLE', 'Неверный ответ проверки'); }
  // Токен должен быть выдан нашему сайту и именно для формы записи.
  if (verification.success !== true || !hosts.includes(verification.hostname) || verification.action !== 'booking') {
    failBooking_('CHALLENGE_FAILED', 'Проверка безопасности не пройдена');
  }
}

function enforceBookingLimits_(booking, token) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(3000)) failBooking_('SERVER_ERROR', 'Сервис занят');
  try {
    const properties = PropertiesService.getScriptProperties();
    const now = Date.now();
    // Удаляем только собственные старые записи; CALENDAR_ID и ключи не затрагиваем.
    const all = properties.getProperties();
    Object.keys(all).forEach((key) => {
      if (!/^BOOKING_[0-9a-f-]{36}$/.test(key) && !key.startsWith('TURNSTILE_USED_')) return;
      const saved = JSON.parse(all[key]);
      const ttl = key.startsWith('TURNSTILE_USED_') ? 10 * 60000 : BOOKING_CONFIG.retentionDays * 86400000;
      if (Number.isFinite(saved.createdAt) && now - saved.createdAt > ttl) properties.deleteProperty(key);
    });

    const usedKey = 'TURNSTILE_USED_' + sha256_(token);
    const used = properties.getProperty(usedKey);
    if (used) {
      if (JSON.parse(used).requestId !== booking.requestId) {
        failBooking_('CHALLENGE_FAILED', 'Токен уже использован другой заявкой');
      }
      return; // Повтор той же попытки не расходует лимит ещё раз.
    }
    const day = Utilities.formatDate(new Date(now), BOOKING_CONFIG.timeZone, 'yyyy-MM-dd');
    const minute = Math.floor(now / 60000);
    let rate = JSON.parse(properties.getProperty('PUBLIC_BOOKING_RATE') || 'null');
    if (!rate || rate.day !== day) rate = { day: day, minute: minute, minuteCount: 0, total: 0, phones: {} };
    if (rate.minute !== minute) { rate.minute = minute; rate.minuteCount = 0; }
    const phoneKey = sha256_(booking.phone);
    if (rate.minuteCount >= BOOKING_CONFIG.perMinute || rate.total >= BOOKING_CONFIG.perDay ||
        (rate.phones[phoneKey] || 0) >= BOOKING_CONFIG.perPhonePerDay) {
      failBooking_('RATE_LIMITED', 'Превышен лимит попыток');
    }
    rate.minuteCount++;
    rate.total++;
    rate.phones[phoneKey] = (rate.phones[phoneKey] || 0) + 1;
    properties.setProperty('PUBLIC_BOOKING_RATE', JSON.stringify(rate));
    // Связываем одноразовый токен с requestId сами: у Cloudflare защита от
    // повторного использования токена может сработать не мгновенно.
    properties.setProperty(usedKey, JSON.stringify({ requestId: booking.requestId, createdAt: now }));
  } finally { lock.releaseLock(); }
}

function checkBookingDate_(date, allowPast) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    failBooking_('VALIDATION_ERROR', 'Дата должна иметь формат YYYY-MM-DD');
  }
  const parsed = new Date(date + 'T12:00:00+03:00');
  if (Number.isNaN(parsed.getTime()) || Utilities.formatDate(parsed, BOOKING_CONFIG.timeZone, 'yyyy-MM-dd') !== date) {
    failBooking_('VALIDATION_ERROR', 'Некорректная дата');
  }
  const today = Utilities.formatDate(new Date(), BOOKING_CONFIG.timeZone, 'yyyy-MM-dd');
  const [year, month] = today.split('-').map(Number);
  const lastDay = Utilities.formatDate(new Date(Date.UTC(year, month + 2, 0)), 'UTC', 'yyyy-MM-dd');
  if ((!allowPast && date < today) || date > lastDay) failBooking_('VALIDATION_ERROR', 'Дата вне расписания');
}

function validateBooking(data, allowPast) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) failBooking_('VALIDATION_ERROR', 'Некорректная заявка');
  if (!Object.prototype.hasOwnProperty.call(BOOKING_CONFIG.services, data.serviceId)) {
    failBooking_('VALIDATION_ERROR', 'Неизвестная услуга');
  }
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  if (!name || name.length > 80 || /[\r\n]/.test(name)) failBooking_('VALIDATION_ERROR', 'Проверьте имя');
  const rawPhone = typeof data.phone === 'string' ? data.phone.trim() : '';
  const phone = rawPhone.replace(/\D/g, '');
  if (!/^\+?[\d ()-]{10,30}$/.test(rawPhone) || phone.length < 10 || phone.length > 15) {
    failBooking_('VALIDATION_ERROR', 'Проверьте телефон');
  }
  checkBookingDate_(data.date, Boolean(allowPast));
  if (typeof data.time !== 'string' || !/^1[0-8]:00$/.test(data.time)) failBooking_('VALIDATION_ERROR', 'Проверьте время');
  const start = new Date(data.date + 'T' + data.time + ':00+03:00');
  if (!allowPast && start <= new Date()) failBooking_('VALIDATION_ERROR', 'Выберите будущее время');
  if (typeof data.requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.requestId)) {
    failBooking_('VALIDATION_ERROR', 'Некорректный requestId');
  }
  return { serviceId: data.serviceId, name: name, phone: phone, date: data.date, time: data.time, requestId: data.requestId.toLowerCase() };
}

function getAvailableSlots(date, serviceId) {
  checkBookingDate_(date, true);
  if (!Object.prototype.hasOwnProperty.call(BOOKING_CONFIG.services, serviceId)) throw new Error('Неизвестная услуга');
  const duration = BOOKING_CONFIG.services[serviceId].minutes;
  const opening = new Date(date + 'T10:00:00+03:00');
  const closing = new Date(date + 'T19:00:00+03:00');
  const calendarId = PropertiesService.getScriptProperties().getProperty('CALENDAR_ID');
  const calendar = calendarId && CalendarApp.getCalendarById(calendarId);
  if (!calendar) throw new Error('Календарь не найден');
  const busy = calendar.getEvents(opening, closing).filter((event) =>
    event.getTransparency() !== CalendarApp.EventTransparency.TRANSPARENT
  );
  const now = new Date();
  const slots = [];
  for (let hour = 10; hour < 19; hour++) {
    const time = String(hour).padStart(2, '0') + ':00';
    const start = new Date(date + 'T' + time + ':00+03:00');
    const end = new Date(start.getTime() + duration * 60000);
    if (start <= now || end > closing) continue;
    if (!busy.some((event) => start < event.getEndTime() && end > event.getStartTime())) slots.push(time);
  }
  return slots;
}
function createBooking(data) {
  const booking = validateBooking(data, true);
  const services = BOOKING_CONFIG.services;
  const service = services[booking.serviceId];
  const properties = PropertiesService.getScriptProperties();
  const calendarId = properties.getProperty('CALENDAR_ID');
  const calendar = calendarId && CalendarApp.getCalendarById(calendarId);
  if (!calendar) throw new Error('Календарь не найден');

  const start = new Date(booking.date + 'T' + booking.time + ':00+03:00');
  const end = new Date(start.getTime() + service.minutes * 60000);
  const key = 'BOOKING_' + booking.requestId;

  // Отпечаток позволяет заметить попытку отправить другие данные с тем же ID.
  // Телефон и имя в свойствах не сохраняем, только хеш и служебные сведения.
  const fingerprint = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    JSON.stringify({ calendarId: calendarId, booking: booking }),
    Utilities.Charset.UTF_8
  ).map((byte) => (byte & 255).toString(16).padStart(2, '0')).join('');
  const marker = 'bookingRequest:' + booking.requestId + ':' + fingerprint;

  // Две заявки этого скрипта не должны одновременно пройти проверку занятости.
  // Блокировка действует на наш Apps Script, а не на ручные действия в Google.
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    throw new Error('Сервис занят. Повторите попытку с тем же requestId');
  }

  try {
    const savedText = properties.getProperty(key);
    if (savedText) {
      const saved = JSON.parse(savedText);
      if (saved.fingerprint !== fingerprint) {
        throw new Error('Этот requestId уже использован для другой заявки');
      }

      let existing = null;
      if (saved.eventId) {
        existing = calendar.getEventById(saved.eventId);
      } else {
        // Если событие создалось, но сохранение результата завершилось ошибкой,
        // находим его по метке в описании, вместо создания второго события.
        existing = calendar.getEvents(start, end).find((event) =>
          event.getDescription().split('\n').includes(marker)
        );
      }
      if (!existing) {
        // При неизвестном результате прежней попытки не создаём запись повторно.
        throw new Error('Статус предыдущей заявки требует проверки у мастера');
      }
      if (existing.getStartTime().getTime() !== start.getTime() ||
          existing.getEndTime().getTime() !== end.getTime() ||
          existing.getTransparency() === CalendarApp.EventTransparency.TRANSPARENT) {
        throw new Error('Запись была изменена. Уточните время у мастера');
      }
      properties.setProperty(key, JSON.stringify({
        fingerprint: fingerprint, eventId: existing.getId(), createdAt: saved.createdAt
      }));
      return bookingResult_(booking, existing.getId(), true);
    }

    // Список в браузере мог устареть. Повторяем проверку внутри блокировки.
    if (!getAvailableSlots(booking.date, booking.serviceId).includes(booking.time)) {
      throw new Error('Это время уже занято или прошло. Выберите другое');
    }

    // Сначала фиксируем попытку. Если Google ответит ошибкой после создания
    // события, повторный запрос будет искать его, а не создавать дубль.
    const pending = { fingerprint: fingerprint, createdAt: Date.now() };
    properties.setProperty(key, JSON.stringify(pending));
    const event = calendar.createEvent(service.title + ' — ' + booking.name, start, end, {
      description: [
        'Запись с сайта барбершопа',
        'Телефон: ' + booking.phone,
        'Услуга: ' + booking.serviceId,
        marker
      ].join('\n')
    });
    properties.setProperty(key, JSON.stringify({
      fingerprint: fingerprint, eventId: event.getId(), createdAt: pending.createdAt
    }));
    return bookingResult_(booking, event.getId(), false);
  } finally {
    // Освобождаем блокировку и при успехе, и при любой ошибке.
    lock.releaseLock();
  }
}

// В ответ не включаем имя и телефон. Это пригодится для отправки формы позже.
function bookingResult_(booking, eventId, replayed) {
  return {
    ok: true,
    replayed: replayed,
    booking: {
      eventId: eventId,
      requestId: booking.requestId,
      date: booking.date,
      time: booking.time,
      serviceId: booking.serviceId,
      timeZone: 'Europe/Moscow'
    }
  };
}


