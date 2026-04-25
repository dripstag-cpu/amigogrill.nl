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
       7. Quote modal — multi-step inquiry form
       Activates only on pages with [data-quote-trigger] buttons.
       Used on bedrijfsuitjes / business-events pages.
    ---------------------------------------------------------------- */
    function initQuoteModal() {
        var triggers = document.querySelectorAll('[data-quote-trigger]');
        if (!triggers.length) { return; }

        var modal = document.querySelector('.quote-modal');
        if (!modal) { return; }

        var form = modal.querySelector('form');
        var stepLabel = modal.querySelector('.quote-modal-step-label');
        var modalTitle = modal.querySelector('.quote-modal-title');
        var backBtn = modal.querySelector('.quote-btn-back');
        var nextBtn = modal.querySelector('.quote-btn-next');
        var footer = modal.querySelector('.quote-modal-footer');
        var closers = modal.querySelectorAll('[data-quote-close]');
        var steps = modal.querySelectorAll('.quote-step');
        var progressSegs = modal.querySelectorAll('.quote-progress-segment');
        var current = 1;
        var totalSteps = 3;

        // Read titles from data attributes (per language)
        var titles = {
            1: modal.getAttribute('data-step-1-title') || '',
            2: modal.getAttribute('data-step-2-title') || '',
            3: modal.getAttribute('data-step-3-title') || ''
        };
        var stepLabelTpl = modal.getAttribute('data-step-label') || 'Step {n} of {total}';
        var thanksLabel = modal.getAttribute('data-thanks-label') || 'Sent';
        var nextLabel = modal.getAttribute('data-next-label') || 'Next →';
        var submitLabel = modal.getAttribute('data-submit-label') || 'Send';
        var mailtoSubject = modal.getAttribute('data-mailto-subject') || 'Inquiry';
        var mailtoTo = modal.getAttribute('data-mailto-to') || '';
        var mailtoLabels = {
            event_type: modal.getAttribute('data-label-event-type') || 'Event type',
            guests: modal.getAttribute('data-label-guests') || 'Number of guests',
            date: modal.getAttribute('data-label-date') || 'Preferred date',
            flexible: modal.getAttribute('data-label-flexible') || 'Date is flexible',
            message: modal.getAttribute('data-label-message') || 'Special requests',
            name: modal.getAttribute('data-label-name') || 'Name',
            email: modal.getAttribute('data-label-email') || 'Email',
            phone: modal.getAttribute('data-label-phone') || 'Phone',
            company: modal.getAttribute('data-label-company') || 'Company'
        };

        function open() {
            modal.classList.add('is-open');
            modal.setAttribute('aria-hidden', 'false');
            body.classList.add('modal-open');
            setTimeout(focusFirstInput, 300);
        }

        function close() {
            modal.classList.remove('is-open');
            modal.setAttribute('aria-hidden', 'true');
            body.classList.remove('modal-open');
        }

        function focusFirstInput() {
            var first = modal.querySelector('.quote-step.is-active input, .quote-step.is-active select, .quote-step.is-active textarea');
            if (first) first.focus();
        }

        function showStep(n) {
            steps.forEach(function (s) { s.classList.remove('is-active'); });
            var nextStep = modal.querySelector('[data-step="' + n + '"]');
            if (nextStep) nextStep.classList.add('is-active');

            progressSegs.forEach(function (seg, i) {
                seg.classList.toggle('is-active', i + 1 <= (n === 'thanks' ? totalSteps : n));
            });

            if (n === 'thanks') {
                stepLabel.textContent = thanksLabel;
                modalTitle.textContent = '';
                footer.style.display = 'none';
            } else {
                stepLabel.textContent = stepLabelTpl.replace('{n}', n).replace('{total}', totalSteps);
                modalTitle.textContent = titles[n] || '';
                footer.style.display = 'flex';
                backBtn.classList.toggle('is-hidden', n === 1);
                nextBtn.textContent = (n === totalSteps) ? submitLabel : nextLabel;
            }

            current = n;
            modal.querySelectorAll('.quote-error').forEach(function (e) { e.classList.remove('is-visible'); });
            setTimeout(function () { if (n !== 'thanks') focusFirstInput(); }, 100);
        }

        function validateStep(n) {
            if (n === 1) {
                var guests = form.querySelector('[name="guests"]').value.trim();
                if (!guests || parseInt(guests, 10) < 1) {
                    form.querySelector('[data-error-step="1"]').classList.add('is-visible');
                    return false;
                }
            }
            if (n === 3) {
                var name = form.querySelector('[name="name"]').value.trim();
                var email = form.querySelector('[name="email"]').value.trim();
                var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!name || !email || !emailRe.test(email)) {
                    form.querySelector('[data-error-step="3"]').classList.add('is-visible');
                    return false;
                }
            }
            return true;
        }

        function buildMailto() {
            // Honeypot check — if filled, silently abort
            var hp = form.querySelector('[name="_gotcha"]');
            if (hp && hp.value) { return null; }

            var data = new FormData(form);
            var lines = [];

            function addLine(key, label) {
                var val = data.get(key);
                if (val && String(val).trim()) {
                    lines.push(label + ': ' + val);
                }
            }

            addLine('name', mailtoLabels.name);
            addLine('email', mailtoLabels.email);
            addLine('phone', mailtoLabels.phone);
            addLine('company', mailtoLabels.company);
            lines.push('');
            addLine('event_type', mailtoLabels.event_type);
            addLine('guests', mailtoLabels.guests);
            addLine('date', mailtoLabels.date);
            if (data.get('flexible')) lines.push(mailtoLabels.flexible + ': ja / yes');
            lines.push('');
            addLine('message', mailtoLabels.message);

            var body = lines.join('\n');
            return 'mailto:' + mailtoTo +
                '?subject=' + encodeURIComponent(mailtoSubject) +
                '&body=' + encodeURIComponent(body);
        }

        triggers.forEach(function (t) {
            t.addEventListener('click', function (e) {
                e.preventDefault();
                open();
            });
        });
        closers.forEach(function (c) { c.addEventListener('click', close); });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
        });

        nextBtn.addEventListener('click', function () {
            if (!validateStep(current)) return;
            if (current === totalSteps) {
                var mailto = buildMailto();
                if (mailto) {
                    window.location.href = mailto;
                }
                showStep('thanks');
            } else {
                showStep(current + 1);
            }
        });

        backBtn.addEventListener('click', function () {
            if (typeof current === 'number' && current > 1) showStep(current - 1);
        });
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
        initQuoteModal();
        docEl.classList.remove('no-js');
        docEl.classList.add('js');
    });
})();
