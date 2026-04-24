/**
 * motion.js
 *
 * Vanilla-JS motion controller for Amigo Grill. No frameworks, no libraries.
 * Runs the seven motion layers defined in design-system/MASTER.md.
 * Enqueued via functions.php in phase 3.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /**
   * Set html.is-ready so CSS-driven hero entry (Motion 1) can play.
   * Always runs; CSS inside a prefers-reduced-motion query handles the fallback.
   */
  function markReady() {
    requestAnimationFrame(function () {
      root.classList.add('is-ready');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', markReady, { once: true });
  } else {
    markReady();
  }

  /**
   * Early return for reduced-motion users. CSS has already collapsed all reveals
   * to visible state; skipping JS avoids adding observers or listeners unnecessarily.
   */
  if (reducedMotion.matches) {
    return;
  }

  /**
   * Motion 2. Scroll-triggered reveals.
   * IntersectionObserver adds .anim-in-view once per element; then unobserves.
   */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('anim-in-view');
        io.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: '-10% 0px',
    threshold: 0.15
  });

  document.querySelectorAll('.anim-on-scroll').forEach(function (el) {
    io.observe(el);
  });

  /**
   * Marquee slow-on-hover. Per MASTER.md the animation slows rather than pauses;
   * hover adds .is-slow (duration extends from 40s to 80s). Touch devices do not
   * fire these events and the default 40s loop plays uninterrupted.
   */
  document.querySelectorAll('.marquee').forEach(function (marquee) {
    marquee.addEventListener('mouseenter', function () {
      marquee.classList.add('is-slow');
    });
    marquee.addEventListener('mouseleave', function () {
      marquee.classList.remove('is-slow');
    });
  });

  /**
   * Motion 5. Fullscreen menu overlay. Open/close with focus trap, Escape to close,
   * and focus restoration to the previously focused element.
   */
  var overlay = document.querySelector('.menu-overlay');
  var openButtons = document.querySelectorAll('.js-menu-open');
  var closeButtons = overlay ? overlay.querySelectorAll('.js-menu-close') : [];
  var lastFocus = null;

  function getFocusable(container) {
    if (!container) return [];
    return Array.prototype.slice.call(
      container.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
      )
    );
  }

  function openOverlay() {
    if (!overlay) return;
    lastFocus = document.activeElement;
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    var focusable = getFocusable(overlay);
    if (focusable.length) {
      focusable[0].focus();
    }
  }

  function closeOverlay() {
    if (!overlay) return;
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    if (lastFocus && typeof lastFocus.focus === 'function') {
      lastFocus.focus();
    }
  }

  openButtons.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      openOverlay();
    });
  });

  closeButtons.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      closeOverlay();
    });
  });

  document.addEventListener('keydown', function (e) {
    if (!overlay || !overlay.classList.contains('is-open')) return;

    if (e.key === 'Escape') {
      closeOverlay();
      return;
    }

    // Focus trap. Keep Tab navigation inside the overlay while it is open.
    if (e.key === 'Tab') {
      var focusable = getFocusable(overlay);
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  /**
   * Motion 4. Page transitions. Parchment curtain slides up on click, page loads, curtain slides off.
   * Intercepts same-origin clicks on anchors tagged data-page-transition.
   */
  var transitionPanel = document.querySelector('.page-transition');
  if (!transitionPanel) {
    transitionPanel = document.createElement('div');
    transitionPanel.className = 'page-transition';
    transitionPanel.setAttribute('aria-hidden', 'true');
    document.body.appendChild(transitionPanel);
  }

  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[data-page-transition]');
    if (!link) return;

    // Ignore modifier clicks, middle/right clicks, new-tab targets, and downloads.
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    if (typeof e.button === 'number' && e.button !== 0) return;
    if (link.target && link.target !== '_self') return;
    if (link.hasAttribute('download')) return;

    var href = link.getAttribute('href');
    if (!href || href.charAt(0) === '#') return;

    var url;
    try {
      url = new URL(href, window.location.href);
    } catch (err) {
      return;
    }
    if (url.origin !== window.location.origin) return;
    if (url.href === window.location.href) return;

    e.preventDefault();
    transitionPanel.classList.add('is-covering');

    window.setTimeout(function () {
      window.location.href = url.href;
    }, 600);
  });

  /**
   * On arrival from a same-site navigation, slide the curtain off.
   * Uses Navigation Timing L2 to detect navigation type; falls back silently.
   */
  var navEntries = (performance && performance.getEntriesByType)
    ? performance.getEntriesByType('navigation')
    : [];
  var navType = navEntries.length ? navEntries[0].type : '';
  if (navType === 'navigate') {
    transitionPanel.classList.add('is-covering');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        transitionPanel.classList.remove('is-covering');
        transitionPanel.classList.add('is-leaving');
        window.setTimeout(function () {
          transitionPanel.classList.remove('is-leaving');
        }, 600);
      });
    });
  }
})();
