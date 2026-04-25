(function () {
    'use strict';

    var docEl = document.documentElement;
    var body = document.body;

    /* ----------------------------------------------------------------
       1. Fade-in on scroll via IntersectionObserver
    ---------------------------------------------------------------- */
    function initFadeIn() {
        var items = document.querySelectorAll('.fade-in');
        if (!items.length) { return; }

        if (!('IntersectionObserver' in window)) {
            items.forEach(function (el) { el.classList.add('is-visible'); });
            return;
        }

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    io.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -80px 0px', threshold: 0.12 });

        items.forEach(function (el) { io.observe(el); });
    }

    /* ----------------------------------------------------------------
       1b. Reveal-on-scroll (.reveal → .visible)
    ---------------------------------------------------------------- */
    function initReveal() {
        var items = document.querySelectorAll('.reveal');
        if (!items.length) { return; }

        if (!('IntersectionObserver' in window)) {
            items.forEach(function (el) { el.classList.add('visible'); });
            return;
        }

        // IntersectionObserver fires synchronously for elements already in viewport
        // on the next microtask after observe(). No need for a manual sweep —
        // that caused 99ms of layout thrashing.
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    io.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -60px 0px', threshold: 0.08 });

        items.forEach(function (el) { io.observe(el); });

        // Safety net: if observer somehow doesn't fire within 1.5s,
        // force every remaining .reveal element visible.
        setTimeout(function () {
            document.querySelectorAll('.reveal:not(.visible)').forEach(function (el) {
                el.classList.add('visible');
            });
        }, 1500);
    }

    /* ----------------------------------------------------------------
       2. Sticky header scrolled state
    ---------------------------------------------------------------- */
    function initStickyHeader() {
        var header = document.querySelector('.site-header');
        if (!header || header.classList.contains('site-header--landing')) { return; }

        var threshold = 24;
        var ticking = false;

        function update() {
            if (window.scrollY > threshold) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
            ticking = false;
        }

        window.addEventListener('scroll', function () {
            if (!ticking) {
                window.requestAnimationFrame(update);
                ticking = true;
            }
        }, { passive: true });

        update();
    }

    /* ----------------------------------------------------------------
       3. Mobile menu toggle
    ---------------------------------------------------------------- */
    function initMobileNav() {
        var toggle = document.querySelector('.mobile-toggle') || document.querySelector('.nav-toggle');
        var nav = document.querySelector('.mobile-menu') || document.querySelector('.mobile-nav');
        if (!toggle || !nav) { return; }

        function close() {
            toggle.setAttribute('aria-expanded', 'false');
            toggle.classList.remove('is-open');
            nav.classList.remove('open');
            nav.classList.remove('is-open');
            body.classList.remove('nav-open');
        }

        function open() {
            toggle.setAttribute('aria-expanded', 'true');
            toggle.classList.add('is-open');
            nav.classList.add('open');
            nav.classList.add('is-open');
            body.classList.add('nav-open');
        }

        toggle.addEventListener('click', function () {
            var expanded = toggle.getAttribute('aria-expanded') === 'true';
            if (expanded) { close(); } else { open(); }
        });

        nav.querySelectorAll('a').forEach(function (a) {
            a.addEventListener('click', close);
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') { close(); }
        });

        window.addEventListener('resize', function () {
            if (window.innerWidth >= 1024) { close(); }
        });
    }

    /* ----------------------------------------------------------------
       4. Language path mapping
       Used both for the flag switcher and the suggestion banner.
    ---------------------------------------------------------------- */
    var LANG_MAP = {
        'nl-to-en': {
            '/': '/en/',
            '/menu/': '/en/menu/',
            '/ons-verhaal/': '/en/our-story/',
            '/terras/': '/en/terrace/',
            '/bedrijfsuitjes/': '/en/business-events/',
            '/contact/': '/en/contact/',
            '/reserveren/': '/en/book/',
            '/privacy/': '/en/privacy/',
            '/cookies/': '/en/cookies/'
        },
        'en-to-nl': {
            '/en/': '/',
            '/en/menu/': '/menu/',
            '/en/our-story/': '/ons-verhaal/',
            '/en/terrace/': '/terras/',
            '/en/business-events/': '/bedrijfsuitjes/',
            '/en/contact/': '/contact/',
            '/en/book/': '/reserveren/',
            '/en/privacy/': '/privacy/',
            '/en/cookies/': '/cookies/'
        }
    };

    function normalize(path) {
        if (!path) { return '/'; }
        if (path.length > 1 && path.charAt(path.length - 1) !== '/') {
            path += '/';
        }
        return path;
    }

    function currentLang() {
        var p = window.location.pathname;
        if (p === '/en' || p === '/en/' || p.indexOf('/en/') === 0) {
            return 'en';
        }
        return 'nl';
    }

    function translatePath(path, direction) {
        var table = LANG_MAP[direction];
        var normalized = normalize(path);
        if (table[normalized]) { return table[normalized]; }
        if (direction === 'nl-to-en') {
            return '/en' + (normalized === '/' ? '/' : normalized);
        }
        return normalized.replace(/^\/en/, '') || '/';
    }

    /* ----------------------------------------------------------------
       5. Flag switcher
       If a .flag-switcher anchor has no href, compute one from current URL.
    ---------------------------------------------------------------- */
    function initFlagSwitcher() {
        var switcher = document.querySelector('.flag-switcher');
        if (!switcher) { return; }

        var lang = currentLang();
        var links = switcher.querySelectorAll('a[data-lang]');
        links.forEach(function (a) {
            var target = a.getAttribute('data-lang');
            if (target === lang) {
                a.classList.add('is-active');
                a.setAttribute('aria-current', 'true');
            }
            if (!a.getAttribute('href') || a.getAttribute('href') === '#') {
                var direction = (lang === 'nl' && target === 'en') ? 'nl-to-en' :
                                (lang === 'en' && target === 'nl') ? 'en-to-nl' : null;
                if (direction) {
                    a.setAttribute('href', translatePath(window.location.pathname, direction));
                }
            }
        });
    }

    /* ----------------------------------------------------------------
       6. Language suggestion banner
       Shows once per visitor. Suggests switching if browser language
       clearly differs from the current page language.
    ---------------------------------------------------------------- */
    function initLangBanner() {
        var banner = document.querySelector('.lang-banner');
        if (!banner) { return; }

        var STORAGE_KEY = 'amigo_lang_pref';
        var stored;
        try { stored = localStorage.getItem(STORAGE_KEY); } catch (err) { stored = null; }
        if (stored) { return; }

        var lang = currentLang();
        var browserLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
        var browserShort = browserLang.slice(0, 2);

        var shouldShow = (lang === 'nl' && browserShort !== 'nl') ||
                         (lang === 'en' && browserShort === 'nl');

        if (!shouldShow) { return; }

        var switchBtn = banner.querySelector('[data-lang-switch]');
        if (switchBtn) {
            var direction = lang === 'nl' ? 'nl-to-en' : 'en-to-nl';
            switchBtn.setAttribute('href', translatePath(window.location.pathname, direction));
            switchBtn.addEventListener('click', function () {
                try { localStorage.setItem(STORAGE_KEY, lang === 'nl' ? 'en' : 'nl'); } catch (err) {}
            });
        }

        var dismissBtn = banner.querySelector('[data-lang-dismiss]');
        if (dismissBtn) {
            dismissBtn.addEventListener('click', function () {
                banner.classList.remove('is-visible');
                body.classList.remove('has-lang-banner');
                try { localStorage.setItem(STORAGE_KEY, lang); } catch (err) {}
            });
        }

        window.setTimeout(function () {
            banner.classList.add('is-visible');
            body.classList.add('has-lang-banner');
        }, 400);
    }

    /* ----------------------------------------------------------------
       Mobile dock — slide up after user scrolls past hero
    ---------------------------------------------------------------- */
    function initMobileDock() {
        var dock = document.querySelector('.mobile-dock');
        if (!dock) { return; }

        var threshold = 300;
        var ticking = false;

        function update() {
            if (window.scrollY > threshold) dock.classList.add('is-visible');
            else dock.classList.remove('is-visible');
            ticking = false;
        }

        window.addEventListener('scroll', function () {
            if (!ticking) {
                window.requestAnimationFrame(update);
                ticking = true;
            }
        }, { passive: true });

        update();
    }

    /* ----------------------------------------------------------------
       Init
    ---------------------------------------------------------------- */
    function ready(fn) {
        if (document.readyState !== 'loading') { fn(); }
        else { document.addEventListener('DOMContentLoaded', fn); }
    }

    ready(function () {
        initFadeIn();
        initReveal();
        initStickyHeader();
        initMobileNav();
        initMobileDock();
        initFlagSwitcher();
        initLangBanner();
        docEl.classList.remove('no-js');
        docEl.classList.add('js');
    });
})();
