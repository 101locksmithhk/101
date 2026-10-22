(function () {
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

    // Localized pages provide their own CTA copy.
    if (document.body.dataset.whatsappNormalise !== 'false') {
        normaliseGroupCtas();
        window.addEventListener('load', normaliseGroupCtas, { once: true });
    }
})();
