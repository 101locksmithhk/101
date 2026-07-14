<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <html lang="zh-HK">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>101開鎖 Sitemap</title>
        <style>
          body{margin:0;background:#f9fafc;color:#1e2a3e;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;line-height:1.6}
          .wrap{max-width:1180px;margin:0 auto;padding:32px 20px}
          h1{margin:0 0 8px;font-size:2rem}
          .summary{margin:0 0 24px;color:#536174}
          table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #e8edf5;box-shadow:0 8px 22px rgba(30,42,62,.06)}
          th,td{padding:12px 14px;border-bottom:1px solid #e8edf5;text-align:left;vertical-align:top}
          th{background:#1e2a3e;color:#fff;font-size:.92rem}
          tr:hover td{background:#fffaf0}
          a{color:#1264a3;text-decoration:none;word-break:break-all}
          a:hover{text-decoration:underline}
          .num{width:56px;color:#6b7280}
          .meta{white-space:nowrap}
          .pill{display:inline-block;padding:2px 8px;border-radius:999px;background:#fff3c4;color:#7a5c00;font-weight:700;font-size:.82rem}
          @media(max-width:760px){table,thead,tbody,tr,th,td{display:block}thead{display:none}tr{border-bottom:1px solid #e8edf5}td{border:0;padding:8px 12px}.num{width:auto}.meta{white-space:normal}}
        </style>
      </head>
      <body>
        <main class="wrap">
          <h1>101開鎖 Sitemap</h1>
          <p class="summary">
            共 <strong><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></strong> 個網址。此檔案仍是標準 XML sitemap，可直接提交到 Google Search Console。
          </p>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>網址</th>
                <th>最後更新</th>
                <th>更新頻率</th>
                <th>優先度</th>
                <th>圖片</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url">
                <tr>
                  <td class="num"><xsl:value-of select="position()"/></td>
                  <td><a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a></td>
                  <td class="meta"><xsl:value-of select="sitemap:lastmod"/></td>
                  <td class="meta"><xsl:value-of select="sitemap:changefreq"/></td>
                  <td class="meta"><span class="pill"><xsl:value-of select="sitemap:priority"/></span></td>
                  <td class="meta"><xsl:value-of select="count(image:image)"/></td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
