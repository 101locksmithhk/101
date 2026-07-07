(function() {
    // 抽屜選單邏輯
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const drawer = document.getElementById('mobileDrawer');
    const overlay = document.getElementById('drawerOverlay');
    const closeDrawerBtn = document.getElementById('closeDrawerBtn');

    function openDrawer() {
        if (drawer) drawer.classList.add('open');
        if (overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
        if (drawer) drawer.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (mobileBtn) mobileBtn.addEventListener('click', openDrawer);
    if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeDrawer);
    if (overlay) overlay.addEventListener('click', closeDrawer);

    // 抽屜子選單開合
    document.querySelectorAll('.drawer-nav-item[data-has-sub="true"]').forEach(item => {
        const btn = item.querySelector('.drawer-nav-link');
        const submenu = item.querySelector('.drawer-submenu');
        if (btn && submenu) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                submenu.classList.toggle('show');
                const icon = btn.querySelector('i');
                if (icon) {
                    icon.style.transform = submenu.classList.contains('show') ? 'rotate(180deg)' : 'rotate(0deg)';
                }
            });
        }
    });

    // 點擊抽屜連結後關閉選單
    document.querySelectorAll('.mobile-drawer a').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetEl = document.getElementById(targetId);
                if (targetEl) {
                    closeDrawer();
                    setTimeout(() => {
                        window.scrollTo({ top: targetEl.offsetTop - 80, behavior: 'smooth' });
                    }, 150);
                }
            } else {
                closeDrawer();
            }
        });
    });

    // 桌面導航平滑滾動（僅內部錨點）
    document.querySelectorAll('.desktop-nav a, .dropdown-content a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const hash = this.getAttribute('href');
            if (hash && hash.startsWith('#')) {
                e.preventDefault();
                const target = document.getElementById(hash.substring(1));
                if (target) {
                    window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
                }
            }
        });
    });

    // WhatsApp 文字滾動隱藏 + 20秒後自動顯示
    const whatsappTextEl = document.getElementById('whatsappText');
    if (whatsappTextEl) {
        let hideTimer = null, isHiddenByScroll = false;
        function showText() {
            if (whatsappTextEl.classList.contains('hide-on-scroll')) {
                whatsappTextEl.classList.remove('hide-on-scroll');
                isHiddenByScroll = false;
            }
            if (hideTimer) clearTimeout(hideTimer);
        }
        function hideTextAndStartTimer() {
            if (!whatsappTextEl.classList.contains('hide-on-scroll')) {
                whatsappTextEl.classList.add('hide-on-scroll');
                isHiddenByScroll = true;
            }
            if (hideTimer) clearTimeout(hideTimer);
            hideTimer = setTimeout(() => {
                if (isHiddenByScroll) showText();
                hideTimer = null;
            }, 20000);
        }
        let scrollTimeout = null;
        window.addEventListener('scroll', () => {
            if (scrollTimeout) cancelAnimationFrame(scrollTimeout);
            scrollTimeout = requestAnimationFrame(() => {
                if (window.scrollY > 100) {
                    hideTextAndStartTimer();
                } else if (whatsappTextEl.classList.contains('hide-on-scroll')) {
                    showText();
                }
            });
        });
    }

    // 語言切換按鈕：所有語言都跳回對應首頁
    document.querySelectorAll('.lang-option, .drawer-lang-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const lang = btn.getAttribute('data-lang');
            const isNestedPage = window.location.pathname.includes('/news/') || window.location.pathname.includes('/case/');
            const prefix = isNestedPage ? '../' : '';
            const targetUrl = lang === 'zh'
                ? `${prefix}zh-CN/index.html`
                : (lang === 'en' ? `${prefix}en/index.html` : `${prefix}index.html`);
            if (targetUrl) window.location.href = targetUrl;
        });
    });
})();
