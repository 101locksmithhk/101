(function() {
    // WhatsApp 現為群組入口：所有群組 CTA 使用一致且如實的文案。
    const groupCtaText = '加入群組・師傅們即時回覆';
    const groupLinkSelector = 'a[href*="chat.whatsapp.com/"]';

    function normaliseGroupCtas() {
        document.querySelectorAll(groupLinkSelector).forEach((link) => {
            const icon = link.querySelector(':scope > i');
            const hasVisibleText = Array.from(link.childNodes).some((node) =>
                node.nodeType === Node.TEXT_NODE && node.textContent.trim()
            ) || Array.from(link.children).some((child) => child.tagName !== 'I');

            link.setAttribute('aria-label', groupCtaText);
            if (!hasVisibleText) return;

            link.replaceChildren();
            if (icon) link.appendChild(icon);
            link.append(` ${groupCtaText}`);
        });

        document.querySelectorAll('.whatsapp-wrapper').forEach((wrapper) => {
            if (wrapper.querySelector(groupLinkSelector)) {
                const text = wrapper.querySelector('.whatsapp-text');
                if (text) text.textContent = groupCtaText;
            }
        });
    }

    normaliseGroupCtas();
    window.addEventListener('load', normaliseGroupCtas, { once: true });

    // 抽屜選單邏輯
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const drawer = document.getElementById('mobileDrawer');
    const overlay = document.getElementById('drawerOverlay');
    const closeDrawerBtn = document.getElementById('closeDrawerBtn');

    function openDrawer() {
        if (drawer) drawer.classList.add('open');
        if (overlay) overlay.classList.add('active');
        if (mobileBtn) mobileBtn.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
        if (drawer) drawer.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
        if (mobileBtn) mobileBtn.setAttribute('aria-expanded', 'false');
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
                btn.setAttribute('aria-expanded', submenu.classList.contains('show') ? 'true' : 'false');
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

    // 語言切換：有同篇翻譯時使用 hreflang，否則返回該語言首頁
    document.querySelectorAll('.lang-option, .drawer-lang-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const lang = btn.getAttribute('data-lang');
            const hreflangMap = {
                zh: ['zh-Hans-CN', 'zh-CN', 'zh-Hans'],
                en: ['en-HK', 'en'],
                hk: ['zh-Hant-HK', 'zh-HK', 'zh-Hant']
            };
            const fallbackMap = {
                zh: '/zh-CN/index.html',
                en: '/en/index.html',
                hk: '/index.html'
            };
            const alternate = (hreflangMap[lang] || [])
                .map(code => document.querySelector(`link[rel="alternate"][hreflang="${code}"]`))
                .find(link => link && link.href);
            const targetUrl = alternate ? alternate.href : fallbackMap[lang];
            if (targetUrl) window.location.href = targetUrl;
        });
    });
})();
