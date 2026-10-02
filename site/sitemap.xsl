<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="fr">
      <head>
        <meta charset="utf-8"/>
        <title>Sitemap | Multi Centrale Express</title>
        <style>
          body { font-family: "Segoe UI", sans-serif; margin: 40px auto; max-width: 820px; color: #1b1218; }
          h1 { font-size: 1.6rem; }
          p { color: #6e5d68; }
          table { width: 100%; border-collapse: collapse; }
          th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid #eadfe4; }
          th { font-size: 0.8rem; letter-spacing: 0.04em; text-transform: uppercase; color: #6d1736; }
          a { color: #90244b; }
        </style>
      </head>
      <body>
        <h1>Sitemap Multi Centrale Express</h1>
        <p>Liste des pages transmises aux moteurs de recherche.</p>
        <table>
          <thead>
            <tr><th>Page</th><th>Mise à jour</th></tr>
          </thead>
          <tbody>
            <xsl:for-each select="s:urlset/s:url">
              <tr>
                <td><a href="{s:loc}"><xsl:value-of select="s:loc"/></a></td>
                <td><xsl:value-of select="s:lastmod"/></td>
              </tr>
            </xsl:for-each>
          </tbody>
        </table>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
