(function () {
  var ROOMS = {
    double:          { strong: 'From $125',            span: 'Sleeps 2 · book direct' },
    triple:          { strong: 'From $165',            span: 'Sleeps 3 · book direct' },
    quad:            { strong: 'From $185',            span: 'Sleeps 4 · book direct' },
    family:          { strong: 'Sleeps 5 · From $195', span: 'per night · book direct · courtyard parking' },
    interconnecting: { strong: 'Sleeps 6 · From $295', span: 'per night · book direct · courtyard parking' }
  };

  var room = document.body.dataset.room;
  var cfg  = (room && ROOMS[room]) ? ROOMS[room] : { strong: 'From $125', span: 'per night · book direct' };

  document.body.insertAdjacentHTML('beforeend',
    '<div class="mobile-cta-bar" aria-label="Quick actions">' +
      '<a href="tel:+61755763211" class="mobile-cta-call" data-track="phone" data-source="mobile-cta" aria-label="Call (07) 5576 3211">' +
        '<span class="mobile-cta-call-icon" aria-hidden="true">📞</span>' +
        '<span class="mobile-cta-call-label">Call</span>' +
      '</a>' +
      '<div class="mobile-cta-price">' +
        '<strong>' + cfg.strong + '</strong>' +
        '<span>' + cfg.span + '</span>' +
      '</div>' +
      '<button class="mobile-cta-book" data-open-booking="mobile-cta" aria-label="Check availability and book direct from $125 per night">' +
        '<span class="mobile-cta-book-main" aria-hidden="true">BOOK</span>' +
        '<span class="mobile-cta-book-sub">NOW &#x2192;</span>' +
      '</button>' +
    '</div>'
  );
})();
