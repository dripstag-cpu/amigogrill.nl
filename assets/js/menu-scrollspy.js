(function () {
    'use strict';

    function init() {
        var menuNav = document.querySelector('.menu-nav');
        if (!menuNav) return;

        var scrollEl = menuNav.querySelector('.menu-nav-scroll');
        var navItems = menuNav.querySelectorAll('.menu-nav-item');
        var categories = document.querySelectorAll('.menu-category');
        if (!navItems.length || !categories.length) return;

        // --- Drag-to-scroll (mouse + pen) — touch already works natively ---
        if (scrollEl) {
            var isDown = false;
            var startX = 0;
            var startScroll = 0;
            var moved = false;
            var DRAG_THRESHOLD = 6;

            var activePointerId = null;

            scrollEl.addEventListener('pointerdown', function (e) {
                if (e.pointerType === 'touch') return; // let native touch handle
                if (e.button !== 0) return; // primary button only
                isDown = true;
                moved = false;
                startX = e.clientX;
                startScroll = scrollEl.scrollLeft;
                activePointerId = e.pointerId;
            });

            scrollEl.addEventListener('pointermove', function (e) {
                if (!isDown || e.pointerId !== activePointerId) return;
                var dx = e.clientX - startX;
                if (!moved) {
                    if (Math.abs(dx) <= DRAG_THRESHOLD) return;
                    moved = true;
                    scrollEl.classList.add('is-dragging');
                    try { scrollEl.setPointerCapture(e.pointerId); } catch (_) {}
                }
                e.preventDefault();
                scrollEl.scrollLeft = startScroll - dx;
            });

            function endDrag(e) {
                if (!isDown) return;
                if (e.pointerId !== activePointerId && e.type !== 'pointerleave') return;
                isDown = false;
                if (moved) {
                    // swallow the upcoming click so nav doesn't jump
                    var suppress = function (ev) {
                        ev.preventDefault();
                        ev.stopPropagation();
                        scrollEl.removeEventListener('click', suppress, true);
                    };
                    scrollEl.addEventListener('click', suppress, true);
                    // and clear it on next tick if no click happens
                    setTimeout(function () {
                        scrollEl.removeEventListener('click', suppress, true);
                    }, 50);
                }
                setTimeout(function () { scrollEl.classList.remove('is-dragging'); }, 0);
                try { scrollEl.releasePointerCapture(activePointerId); } catch (_) {}
                activePointerId = null;
            }

            scrollEl.addEventListener('pointerup', endDrag);
            scrollEl.addEventListener('pointercancel', endDrag);

            // Mouse wheel: translate vertical wheel into horizontal scroll
            scrollEl.addEventListener('wheel', function (e) {
                if (e.deltaY === 0) return;
                var canScroll = scrollEl.scrollWidth > scrollEl.clientWidth;
                if (!canScroll) return;
                e.preventDefault();
                scrollEl.scrollLeft += e.deltaY;
            }, { passive: false });

            // Update edge-fade indicators based on scroll position
            function updateEdges() {
                var max = scrollEl.scrollWidth - scrollEl.clientWidth;
                var x = scrollEl.scrollLeft;
                menuNav.dataset.canScrollLeft = x > 2 ? 'true' : 'false';
                menuNav.dataset.canScrollRight = x < max - 2 ? 'true' : 'false';
            }
            scrollEl.addEventListener('scroll', updateEdges, { passive: true });
            window.addEventListener('resize', updateEdges);
            updateEdges();
        }

        // Smooth scroll on click, with header offset
        navItems.forEach(function (item) {
            item.addEventListener('click', function (e) {
                var href = this.getAttribute('href');
                if (!href || href.charAt(0) !== '#') return;
                e.preventDefault();

                var targetId = href.substring(1);
                var target = document.getElementById(targetId);
                if (!target) return;

                var headerOffset = window.innerWidth < 992 ? 140 : 100;
                var targetPos = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;

                window.scrollTo({ top: targetPos, behavior: 'smooth' });

                if (scrollEl) {
                    this.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                }
            });
        });

        // Scrollspy: highlight current category in nav as the user scrolls
        if (!('IntersectionObserver' in window)) return;

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;

                var catKey = entry.target.getAttribute('data-category');
                if (!catKey) return;

                navItems.forEach(function (item) {
                    item.classList.toggle(
                        'active',
                        item.getAttribute('data-category') === catKey
                    );
                });

                var activeTab = menuNav.querySelector(
                    '.menu-nav-item[data-category="' + catKey + '"]'
                );
                if (activeTab && scrollEl && scrollEl.scrollWidth > scrollEl.clientWidth) {
                    activeTab.scrollIntoView({
                        behavior: 'smooth',
                        inline: 'center',
                        block: 'nearest'
                    });
                }
            });
        }, {
            rootMargin: '-40% 0px -50% 0px',
            threshold: 0
        });

        categories.forEach(function (cat) { observer.observe(cat); });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
