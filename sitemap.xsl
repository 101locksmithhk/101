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
        <title>101開鎖 Sitemap｜網站地圖</title>
        <style>
          :root {
            --ink: #1e2a3e;
            --muted: #65758b;
            --gold: #d4af37;
            --line: #e7ecf3;
            --bg: #f7f9fc;
            --card: #ffffff;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans TC", "Microsoft JhengHei", Arial, sans-serif;
            color: var(--ink);
            background:
              radial-gradient(circle at top left, rgba(212, 175, 55, 0.16), transparent 34rem),
              linear-gradient(180deg, #ffffff 0%, var(--bg) 42%, #eef2f7 100%);
            line-height: 1.6;
          }

          .wrap {
            width: min(1180px, calc(100% - 32px));
            margin: 0 auto;
            padding: 46px 0 56px;
          }

          .hero {
            display: grid;
            gap: 18px;
            margin-bottom: 26px;
            padding: 30px;
            border: 1px solid rgba(212, 175, 55, 0.34);
            border-radius: 24px;
            background: rgba(255, 255, 255, 0.84);
            box-shadow: 0 18px 45px rgba(30, 42, 62, 0.09);
          }

          .eyebrow {
            display: inline-flex;
            width: fit-content;
            align-items: center;
            gap: 8px;
            padding: 7px 13px;
            border-radius: 999px;
            background: rgba(212, 175, 55, 0.14);
            color: #8a6b10;
            font-weight: 700;
            font-size: 13px;
            letter-spacing: 0.04em;
            text-transform: uppercase;
          }

          h1 {
            margin: 0;
            font-size: clamp(30px, 5vw, 52px);
            line-height: 1.08;
            letter-spacing: -0.04em;
          }

          .intro {
            max-width: 760px;
            margin: 0;
            color: var(--muted);
            font-size: 17px;
          }

          .stats {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 14px;
            margin-top: 8px;
          }

          .stat {
            padding: 16px;
            border-radius: 18px;
            background: var(--card);
            border: 1px solid var(--line);
          }

          .stat strong {
            display: block;
            font-size: 24px;
            line-height: 1.2;
          }

          .stat span {
            color: var(--muted);
            font-size: 13px;
          }

          .table-card {
            overflow: hidden;
            border-radius: 22px;
            background: var(--card);
            border: 1px solid var(--line);
            box-shadow: 0 16px 40px rgba(30, 42, 62, 0.08);
          }

          .table-head {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            align-items: center;
            padding: 18px 22px;
            border-bottom: 1px solid var(--line);
            background: #fbfcfe;
          }

          .table-head h2 {
            margin: 0;
            font-size: 18px;
          }

          .hint {
            color: var(--muted);
            font-size: 13px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          th,
          td {
            padding: 14px 16px;
            border-bottom: 1px solid var(--line);
            text-align: left;
            vertical-align: top;
          }

          th {
            position: sticky;
            top: 0;
            z-index: 1;
            background: #1e2a3e;
            color: #ffffff;
            font-size: 13px;
            letter-spacing: 0.04em;
            text-transform: uppercase;
          }

          tr:hover td {
            background: #fffaf0;
          }

          a {
            color: #1458a8;
            text-decoration: none;
            word-break: break-word;
            font-weight: 650;
          }

          a:hover {
            color: #0c3c78;
            text-decoration: underline;
          }

          .badge {
            display: inline-flex;
            align-items: center;
            min-width: 42px;
            justify-content: center;
            padding: 4px 9px;
            border-radius: 999px;
            background: #eef4ff;
            color: #27558d;
            font-size: 12px;
            font-weight: 700;
          }

          .priority {
            background: rgba(212, 175, 55, 0.16);
            color: #7a5d08;
          }

          .footer-note {
            margin-top: 18px;
            color: var(--muted);
            font-size: 13px;
            text-align: center;
          }

          @media (max-width: 820px) {
            .wrap {
              width: min(100% - 22px, 1180px);
              padding-top: 28px;
            }

            .hero {
              padding: 22px;
              border-radius: 20px;
            }

            .stats {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .table-card {
              overflow-x: auto;
            }

            table {
              min-width: 760px;
            }
          }
        </style>
      </head>
      <body>
        <main class="wrap">
          <section class="hero">
            <span class="eyebrow">XML Sitemap</span>
            <h1>101開鎖網站地圖</h1>
            <p class="intro">
              這份 sitemap 供 Google、Bing 等搜尋引擎索引網站頁面，同時以較易閱讀的表格方式顯示，方便檢查 URL、更新日期及圖片資料。
            </p>

            <div class="stats" aria-label="Sitemap summary">
              <div class="stat">
                <strong><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></strong>
                <span>收錄頁面</span>
              </div>
              <div class="stat">
                <strong><xsl:value-of select="count(sitemap:urlset/sitemap:url[starts-with(sitemap:loc, 'https://101locksmithhk.com/news/')])"/></strong>
                <span>開鎖知識</span>
              </div>
              <div class="stat">
                <strong><xsl:value-of select="count(sitemap:urlset/sitemap:url[starts-with(sitemap:loc, 'https://101locksmithhk.com/case/')])"/></strong>
                <span>真實案例</span>
              </div>
              <div class="stat">
                <strong><xsl:value-of select="count(sitemap:urlset/sitemap:url/image:image)"/></strong>
                <span>圖片索引</span>
              </div>
            </div>
          </section>

          <section class="table-card">
            <div class="table-head">
              <h2>URL 清單</h2>
            </div>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>URL</th>
                  <th>Lastmod</th>
                  <th>Changefreq</th>
                  <th>Priority</th>
                  <th>Images</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="sitemap:urlset/sitemap:url">
                  <tr>
                    <td><xsl:value-of select="position()"/></td>
                    <td>
                      <a>
                        <xsl:attribute name="href"><xsl:value-of select="sitemap:loc"/></xsl:attribute>
                        <xsl:value-of select="sitemap:loc"/>
                      </a>
                    </td>
                    <td><xsl:value-of select="sitemap:lastmod"/></td>
                    <td><span class="badge"><xsl:value-of select="sitemap:changefreq"/></span></td>
                    <td><span class="badge priority"><xsl:value-of select="sitemap:priority"/></span></td>
                    <td><xsl:value-of select="count(image:image)"/></td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </section>

          <p class="footer-note">
            Generated for 101 Locksmith HK · Standard XML sitemap with browser-friendly styling.
          </p>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
