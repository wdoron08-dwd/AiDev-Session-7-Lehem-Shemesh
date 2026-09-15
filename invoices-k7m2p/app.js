/* לחם ושמש — קליטת חשבוניות
 *
 * The page never waits. It uploads, gets a job id back, and asks "done yet?"
 * repeatedly until there is an answer or until it gives up. Each invoice in a
 * batch carries its own state, its own poll budget and its own retry — a batch
 * can hold a success, a failure and a timeout at the same time.
 *
 * The photo only exists here and, after upload, in Drive. n8n keeps no state
 * between the submit and status executions, so the submit reply hands back a
 * fileId that we send on every poll; that is how the status branch gets the
 * image back to read. See n8n/README.md.
 */

(function () {
  'use strict';

  var API = 'https://dwdai.app.n8n.cloud/webhook';
  var SUBMIT = API + '/parse-submit';
  var STATUS = API + '/parse-status';
  var NOTIFY = API + '/invoice-notify';

  var MAX_FILES = 10;
  var STORE_KEY = 'lehem-invoices-v1';

  // Poll budget. A one-page invoice lands in ~15s; a long PDF takes minutes,
  // so the budget scales with page count once LlamaParse reports one, and the
  // interval eases off rather than hammering every 3s for ten minutes.
  var POLL_START = 3000;
  var POLL_MAX = 10000;
  var BUDGET_MS = 3 * 60 * 1000;          // a single page gets three minutes
  var BUDGET_PER_PAGE_MS = 20 * 1000;     // each extra page buys twenty seconds
  var BUDGET_CEILING_MS = 20 * 60 * 1000;

  var STEPS = ['נשלח', 'נקרא', 'מחלץ שדות', 'נשמר'];

  var jobs = [];
  var notified = false;

  // ── tiny helpers ───────────────────────────────────────
  function $(id) { return document.getElementById(id); }
  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function text(s) { return document.createTextNode(s == null ? '' : String(s)); }

  // A field that was not read must never render as 0.00 — a fabricated zero in
  // an amount column is exactly what this client is paying to avoid.
  function money(v) {
    if (v === null || v === undefined || v === '') return 'לא נקרא';
    var n = Number(v);
    if (!isFinite(n)) return 'לא נקרא';
    return n.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₪';
  }

  function store() {
    try {
      var keep = jobs.filter(function (j) { return j.jobId && !j.settled; })
        .map(function (j) {
          return { jobId: j.jobId, fileId: j.fileId, name: j.name, started: j.started, pages: j.pages };
        });
      if (keep.length) localStorage.setItem(STORE_KEY, JSON.stringify(keep));
      else localStorage.removeItem(STORE_KEY);
    } catch (e) { /* private window, blocked storage — the email is the real receipt */ }
  }

  function restore() {
    var raw;
    try { raw = localStorage.getItem(STORE_KEY); } catch (e) { return; }
    if (!raw) return;
    var saved;
    try { saved = JSON.parse(raw); } catch (e) { return; }
    if (!saved || !saved.length) return;

    saved.forEach(function (s) {
      var job = newJob(null, s.name);
      job.jobId = s.jobId;
      job.fileId = s.fileId;
      job.started = s.started || Date.now();
      job.pages = s.pages || 1;
      job.step = 1;
      setState(job, 'working', 'ממשיכים לבדוק');
      poll(job, POLL_START);
    });
    if (jobs.length) {
      var box = $('leave-note');
      box.textContent = jobs.length === 1
        ? 'חשבונית אחת עדיין בעיבוד — ממשיכים לבדוק. המייל יגיע בכל מקרה.'
        : 'מצאנו ' + jobs.length + ' חשבוניות שעדיין בעיבוד — ממשיכים לבדוק. המייל יגיע בכל מקרה.';
      box.hidden = false;
      render();
    }
  }

  function note(msg, kind) {
    var box = kind === 'info' ? $('leave-note') : $('msg');
    if (!msg) { box.hidden = true; return; }
    box.textContent = msg;
    box.hidden = false;
  }

  // ── job model ──────────────────────────────────────────
  function newJob(file, name) {
    var job = {
      id: 'j' + Date.now() + Math.random().toString(36).slice(2, 7),
      file: file,
      name: name || (file && file.name) || 'חשבונית',
      state: 'queued',
      label: 'ממתין',
      step: 0,
      jobId: null,
      fileId: null,
      fields: null,
      error: null,
      pages: 1,
      started: 0,
      settled: false,
      timer: null
    };
    jobs.push(job);
    return job;
  }

  function setState(job, state, label) {
    job.state = state;
    job.label = label;
    if (state === 'ok' || state === 'check' || state === 'err' || state === 'timeout') {
      job.settled = true;
      if (job.timer) { clearTimeout(job.timer); job.timer = null; }
    }
    render();
    store();
    maybeFinish();
  }

  function budgetFor(job) {
    var ms = BUDGET_MS + Math.max(0, (job.pages || 1) - 1) * BUDGET_PER_PAGE_MS;
    return Math.min(ms, BUDGET_CEILING_MS);
  }

  // ── upload ─────────────────────────────────────────────
  function upload(job) {
    job.started = Date.now();
    job.step = 0;
    setState(job, 'working', 'מעלה');

    var fd = new FormData();
    fd.append('document', job.file, job.name);
    fd.append('fileName', job.name);
    fd.append('tier', 'cost_effective');

    fetch(SUBMIT, { method: 'POST', body: fd })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        var d = Array.isArray(data) ? data[0] : data;
        if (!d || !d.jobId) throw new Error('no job id');
        job.jobId = d.jobId;
        job.fileId = d.fileId || null;
        job.step = 1;
        setState(job, 'working', STEPS[1]);
        poll(job, POLL_START);
      })
      .catch(function () {
        job.error = 'ההעלאה נכשלה. בדקו את החיבור לאינטרנט ונסו שוב.';
        setState(job, 'err', 'נכשל');
      });
  }

  // ── poll ───────────────────────────────────────────────
  function poll(job, wait) {
    job.timer = setTimeout(function () {
      if (job.settled) return;

      if (Date.now() - job.started > budgetFor(job)) {
        job.error = 'העיבוד נמשך יותר מהצפוי. הוא ממשיך לרוץ ברקע — אפשר להמשיך להמתין.';
        setState(job, 'timeout', 'לא הסתיים בזמן');
        return;
      }

      fetch(STATUS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.jobId, fileId: job.fileId })
      })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then(function (data) {
          var d = Array.isArray(data) ? data[0] : data;
          if (!d) throw new Error('empty');

          if (d.pages) job.pages = d.pages;

          if (!d.done) {
            job.step = 2;
            setState(job, 'working', STEPS[2]);
            poll(job, Math.min(wait * 1.4, POLL_MAX));
            return;
          }

          if (d.status === 'COMPLETED' && d.fields) {
            job.fields = d.fields;
            job.step = 4;
            var flagged = d.fields.row_status && d.fields.row_status !== 'אושר אוטומטית';
            setState(job, flagged ? 'check' : 'ok', flagged ? 'נשמר · לבדיקה' : 'נשמר');
          } else {
            job.error = d.message || 'לא הצלחנו לקרוא את החשבונית.';
            setState(job, 'err', 'נכשל');
          }
        })
        .catch(function () {
          // one hiccup should not kill the job — keep polling within budget
          poll(job, Math.min(wait * 1.6, POLL_MAX));
        });
    }, wait);
  }

  // ── retries ────────────────────────────────────────────
  function retrySame(job) {
    if (!job.file) return;
    job.settled = false;
    job.error = null;
    job.fields = null;
    notified = false;
    $('summary').hidden = true;
    upload(job);
  }

  function keepWaiting(job) {
    // The job is still running in n8n — resume polling, never re-upload,
    // or the same invoice is parsed twice and written twice.
    job.settled = false;
    job.error = null;
    job.started = Date.now();
    notified = false;
    $('summary').hidden = true;
    setState(job, 'working', 'ממשיכים לבדוק');
    poll(job, POLL_START);
  }

  function reshoot(job) {
    var input = $('in-camera');
    input.onchange = function () {
      var f = input.files && input.files[0];
      input.value = '';
      input.onchange = onCamera;
      if (!f) return;
      job.file = f;
      job.name = f.name || job.name;
      retrySame(job);
    };
    input.click();
  }

  // ── render ─────────────────────────────────────────────
  function render() {
    var box = $('cards');
    box.textContent = '';
    $('list').hidden = jobs.length === 0;

    var done = jobs.filter(function (j) { return j.settled; }).length;
    $('count').textContent = jobs.length ? done + ' מתוך ' + jobs.length : '';

    jobs.forEach(function (job) {
      var card = el('div', 'card');

      var top = el('div', 'card-top');
      var nm = el('div', 'card-name');
      nm.appendChild(text(job.fields && job.fields.supplier ? job.fields.supplier : job.name));
      var st = el('span', 'card-state');
      st.setAttribute('data-state', job.state);
      st.appendChild(text(job.label));
      top.appendChild(nm);
      top.appendChild(st);
      card.appendChild(top);

      if (job.state === 'working' || job.state === 'queued') {
        var steps = el('div', 'steps');
        for (var i = 0; i < STEPS.length; i++) {
          var s = el('div', 'step');
          if (i < job.step) s.className = 'step done';
          else if (i === job.step) s.className = 'step now';
          steps.appendChild(s);
        }
        card.appendChild(steps);
        var lbl = el('p', 'step-label');
        lbl.appendChild(text(STEPS[Math.min(job.step, STEPS.length - 1)] + '…'));
        card.appendChild(lbl);
      }

      if (job.fields) {
        var dl = el('dl', 'fields');
        addField(dl, 'ספק', job.fields.supplier || '—');
        addField(dl, 'תאריך', job.fields.invoice_date || '—');
        if (job.fields.invoice_number) addField(dl, 'מספר חשבונית', job.fields.invoice_number);
        addField(dl, 'לפני מע״מ', money(job.fields.amount_before_vat));
        addField(dl, 'מע״מ', money(job.fields.vat_amount));
        addField(dl, 'סה״כ', money(job.fields.amount_total), true);
        if (job.fields.service_type) addField(dl, 'עבור', job.fields.service_type);
        card.appendChild(dl);

        if (job.fields.row_notes) {
          var n = el('div', 'card-note');
          n.appendChild(text('לבדיקה · ' + job.fields.row_notes));
          card.appendChild(n);
        }
      }

      if (job.error) {
        var er = el('p', 'card-err');
        er.appendChild(text(job.error));
        card.appendChild(er);
      }

      if (job.state === 'err' || job.state === 'timeout') {
        var acts = el('div', 'card-actions');
        if (job.state === 'timeout') {
          acts.appendChild(button('המשיכו להמתין', 'btn-primary', function () { keepWaiting(job); }));
        }
        if (job.file) {
          acts.appendChild(button('נסו שוב', 'btn-secondary', function () { retrySame(job); }));
          acts.appendChild(button('צלמו מחדש', 'btn-secondary', function () { reshoot(job); }));
        }
        card.appendChild(acts);
      }

      box.appendChild(card);
    });
  }

  function addField(dl, label, value, isTotal) {
    var row = el('div', 'field-row' + (isTotal ? ' total' : ''));
    var dt = el('dt'); dt.appendChild(text(label));
    var dd = el('dd'); dd.appendChild(text(value));
    row.appendChild(dt); row.appendChild(dd);
    dl.appendChild(row);
  }

  function button(label, cls, fn) {
    var b = el('button', 'btn ' + cls);
    b.type = 'button';
    b.appendChild(text(label));
    b.addEventListener('click', fn);
    return b;
  }

  // ── session end ────────────────────────────────────────
  function maybeFinish() {
    if (!jobs.length || notified) return;
    if (!jobs.every(function (j) { return j.settled; })) return;

    notified = true;
    $('leave-note').hidden = true;

    var filed = jobs.filter(function (j) { return j.state === 'ok' || j.state === 'check'; });
    var failed = jobs.filter(function (j) { return j.state === 'err' || j.state === 'timeout'; });

    var title = $('summary-title');
    var body = $('summary-text');
    if (failed.length === 0) {
      title.textContent = filed.length === 1 ? 'החשבונית נקלטה' : 'נקלטו ' + filed.length + ' חשבוניות';
      body.textContent = 'מייל עם הפירוט בדרך אליכם.';
    } else if (filed.length === 0) {
      title.textContent = filed.length === 0 && jobs.length === 1 ? 'החשבונית לא נקלטה' : 'אף חשבונית לא נקלטה';
      body.textContent = 'אפשר לנסות שוב מכאן. שלחנו לכם מייל על זה.';
    } else {
      title.textContent = 'נקלטו ' + filed.length + ' מתוך ' + jobs.length + ' חשבוניות';
      body.textContent = 'מה שלא נקלט מסומן למעלה ואפשר לנסות שוב. מייל עם הפירוט בדרך.';
    }
    $('summary').hidden = false;

    // one email per session, always
    var payload = jobs.map(function (j) {
      if (j.state === 'ok' || j.state === 'check') {
        return {
          status: 'COMPLETED',
          supplier: j.fields.supplier,
          invoice_date: j.fields.invoice_date,
          amount_total: j.fields.amount_total,
          row_status: j.fields.row_status,
          row_notes: j.fields.row_notes,
          file_name: j.name
        };
      }
      return {
        status: j.state === 'timeout' ? 'TIMEOUT' : 'FAILED',
        file_name: j.name,
        message: j.error || ''
      };
    });

    fetch(NOTIFY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoices: payload, pageUrl: location.href })
    }).catch(function () { /* the sheet and Drive are already written */ });
  }

  // ── picking files ──────────────────────────────────────
  function accept(files) {
    var list = Array.prototype.slice.call(files || []);
    if (!list.length) return;

    var active = jobs.filter(function (j) { return !j.settled; }).length;
    if (list.length + active > MAX_FILES) {
      note('אפשר להעלות עד ' + MAX_FILES + ' קבצים בבת אחת. בחרתם ' + list.length + '.');
      return;
    }
    note('');

    // a fresh batch after a finished one starts a new session
    if (jobs.length && jobs.every(function (j) { return j.settled; })) {
      jobs = [];
      notified = false;
      $('summary').hidden = true;
    }

    list.forEach(function (f) { upload(newJob(f)); });
    $('leave-note').hidden = false;
    render();
  }

  function onCamera() {
    var input = $('in-camera');
    accept(input.files);
    input.value = '';
  }

  function onGallery() {
    var input = $('in-gallery');
    accept(input.files);
    input.value = '';
  }

  // ── wiring ─────────────────────────────────────────────
  $('btn-camera').addEventListener('click', function () { $('in-camera').click(); });
  $('btn-gallery').addEventListener('click', function () { $('in-gallery').click(); });
  $('in-camera').addEventListener('change', onCamera);
  $('in-gallery').addEventListener('change', onGallery);
  $('btn-again').addEventListener('click', function () { $('in-gallery').click(); });

  var pick = $('pick');
  ['dragenter', 'dragover'].forEach(function (ev) {
    pick.addEventListener(ev, function (e) { e.preventDefault(); pick.classList.add('dragover'); });
  });
  ['dragleave', 'drop'].forEach(function (ev) {
    pick.addEventListener(ev, function (e) { e.preventDefault(); pick.classList.remove('dragover'); });
  });
  pick.addEventListener('drop', function (e) {
    if (e.dataTransfer && e.dataTransfer.files) accept(e.dataTransfer.files);
  });

  window.addEventListener('beforeunload', function (e) {
    var busy = jobs.some(function (j) { return !j.settled; });
    if (busy) { e.preventDefault(); e.returnValue = ''; }
  });

  restore();
})();
