document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.newsletter-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const strip = form.closest('.newsletter-strip');
      const callbackName = 'mc_cb_' + Date.now();
      const params = new URLSearchParams(new FormData(form));
      params.set('c', callbackName);
      const url = form.action.replace('/post?', '/post-json?') + '&' + params.toString();

      const script = document.createElement('script');

      window[callbackName] = function (response) {
        delete window[callbackName];
        script.remove();

        if (response.result === 'success') {
          strip.innerHTML =
            '<p class="newsletter-eyebrow">You\'re in</p>' +
            '<h2 class="newsletter-title">Thanks for subscribing</h2>' +
            '<p class="newsletter-sub">We\'ll be in touch soon.</p>';
        } else {
          const existing = strip.querySelector('.newsletter-error');
          if (existing) existing.remove();
          const msg = (response.msg || 'Something went wrong — please try again.')
            .replace(/<[^>]*>/g, '')
            .replace(/^\d+ - /, '');
          const err = document.createElement('p');
          err.className = 'newsletter-error';
          err.textContent = msg;
          form.before(err);
        }
      };

      script.src = url;
      document.body.appendChild(script);
    });
  });
});
