(function () {
  function syncChromeHeights() {
    var notice = document.querySelector('.site-notice');
    var height = notice ? notice.getBoundingClientRect().height : 0;
    document.documentElement.style.setProperty('--site-notice-height', height + 'px');
    var header = document.querySelector('header');
    var mobileNav = document.getElementById('navMobile');
    if (header && mobileNav) {
      var chromeBottom = header.getBoundingClientRect().bottom;
      mobileNav.style.setProperty('--chrome-top', chromeBottom + 'px');
    }
  }

  function bindSiteNotice() {
    var notice = document.getElementById('siteNotice');
    if (!notice) return;
    notice.addEventListener('toggle', function () {
      syncChromeHeights();
      var label = notice.querySelector('.site-notice-toggle-label');
      if (label) label.textContent = notice.open ? 'Less info' : 'More info';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      syncChromeHeights();
      bindSiteNotice();
    });
  } else {
    syncChromeHeights();
    bindSiteNotice();
  }

  window.addEventListener('resize', syncChromeHeights);
  window.syncChromeHeights = syncChromeHeights;
})();
