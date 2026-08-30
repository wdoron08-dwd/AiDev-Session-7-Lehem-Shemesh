/* לחם ושמש — order form.
   Plain JS, no libraries. Computes the total and a readable order summary in
   the browser so the Sheet and both emails all receive the same clean text. */

(function () {
  'use strict';

  // Set once the n8n workflow is live. Empty = form reports it is not connected
  // yet rather than failing silently.
  var WEBHOOK_URL = '';

  var MINIMUM = 40;

  var form  = document.getElementById('order-form');
  if (!form) return;
  function fld(n) { return form.elements[n]; }

  var items    = Array.prototype.slice.call(form.querySelectorAll('.item'));
  var dateEl   = form.querySelector('[name="delivery_date"]');
  var totalEl  = form.querySelector('[data-total]');
  var totalBox = form.querySelector('[data-total-box]');
  var minNote  = form.querySelector('[data-min-note]');
  var msgEl    = form.querySelector('[data-msg]');
  var submitEl = form.querySelector('.btn-submit');

  // ── Delivery date: Sun–Fri only, tomorrow at the earliest ──────────────
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

  function firstDeliverableFrom(d) {
    var c = new Date(d);
    while (c.getDay() === 6) c.setDate(c.getDate() + 1); // 6 = Saturday
    return c;
  }

  var tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  var earliest = firstDeliverableFrom(tomorrow);
  dateEl.min   = iso(earliest);
  dateEl.value = iso(earliest);

  // ── Challah is Friday-only ─────────────────────────────────────────────
  function chosenDay() {
    if (!dateEl.value) return null;
    var parts = dateEl.value.split('-');
    return new Date(+parts[0], +parts[1] - 1, +parts[2]).getDay(); // 5 = Friday
  }

  function syncFridayOnly() {
    var friday = chosenDay() === 5;
    items.forEach(function (li) {
      if (!li.hasAttribute('data-friday-only')) return;
      var input = li.querySelector('input');
      var steps = li.querySelectorAll('.step');
      if (friday) {
        li.removeAttribute('data-disabled');
        input.disabled = false;
        Array.prototype.forEach.call(steps, function (b) { b.disabled = false; });
      } else {
        li.setAttribute('data-disabled', '');
        input.value = 0;
        input.disabled = true;
        Array.prototype.forEach.call(steps, function (b) { b.disabled = true; });
      }
    });
  }

  // ── Steppers ───────────────────────────────────────────────────────────
  form.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.step') : null;
    if (!btn) return;
    var input = btn.parentNode.querySelector('input');
    var next  = (parseInt(input.value, 10) || 0) + parseInt(btn.dataset.step, 10);
    input.value = Math.min(10, Math.max(0, next));
    recalc();
  });

  form.addEventListener('input', function (e) {
    if (e.target === dateEl) { syncFridayOnly(); }
    recalc();
  });

  // ── Total + summary ────────────────────────────────────────────────────
  function lines() {
    var out = [];
    items.forEach(function (li) {
      var input = li.querySelector('input');
      var qty   = parseInt(input.value, 10) || 0;
      if (qty < 1) return;
      var name  = li.querySelector('.item-name').firstChild.textContent.trim();
      out.push({ name: name, qty: qty, price: +li.dataset.price, sum: qty * (+li.dataset.price) });
    });
    return out;
  }

  function recalc() {
    var sum = lines().reduce(function (a, l) { return a + l.sum; }, 0);
    totalEl.textContent = sum;

    var under = sum > 0 && sum < MINIMUM;
    if (under) {
      totalBox.setAttribute('data-under', '');
      minNote.textContent = 'מינימום הזמנה 40 ₪ — חסרים עוד ' + (MINIMUM - sum) + ' ₪';
    } else {
      totalBox.removeAttribute('data-under');
      minNote.textContent = 'מינימום הזמנה 40 ₪';
    }
    return sum;
  }

  // ── Validation ─────────────────────────────────────────────────────────
  function invalid(el, why) {
    el.setAttribute('aria-invalid', 'true');
    show('err', why);
    el.focus();
    return false;
  }

  function check() {
    Array.prototype.forEach.call(form.querySelectorAll('[aria-invalid]'), function (el) {
      el.removeAttribute('aria-invalid');
    });

    var name = fld('name').value.trim();
    if (!name) return invalid(fld('name'), 'צריך למלא שם.');

    var phone = fld('phone').value.trim();
    if (phone.replace(/\D/g, '').length < 9) return invalid(fld('phone'), 'צריך מספר טלפון תקין.');

    var email = fld('email').value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return invalid(fld('email'), 'צריך כתובת אימייל תקינה.');

    var address = fld('address').value.trim();
    if (address.length < 4) return invalid(fld('address'), 'צריך כתובת למשלוח.');

    if (!dateEl.value) return invalid(dateEl, 'צריך לבחור תאריך למשלוח.');
    if (chosenDay() === 6) return invalid(dateEl, 'אנחנו מחלקים ראשון עד שישי.');
    if (dateEl.value < dateEl.min) return invalid(dateEl, 'אפשר להזמין רק מהיום שאחרי.');

    var sum = recalc();
    if (sum === 0) { show('err', 'צריך לבחור לפחות פריט אחד.'); return false; }
    if (sum < MINIMUM) { show('err', 'מינימום הזמנה 40 ₪.'); return false; }

    return true;
  }

  function show(state, text) {
    msgEl.textContent = text;
    if (state) msgEl.setAttribute('data-state', state);
    else msgEl.removeAttribute('data-state');
  }

  // ── Submit ─────────────────────────────────────────────────────────────
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    show('', '');
    if (!check()) return;

    var ls = lines();
    var payload = {
      name:           fld('name').value.trim(),
      phone:          fld('phone').value.trim(),
      email:          fld('email').value.trim(),
      address:        fld('address').value.trim(),
      delivery_date:  dateEl.value,
      qty_country:    +fld('qty_country').value || 0,
      qty_rye:        +fld('qty_rye').value || 0,
      qty_challah:    +fld('qty_challah').value || 0,
      qty_bureka:     +fld('qty_bureka').value || 0,
      order_summary:  ls.map(function (l) { return l.name + ' ×' + l.qty; }).join(', '),
      total:          ls.reduce(function (a, l) { return a + l.sum; }, 0),
      notes:          fld('notes').value.trim(),
      submitted_at:   new Date().toISOString()
    };

    if (!WEBHOOK_URL) {
      show('err', 'הטופס עדיין לא מחובר. אפשר להתקשר אלינו ל־04-000-0000.');
      return;
    }

    submitEl.disabled = true;
    submitEl.textContent = 'שולח…';

    fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        show('ok', 'ההזמנה התקבלה. שלחנו אישור למייל, ונתראה בבוקר החלוקה.');
        form.reset();
        dateEl.value = iso(earliest);
        syncFridayOnly();
        recalc();
      })
      .catch(function () {
        show('err', 'משהו השתבש בשליחה. אפשר לנסות שוב, או להתקשר ל־04-000-0000.');
      })
      .then(function () {
        submitEl.disabled = false;
        submitEl.textContent = 'שליחת ההזמנה';
      });
  });

  syncFridayOnly();
  recalc();
})();
