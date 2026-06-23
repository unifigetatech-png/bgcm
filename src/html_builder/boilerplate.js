const LANG = 'en-AU';
const ROBOTS = 'noindex, nofollow';
const THEME_COLOUR = '#1A5A9A';
export const STYLESHEET_VERSION = '1.0.2';
const CSP = [
  "default-src 'self'",
  "script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://region1.google-analytics.com 'unsafe-inline'",
  "style-src 'self' https://fonts.googleapis.com 'unsafe-inline'",
  'font-src https://fonts.gstatic.com',
  'frame-src https://booking.burleighmotel.com.au https://www.google.com https://maps.google.com',
  "img-src 'self' data: https://static.wixstatic.com https://i.ytimg.com https://www.google-analytics.com",
  "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com",
].join('; ');
const FONT_URL = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Nunito+Sans:wght@400;600;700;800;900&display=swap';
const DEFAULT_OG_IMAGE = 'https://www.burleighmotel.com.au/images/motel/exterior/burleigh-motel-mural-full-facade-gold-coast-highway-miami.webp';
const DEFAULT_OG_IMAGE_ALT = 'Burleigh Gold Coast Motel exterior — 1908 Gold Coast Highway Miami QLD';

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function withStylesheetVersion(href) {
  if (!href.startsWith('/css/') || href.includes('?')) {
    return href;
  }

  return `${href}?v=${STYLESHEET_VERSION}`;
}

function renderStylesheetLinks(stylesheets) {
  return stylesheets
    .map((href) => `<link rel="stylesheet" href="${escapeHtml(withStylesheetVersion(href))}">`)
    .join('\n');
}

function renderInlineStyles(inlineStyles) {
  if (inlineStyles === '') {
    return '';
  }

  return `<style>\n${inlineStyles}\n</style>`;
}

function renderSchemaBlock(schemaJson) {
  if (schemaJson === '') {
    return '';
  }

  return [
    '<!-- Schema.org JSON-LD -->',
    '<script type="application/ld+json">',
    schemaJson,
    '</script>',
  ].join('\n');
}

/**
 * Builds the shared HTML5 document shell used across site pages.
 *
 * @param {string} title - Document title
 * @param {string} description - Meta description
 * @param {string} canonical - Canonical URL
 * @param {string} ogUrl - Open Graph URL
 * @param {string} bodyContent - HTML inserted after the skip link
 * @param {string[]} extraStylesheets - Additional stylesheet hrefs after chrome.css
 * @param {string} inlineStyles - Optional page-specific CSS
 * @param {string} schemaJson - Optional JSON-LD payload (pre-formatted JSON string)
 * @param {string} ogImage - Open Graph image URL
 * @param {string} ogImageAlt - Open Graph image alt text
 * @returns {string} Complete HTML document
 */
export function generateBoilerplate(
  title,
  description,
  canonical,
  ogUrl,
  bodyContent,
  extraStylesheets,
  inlineStyles,
  schemaJson,
  ogImage,
  ogImageAlt,
) {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeCanonical = escapeHtml(canonical);
  const safeOgUrl = escapeHtml(ogUrl);
  const safeOgImage = escapeHtml(ogImage);
  const safeOgImageAlt = escapeHtml(ogImageAlt);
  const stylesheetLinks = renderStylesheetLinks(['/css/chrome.css', ...extraStylesheets]);

  return `<!DOCTYPE html>
<html lang="${LANG}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="${ROBOTS}">
<title>${safeTitle}</title>
<meta name="description" content="${safeDescription}">
<meta property="og:title" content="${safeTitle}">
<meta property="og:description" content="${safeDescription}">
<meta property="og:type" content="website">
<meta property="og:url" content="${safeOgUrl}">
<meta property="og:image" content="${safeOgImage}">
<meta property="og:image:alt" content="${safeOgImageAlt}">
<meta property="og:locale" content="en_AU">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="${THEME_COLOUR}">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<link rel="canonical" href="${safeCanonical}">

<!-- Favicons -->
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">

<!-- Performance hints -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://booking.burleighmotel.com.au">

${renderSchemaBlock(schemaJson)}
<link rel="preload" as="style" href="${FONT_URL}">
<link rel="stylesheet" href="${FONT_URL}" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="${FONT_URL}"></noscript>

<!-- Hardcoded version control token forces instant cache updates for all users -->
${stylesheetLinks}
${renderInlineStyles(inlineStyles)}
</head>
<body>

<a href="#main-content" class="skip-link">Skip to main content</a>

${bodyContent}
</body>
</html>
`;
}

export { DEFAULT_OG_IMAGE, DEFAULT_OG_IMAGE_ALT };
