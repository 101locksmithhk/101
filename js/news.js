(function() {
    // WhatsApp 現為群組入口：所有群組 CTA 使用一致且如實的文案。
    const groupCtaText = '加入群組・師傅們即時回覆';
    const groupLinkSelector = 'a[href*="chat.whatsapp.com/"]';

    function normaliseGroupCtas() {
        document.querySelectorAll(groupLinkSelector).forEach((link) => {
            // 導航列是簡短的服務入口，維持品牌名稱；其他群組 CTA 才顯示回覆說明。
            if (link.classList.contains('whatsapp-quick')) {
                link.setAttribute('aria-label', 'WhatsApp');
                return;
            }

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

    // Translated articles provide their own CTA copy.  Do not replace it with
    // the Traditional-Chinese group message when this opt-out is present.
    const shouldNormaliseGroupCtas = document.body.dataset.whatsappNormalise !== 'false';
    if (shouldNormaliseGroupCtas) {
        normaliseGroupCtas();
        window.addEventListener('load', normaliseGroupCtas, { once: true });
    }

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

    // WhatsApp 文字滾動隱藏 + 5秒後自動顯示
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
            }, 5000);
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

    // 統一 case、area、news 詳情頁的頁尾查詢面板，同時保留每頁的內容重點。
    function setupDirectoryContactPanel() {
        const route = window.location.pathname.match(/^\/(?:en\/|zh-CN\/)?(case|area|news)\/[^/]+(?:\.html)?$/i);
        if (!route || document.querySelector('.contact-box-section .contact-box')) return;

        const pageType = route[1].toLowerCase();
        const lang = document.documentElement.lang.toLowerCase().startsWith('en')
            ? 'en'
            : document.documentElement.lang.toLowerCase().includes('hans')
                ? 'zh-CN'
                : 'zh-HK';
        const heading = document.querySelector('main h1, article h1, h1');
        const pageTitle = heading?.textContent.trim().replace(/\s+/g, ' ') || '';
        const legacy = document.querySelector('main .cta, body > .site-contact-section, body > .room-contact-section, body > section.contact');
        const legacyTitle = legacy?.querySelector('h2, h3')?.textContent.trim().replace(/\s+/g, ' ') || '';
        const legacyIntro = legacy?.querySelector('p')?.textContent.trim().replace(/\s+/g, ' ') || '';

        const copy = {
            'zh-HK': {
                eyebrow: '門鎖即時查詢',
                titles: {
                    case: pageTitle ? `${pageTitle}｜需要類似協助？` : '遇到類似門鎖情況？',
                    area: pageTitle ? `${pageTitle}｜即時門鎖支援` : '需要地區開鎖支援？',
                    news: pageTitle ? `${pageTitle}｜有疑問想確認？` : '不確定門鎖問題應如何處理？'
                },
                intros: {
                    case: '傳送現場門鎖照片、所在地區及問題描述，讓師傅先了解情況。',
                    area: '提供所在地區、門鎖照片及問題描述，讓師傅先作初步評估。',
                    news: '傳送門鎖照片、所在地區及問題描述，師傅可按實際情況提供初步方向。'
                },
                steps: ['門鎖正面及可見問題照片', '所在地區及住宅／辦公室情況', '安排前核實合法使用權'],
                trust: '不提供未授權開鎖',
                whatsapp: '加入群組・師傅們即時回覆',
                phone: '致電 66 101 101',
                hint: '相片只作初步溝通；最終安排、處理方案及收費以實際鎖具、授權資料及現場情況為準。'
            },
            en: {
                eyebrow: 'Instant lock enquiry',
                titles: {
                    case: pageTitle ? `${pageTitle} | Need similar help?` : 'Facing a similar lock problem?',
                    area: pageTitle ? `${pageTitle} | Local locksmith support` : 'Need locksmith support in your area?',
                    news: pageTitle ? `${pageTitle} | Need expert advice?` : 'Not sure how to handle your lock problem?'
                },
                intros: {
                    case: 'Send photos of the lock, your location and a short description so a locksmith can assess the situation first.',
                    area: 'Share your location, lock photos and a short description for an initial assessment.',
                    news: 'Send lock photos, your location and a short description for practical guidance based on the actual situation.'
                },
                steps: ['Clear photos of the lock and visible issue', 'Location and home or office details', 'Proof of lawful access before service'],
                trust: 'No unauthorised unlocking',
                whatsapp: 'Join WhatsApp group · Fast replies',
                phone: 'Call 66 101 101',
                hint: 'Photos are for initial discussion only. Final arrangements, method and price depend on the lock, authorisation documents and onsite conditions.'
            },
            'zh-CN': {
                eyebrow: '门锁即时查询',
                titles: {
                    case: pageTitle ? `${pageTitle}｜需要类似协助？` : '遇到类似门锁情况？',
                    area: pageTitle ? `${pageTitle}｜即时门锁支援` : '需要地区开锁支援？',
                    news: pageTitle ? `${pageTitle}｜有疑问想确认？` : '不确定门锁问题应如何处理？'
                },
                intros: {
                    case: '发送现场门锁照片、所在地区及问题描述，让师傅先了解情况。',
                    area: '提供所在地区、门锁照片及问题描述，让师傅先作初步评估。',
                    news: '发送门锁照片、所在地区及问题描述，师傅可按实际情况提供初步方向。'
                },
                steps: ['门锁正面及可见问题照片', '所在地区及住宅／办公室情况', '安排前核实合法使用权'],
                trust: '不提供未授权开锁',
                whatsapp: '加入群组・师傅们即时回复',
                phone: '致电 66 101 101',
                hint: '照片只作初步沟通；最终安排、处理方案及收费以实际锁具、授权资料及现场情况为准。'
            }
        }[lang];

        const title = legacyTitle || copy.titles[pageType];
        const intro = legacyIntro || copy.intros[pageType];
        const section = document.createElement('section');
        section.className = 'contact-box-section';
        section.setAttribute('aria-labelledby', 'pageContactTitle');
        section.innerHTML = `<div class="container"><div class="contact-box"><div class="contact-box__content"><div><p class="contact-box__eyebrow"><i class="fas fa-comments" aria-hidden="true"></i>${copy.eyebrow}</p><h2 id="pageContactTitle"></h2><p class="contact-box__intro"></p><ul class="contact-box__steps"><li><i class="fas fa-camera" aria-hidden="true"></i><span></span></li><li><i class="fas fa-map-marker-alt" aria-hidden="true"></i><span></span></li><li><i class="fas fa-id-card" aria-hidden="true"></i><span></span></li></ul></div><div class="contact-box__action"><div class="contact-box__trust"><i class="fas fa-shield-alt" aria-hidden="true"></i><span></span></div><a class="button button-green" href="https://api.whatsapp.com/send/?phone=85266101101&amp;text=%E9%96%8B%E9%8E%96%E6%9F%A5%E8%A9%A2&amp;type=phone_number&amp;app_absent=0"><i class="fab fa-whatsapp" aria-hidden="true"></i><span></span></a><a class="button button-dark" href="tel:+85266101101"><i class="fas fa-phone" aria-hidden="true"></i><span></span></a><p class="contact-box__hint"></p></div></div></div></div>`;
        section.querySelector('h2').textContent = title;
        section.querySelector('.contact-box__intro').textContent = intro;
        section.querySelectorAll('.contact-box__steps span').forEach((node, index) => { node.textContent = copy.steps[index]; });
        section.querySelector('.contact-box__trust span').textContent = copy.trust;
        section.querySelector('.button-green span').textContent = copy.whatsapp;
        section.querySelector('.button-dark span').textContent = copy.phone;
        section.querySelector('.contact-box__hint').textContent = copy.hint;

        legacy?.remove();
        const footer = document.querySelector('footer');
        if (footer) footer.before(section);
    }
    setupDirectoryContactPanel();

    // 語言切換：優先使用 hreflang；缺少標記時仍保留目前頁面的相對路徑。
    document.querySelectorAll('.lang-option, .drawer-lang-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const lang = btn.getAttribute('data-lang');
            if (!lang && btn.matches('a[href]')) return;
            e.preventDefault();
            const hreflangMap = {
                zh: ['zh-Hans-CN', 'zh-CN', 'zh-Hans'],
                en: ['en-HK', 'en'],
                hk: ['zh-Hant-HK', 'zh-HK', 'zh-Hant']
            };
            const currentPath = window.location.pathname
                .replace(/^\/en(?=\/|$)/, '')
                .replace(/^\/zh-CN(?=\/|$)/, '') || '/';
            const fallbackMap = {
                zh: `/zh-CN${currentPath === '/' ? '/' : currentPath}`,
                en: `/en${currentPath === '/' ? '/' : currentPath}`,
                hk: currentPath
            };
            const alternate = (hreflangMap[lang] || [])
                .map(code => document.querySelector(`link[rel="alternate"][hreflang="${code}"]`))
                .find(link => link && link.href);
            let targetUrl = alternate ? alternate.href : fallbackMap[lang];
            if (targetUrl && ['localhost', '127.0.0.1'].includes(window.location.hostname)) {
                const target = new URL(targetUrl, window.location.href);
                targetUrl = `${window.location.origin}${target.pathname}${target.search}${target.hash}`;
            }
            if (targetUrl) window.location.assign(targetUrl);
        });
    });
})();
