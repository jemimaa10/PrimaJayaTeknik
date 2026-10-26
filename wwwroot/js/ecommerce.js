// Shared buyer-page AJAX layer. Every buyer action posts through ec.post with the antiforgery
// header and X-Requested-With: fetch; the server answers an AjaxEnvelope whose html map swaps
// [data-ec-region] blocks in place and whose data.redirect moves the page.
(function () {
  var rvt = document.querySelector('meta[name="rvt"]');
  var token = rvt ? rvt.getAttribute('content') : '';
  var toastRegion = null;

  function isLocalPath(p) { return typeof p === 'string' && p.charAt(0) === '/' && p.charAt(1) !== '/' && p.charAt(1) !== '\\'; }

  var ec = {
    post: function (url, body, opts) {
      opts = opts || {};
      // Only a same-origin relative path may carry the antiforgery token ("/x", never "//host" or "/\\host").
      if (!isLocalPath(url)) return Promise.reject(new Error('ec.post: url harus relatif'));
      var init = { method: 'POST', credentials: 'same-origin', headers: { 'X-Requested-With': 'fetch', 'RequestVerificationToken': token, 'Accept': 'application/json' } };
      if (body instanceof FormData) { init.body = body; }
      // Form-encoded, not JSON: the controllers bind the same way for a fetch as for a plain form post.
      else { var params = new URLSearchParams(); Object.keys(body || {}).forEach(function (k) { if (body[k] !== null && body[k] !== undefined) params.append(k, body[k]); }); init.body = params; }
      return fetch(url, init).then(function (res) {
        if (res.status === 401) { window.location.href = '/akun/masuk?returnUrl=' + encodeURIComponent(window.location.pathname + window.location.search); return new Promise(function () {}); }
        if (res.status === 429) {
          var retry = parseInt(res.headers.get('Retry-After') || '60', 10);
          return res.json().catch(function () { return {}; }).then(function (j) {
            ec.toast(j.message || 'Terlalu banyak permintaan, coba lagi sebentar.', 'warning');
            var controls = (opts.root || document).querySelectorAll('[data-ec-action], [data-ec-stepper] button, [data-ec-form] button[type=submit]');
            controls.forEach(function (c) { ec.busy(c, true); });
            setTimeout(function () { controls.forEach(function (c) { ec.busy(c, false); }); }, retry * 1000);
            throw { handled: true };
          });
        }
        // A filter answered with a redirect (e.g. store inactive): follow it when it stays on this origin.
        if (res.redirected && new URL(res.url).origin === window.location.origin) { window.location.href = res.url; return new Promise(function () {}); }
        if ((res.headers.get('Content-Type') || '').indexOf('application/json') < 0) { ec.toast('Permintaan gagal (HTTP ' + res.status + ')', 'danger'); throw { handled: true }; }
        return res.json();
      }).then(function (json) {
        if (json && json.html) Object.keys(json.html).forEach(function (name) { ec.region(name, json.html[name]); });
        // A gateway hop first: the provider's absolute https page (or the loopback Development stub), same
        // trust as the old 302 to it. Anything else falls through to the local redirect the server sends beside it.
        var p = json && json.data && json.data.paymentUrl;
        if (typeof p === 'string' && (/^https:\/\//i.test(p) || /^http:\/\/localhost(:\d+)?\//i.test(p))) { window.location.href = p; return new Promise(function () {}); }
        if (json && json.data && isLocalPath(json.data.redirect)) { window.location.href = json.data.redirect; return new Promise(function () {}); }
        return json;
      }, function (err) {
        if (err && err.handled) throw err;
        ec.toast('Koneksi bermasalah, coba lagi.', 'danger');
        throw err;
      });
    },
    debounce: function (fn, ms) { var t; return function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms || 400); }; },
    busy: function (el, on) { if (!el) return; el.toggleAttribute('disabled', !!on); el.setAttribute('aria-busy', on ? 'true' : 'false'); el.classList.toggle('is-busy', !!on); },
    toast: function (message, kind) {
      if (!toastRegion) {
        toastRegion = document.createElement('div');
        toastRegion.className = 'ec-toast';
        toastRegion.setAttribute('aria-live', 'polite');
        document.body.appendChild(toastRegion);
      }
      var el = document.createElement('div');
      el.className = 'toast align-items-center border-0 ec-toast-item is-' + (kind || 'info');
      el.setAttribute('role', 'status');
      el.innerHTML = '<div class="d-flex"><div class="toast-body"></div><button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Tutup"></button></div>';
      el.querySelector('.toast-body').textContent = message;
      toastRegion.appendChild(el);
      var t = bootstrap.Toast.getOrCreateInstance(el, { delay: 4000 });
      el.addEventListener('hidden.bs.toast', function () { el.remove(); });
      t.show();
    },
    modal: function (id) { var el = document.getElementById(id); return el ? bootstrap.Modal.getOrCreateInstance(el) : null; },
    region: function (name, html) {
      var target = document.querySelector('[data-ec-region="' + name + '"]');
      if (!target) return;
      var tpl = document.createElement('template'); tpl.innerHTML = html.trim();
      var next = tpl.content.firstElementChild;
      if (!next) { target.innerHTML = html; ec.bind(target); return; }
      target.replaceWith(next);
      // Markup parsed through a <template> never runs its <script>s; a partial's own small script
      // (payment polling, copy button, file name) has to run again on the swapped-in copy.
      next.querySelectorAll('script').forEach(function (old) { var s = document.createElement('script'); s.textContent = old.textContent; old.replaceWith(s); });
      ec.bind(next);
    },
    badge: function (count) {
      document.querySelectorAll('[data-ec-cart-badge]').forEach(function (b) { (b.querySelector('[data-ec-cart-count]') || b).textContent = count; b.hidden = !(count > 0); });
    },
    bind: function (root) {
      root = root || document;
      // steppers
      root.querySelectorAll('[data-ec-stepper]').forEach(function (s) {
        if (s.dataset.ecBound) return; s.dataset.ecBound = '1';
        var input = s.querySelector('input'), dec = s.querySelector('[data-ec-dec]'), inc = s.querySelector('[data-ec-inc]');
        // Only a form marked data-ec-submit-on-change posts as the quantity moves (the cart row); the
        // add-to-cart stepper just counts until its button is pressed.
        var send = ec.debounce(function () { var form = s.closest('[data-ec-form][data-ec-submit-on-change]'); if (form) submitForm(form); }, 400);
        // Clamp, reflect, and post only when the quantity really changed; a click at the bound spends no permit.
        // Bounds are read on every call: the add-to-cart panel rewrites data-max when the variant changes.
        // quiet: reflect only -- binding a rendered row must never post (the server judges stock at ubah/checkout).
        function set(v, quiet) {
          var min = parseInt(s.dataset.min || '1', 10), max = parseInt(s.dataset.max || '9999', 10);
          var cur = parseInt(input.value, 10) || min;
          if (isNaN(v)) v = cur;
          v = Math.min(max, Math.max(min, v));
          input.value = v; dec.disabled = v <= min; inc.disabled = v >= max;
          if (!quiet && v !== cur) send();
        }
        dec.addEventListener('click', function () { set(parseInt(input.value, 10) - 1); });
        inc.addEventListener('click', function () { set(parseInt(input.value, 10) + 1); });
        input.addEventListener('change', function () { set(parseInt(input.value, 10)); });
        set(parseInt(input.value, 10), true);
      });
      // forms
      root.querySelectorAll('[data-ec-form]').forEach(function (form) {
        if (form.dataset.ecBound) return; form.dataset.ecBound = '1';
        form.addEventListener('submit', function (e) { e.preventDefault(); submitForm(form, e.submitter); });
        // data-ec-submit-on-change: a radio card (address, shipping, payment) posts as soon as it is picked.
        if (form.hasAttribute('data-ec-submit-on-change')) form.querySelectorAll('input[type=radio]').forEach(function (r) { r.addEventListener('change', function () { submitForm(form); }); });
      });
      // countdowns: data-ec-countdown data-expires="<ISO UTC>" -> "2 jam 05 menit" / "Kedaluwarsa"
      root.querySelectorAll('[data-ec-countdown]').forEach(function (el) {
        if (el.dataset.ecBound) return; el.dataset.ecBound = '1';
        var expires = new Date(el.dataset.expires).getTime();
        (function tick() {
          if (!el.isConnected) return;
          var left = expires - Date.now();
          if (isNaN(left) || left <= 0) { el.textContent = 'Kedaluwarsa'; return; }
          var minutes = Math.floor(left / 60000), hours = Math.floor(minutes / 60);
          el.textContent = hours + ' jam ' + (minutes % 60 < 10 ? '0' : '') + (minutes % 60) + ' menit';
          setTimeout(tick, 1000);
        })();
      });
      // confirm buttons: data-ec-confirm="Hapus produk ini dari keranjang?"
      root.querySelectorAll('[data-ec-confirm]').forEach(function (b) {
        if (b.dataset.ecBound) return; b.dataset.ecBound = '1';
        b.addEventListener('click', function (e) { if (!window.confirm(b.dataset.ecConfirm)) e.preventDefault(); });
      });
    }
  };

  // submitter: the button that sent the form, when one did; its name/value rides along (BuyNow).
  function submitForm(form, submitter) {
    var btn = submitter || form.querySelector('button[type=submit]');
    // Read the fields before the button is disabled: a disabled submitter drops out of the form data.
    var data = new FormData(form, submitter || undefined);
    var body = form.enctype === 'multipart/form-data' ? data : Object.fromEntries(data.entries());
    ec.busy(btn, true);
    ec.post(form.getAttribute('action'), body, { root: form }).then(function (json) {
      if (!json) return;
      if (json.message) { var slot = form.querySelector('[data-ec-message]'); if (slot && !json.success) { slot.textContent = json.message; slot.hidden = false; } else ec.toast(json.message, json.success ? 'success' : 'danger'); }
      if (json.data && typeof json.data.cartCount === 'number') ec.badge(json.data.cartCount);
      if (form.dataset.ecCloseModal && json.success) {
        var modalEl = document.getElementById(form.dataset.ecCloseModal), m = ec.modal(form.dataset.ecCloseModal);
        if (m) {
          // The opener usually vanished with the region swap, so focus lands on a swapped region (else main).
          var names = Object.keys(json.html || {});
          modalEl.addEventListener('hidden.bs.modal', function () {
            var target = names.map(function (n) { return document.querySelector('[data-ec-region="' + n + '"]'); }).filter(Boolean)[0] || document.querySelector('main');
            if (target) { target.setAttribute('tabindex', '-1'); target.focus(); }
          }, { once: true });
          m.hide(); form.reset();
        }
      }
    }).catch(function () {}).finally(function () { ec.busy(btn, false); });
  }

  window.ec = ec;
  document.addEventListener('DOMContentLoaded', function () { ec.bind(document); });
})();
