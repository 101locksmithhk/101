(function () {
    'use strict';

    const DISTRICTS = {
        'central-western': '中西區', 'wan-chai': '灣仔區', eastern: '東區', southern: '南區',
        'yau-tsim-mong': '油尖旺區', 'sham-shui-po': '深水埗區', 'kowloon-city': '九龍城區',
        'wong-tai-sin': '黃大仙區', 'kwun-tong': '觀塘區', 'kwai-tsing': '葵青區',
        'tsuen-wan': '荃灣區', 'tuen-mun': '屯門區', 'yuen-long': '元朗區', northern: '北區',
        'tai-po': '大埔區', 'sha-tin': '沙田區', 'sai-kung': '西貢區', 'outlying-islands': '離島區'
    };

    function cleanText(value) {
        return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 100);
    }

    function urlFor(link) {
        try {
            return new URL(link.getAttribute('href') || '', window.location.href);
        } catch (error) {
            return null;
        }
    }

    function districtFrom(value) {
        const text = decodeURIComponent(String(value || '')).toLowerCase();
        const slug = Object.keys(DISTRICTS).find(function (key) {
            return text.includes('/area/' + key) || text.includes(key) || text.includes(DISTRICTS[key].toLowerCase());
        });
        return slug ? DISTRICTS[slug] : '';
    }

    function inferArea(link) {
        const scoped = link && link.closest('[data-area]');
        return cleanText((link && link.dataset.area) || (scoped && scoped.dataset.area) ||
            districtFrom(link ? link.getAttribute('href') : '') || districtFrom(window.location.pathname));
    }

    function inferService(link) {
        const scoped = link && link.closest('[data-service]');
        const declared = (link && link.dataset.service) || (scoped && scoped.dataset.service);
        if (declared) return cleanText(declared);

        const source = cleanText([
            window.location.pathname,
            document.querySelector('h1') ? document.querySelector('h1').textContent : '',
            link ? link.textContent : '',
            link ? link.getAttribute('aria-label') : ''
        ].join(' ')).toLowerCase();

        if (/電子鎖|智能鎖|electronic|digital|smart lock/.test(source)) return 'electronic_lock';
        if (/車鎖|汽車|car lock|vehicle/.test(source)) return 'car_lock';
        if (/夾萬|保險箱|safe/.test(source)) return 'safe';
        if (/門禁|access control/.test(source)) return 'access_control';
        if (/換鎖|replacement|replace lock/.test(source)) return 'lock_replacement';
        if (/開鎖|unlock|locksmith|locked out/.test(source)) return 'unlock';
        return 'general_locksmith';
    }

    function buttonPosition(link) {
        if (link.closest('.float-buttons, .float-button-phone, .whatsapp-wrapper')) return 'floating_cta';
        if (link.closest('.mobile-drawer, .drawer-quick, .drawer-nav')) return 'mobile_drawer';
        if (link.closest('header, .navbar, nav')) return 'header_navigation';
        if (link.closest('.hero')) return 'hero';
        if (link.closest('#pricing, .pricing-section, .price-section')) return 'pricing_section';
        if (link.closest('.topic-links')) return 'related_links';
        if (link.closest('footer, .footer')) return 'footer';
        return 'content';
    }

    function eventParameters(link) {
        const url = urlFor(link);
        return {
            page_path: window.location.pathname || '/',
            page_title: cleanText(document.title),
            service: inferService(link),
            area: inferArea(link) || 'not_specified',
            button_position: buttonPosition(link),
            link_text: cleanText(link.textContent || link.getAttribute('aria-label')),
            link_url: url ? url.href.slice(0, 500) : ''
        };
    }

    function sendEvent(name, parameters) {
        if (typeof window.gtag === 'function') {
            window.gtag('event', name, parameters);
        } else {
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push(Object.assign({ event: name }, parameters));
        }
    }

    document.addEventListener('click', function (event) {
        const link = event.target.closest('a[href]');
        if (!link) return;

        const rawHref = link.getAttribute('href') || '';
        const url = urlFor(link);
        const path = url ? url.pathname.toLowerCase() : '';
        let eventName = '';

        if (rawHref.toLowerCase().startsWith('tel:')) {
            eventName = 'phone_click';
        } else if (url && url.hostname === 'chat.whatsapp.com') {
            eventName = 'whatsapp_group_click';
        } else if (url && (/^(www\.)?google\.[^/]+$/.test(url.hostname) || url.hostname === 'maps.app.goo.gl') && /\/maps|maps\//.test(url.href)) {
            eventName = 'map_click';
        } else if (/\/(?:case\/[^/]+|locksmith-real-case\.html)$/.test(path)) {
            eventName = 'case_click';
        } else if (/\/(?:area(?:\/[^/]+)?\.html)$/.test(path)) {
            eventName = 'area_click';
        }

        if (eventName) sendEvent(eventName, eventParameters(link));
    }, true);

    function observePricing() {
        let pricing = document.querySelector('#pricing, [data-track-view="pricing"], .pricing-section, .price-section, .pricing-wrapper');
        if (!pricing && /\/price\.html$/.test(window.location.pathname)) {
            pricing = document.querySelector('main, .main-content, section');
        }
        if (!pricing) return;

        let sent = false;
        const observer = new IntersectionObserver(function (entries) {
            if (sent || !entries.some(function (entry) { return entry.isIntersecting; })) return;
            sent = true;
            sendEvent('view_pricing', {
                page_path: window.location.pathname || '/',
                page_title: cleanText(document.title),
                service: inferService(null),
                area: inferArea(null) || 'not_specified',
                button_position: 'pricing_section'
            });
            observer.disconnect();
        }, { rootMargin: '-20% 0px -20% 0px', threshold: 0 });
        observer.observe(pricing);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', observePricing, { once: true });
    } else {
        observePricing();
    }
})();
