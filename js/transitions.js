// Smooth page transitions with element-level exit animations
(function() {
    var overlay = document.querySelector('.page-transition');
    if (!overlay) return;

    // Fade overlay out to reveal page content
    requestAnimationFrame(function() {
        requestAnimationFrame(function() {
            overlay.classList.add('is-loaded');
        });
    });

    // Intercept clicks on internal navigation links
    document.addEventListener('click', function(e) {
        var link = e.target.closest('a');
        if (!link) return;

        var href = link.getAttribute('href');

        // Skip external links, anchors, new tab links, etc.
        if (!href || 
            href.startsWith('#') || 
            href.startsWith('http') || 
            href.startsWith('mailto:') || 
            link.target === '_blank') {
            return;
        }

        e.preventDefault();

        // Step 1: Start element exit animations (blocks slide up + fade out)
        document.body.classList.add('is-leaving');

        // Add subtle stagger to poster grid items (if on home page)
        var posterItems = document.querySelectorAll('.poster-item.is-visible');
        posterItems.forEach(function(item, i) {
            item.style.transitionDelay = (i * 0.03) + 's';
        });

        // Step 2: After elements start disappearing, fade overlay in
        setTimeout(function() {
            overlay.classList.remove('is-loaded');
        }, 150);

        // Step 3: Navigate after overlay is fully opaque
        var navigated = false;
        function doNavigate() {
            if (navigated) return;
            navigated = true;
            window.location.href = href;
        }

        overlay.addEventListener('transitionend', doNavigate, { once: true });
        setTimeout(doNavigate, 900); // Fallback
    });

    // Handle browser back/forward button (bfcache)
    window.addEventListener('pageshow', function(e) {
        if (e.persisted) {
            document.body.classList.remove('is-leaving');
            requestAnimationFrame(function() {
                overlay.classList.add('is-loaded');
            });
        }
    });
})();
