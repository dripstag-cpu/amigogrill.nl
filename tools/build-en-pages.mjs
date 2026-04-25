// Mechanical transform: clone NL pages to /pages/en/ with corrected paths,
// nav links, language switcher, and common UI strings.
// Per-page unique content is translated separately by hand.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());
const NL_DIR = path.join(ROOT, 'pages');
const EN_DIR = path.join(ROOT, 'pages', 'en');

await mkdir(EN_DIR, { recursive: true });

// NL → EN slug map for internal navigation
const slugMap = {
  'menu.html': 'menu.html',
  'verhaal.html': 'our-story.html',
  'terras.html': 'terrace.html',
  'bedrijfsuitjes.html': 'business-events.html',
  'contact.html': 'contact.html',
  'reserveren.html': 'book.html',
  'privacy.html': 'privacy.html',
  'cookies.html': 'cookies.html',
  'home.html': 'home.html',
};

// Pages to process — order matters
const pages = [
  { src: 'privacy.html', dest: 'privacy.html', breadcrumb: 'Privacy' },
  { src: 'cookies.html', dest: 'cookies.html', breadcrumb: 'Cookies' },
  { src: 'verhaal.html', dest: 'our-story.html', breadcrumb: 'Our story' },
  { src: 'terras.html', dest: 'terrace.html', breadcrumb: 'Terrace' },
  { src: 'bedrijfsuitjes.html', dest: 'business-events.html', breadcrumb: 'Private events' },
  { src: 'contact.html', dest: 'contact.html', breadcrumb: 'Contact' },
  { src: 'reserveren.html', dest: 'book.html', breadcrumb: 'Book' },
  { src: 'menu.html', dest: 'menu.html', breadcrumb: 'Menu' },
];

for (const p of pages) {
  const srcPath = path.join(NL_DIR, p.src);
  const destPath = path.join(EN_DIR, p.dest);
  let html = await readFile(srcPath, 'utf8');

  // 1. Lang attribute
  html = html.replace('<html lang="nl">', '<html lang="en">');

  // 2. Asset paths: ../assets → ../../assets
  html = html.replaceAll('../assets/', '../../assets/');

  // 3. shared.css path: shared.css → ../shared.css
  html = html.replaceAll('href="shared.css"', 'href="../shared.css"');
  html = html.replaceAll("href='shared.css'", "href='../shared.css'");

  // 4. Internal nav links — NL slugs to EN slugs
  for (const [nlSlug, enSlug] of Object.entries(slugMap)) {
    if (nlSlug === enSlug) continue;
    // Match href="<nlSlug>" but not href="../<nlSlug>" (which we'll add for NL switcher)
    html = html.replaceAll(`href="${nlSlug}"`, `href="${enSlug}"`);
    html = html.replaceAll(`href="${nlSlug}#`, `href="${enSlug}#`);
  }

  // 5. Nav menu labels (Dutch → English)
  const navReplacements = [
    [/<a href="menu\.html">Menu<\/a>/g, '<a href="menu.html">Menu</a>'],
    [/<a href="our-story\.html">Ons verhaal<\/a>/g, '<a href="our-story.html">Our story</a>'],
    [/<a href="our-story\.html"([^>]*aria-current[^>]*)>Ons verhaal<\/a>/g, '<a href="our-story.html"$1>Our story</a>'],
    [/<a href="terrace\.html">Terras<\/a>/g, '<a href="terrace.html">Terrace</a>'],
    [/<a href="terrace\.html"([^>]*aria-current[^>]*)>Terras<\/a>/g, '<a href="terrace.html"$1>Terrace</a>'],
    [/<a href="business-events\.html">Bedrijfsuitjes<\/a>/g, '<a href="business-events.html">Private events</a>'],
    [/<a href="business-events\.html"([^>]*aria-current[^>]*)>Bedrijfsuitjes<\/a>/g, '<a href="business-events.html"$1>Private events</a>'],
    [/<a href="contact\.html">Contact<\/a>/g, '<a href="contact.html">Contact</a>'],
    [/<a href="contact\.html"([^>]*aria-current[^>]*)>Contact<\/a>/g, '<a href="contact.html"$1>Contact</a>'],
    [/aria-label="Hoofdmenu"/g, 'aria-label="Main menu"'],
    [/aria-label="Mobiel menu"/g, 'aria-label="Mobile menu"'],
    [/aria-label="Menu openen"/g, 'aria-label="Open menu"'],
    [/aria-label="Snelmenu mobiel"/g, 'aria-label="Mobile quick menu"'],
    [/aria-label="Kruimelpad"/g, 'aria-label="Breadcrumb"'],
  ];
  for (const [re, rep] of navReplacements) html = html.replace(re, rep);

  // 6. Language switcher — NL becomes link, EN becomes active
  html = html.replace(
    /<div class="lang-switcher">\s*<a href="#" class="active" aria-current="true">NL<\/a>\s*<span class="sep" aria-hidden="true">\|<\/span>\s*<a href="#" hreflang="en">EN<\/a>\s*<\/div>/,
    `<div class="lang-switcher">
        <a href="../${p.src}" hreflang="nl">NL</a>
        <span class="sep" aria-hidden="true">|</span>
        <a href="${p.dest}" class="active" aria-current="true">EN</a>
      </div>`
  );

  // 7. Reserveer button → Book
  html = html.replace(/<a href="book\.html" class="btn btn-primary btn-header">Reserveer<\/a>/g, '<a href="book.html" class="btn btn-primary btn-header">Book</a>');

  // 8. Mobile dock common labels
  html = html.replace(/<a href="menu\.html" class="dock-item">Menu<\/a>/g, '<a href="menu.html" class="dock-item">Menu</a>');
  html = html.replace(/<a href="tel:\+31208451081" class="dock-item">Bel<\/a>/g, '<a href="tel:+31208451081" class="dock-item">Call</a>');
  html = html.replace(/<a href="book\.html" class="dock-item dock-primary">Reserveer<\/a>/g, '<a href="book.html" class="dock-item dock-primary">Book</a>');

  // 9. Mobile menu footer
  html = html.replace(/Prinsengracht 188, Amsterdam<br>\s*020 845 1081 · open tot 00:00/g, 'Prinsengracht 188, Amsterdam<br>\n      +31 20 845 1081 · open until 00:00');

  // 10. Footer common
  html = html.replace(/Argentijns vuur aan de gracht, sinds 2011\./g, 'Argentinian fire on the canal, since 2011.');
  html = html.replace(/<h3 class="footer-col-title">Menukaart<\/h3>/g, '<h3 class="footer-col-title">Menu</h3>');
  html = html.replace(/<a href="menu\.html#sterk">Wijnkaart<\/a>/g, '<a href="menu.html#wines">Wine list</a>');
  html = html.replace(/<a href="business-events\.html">Bedrijfsuitjes<\/a>/g, '<a href="business-events.html">Private events</a>');
  html = html.replace(/<a href="terrace\.html">Terras<\/a>/g, '<a href="terrace.html">Terrace</a>');
  html = html.replace(/<a href="our-story\.html">Ons verhaal<\/a>/g, '<a href="our-story.html">Our story</a>');
  html = html.replace(/<h3 class="footer-col-title">Openingstijden<\/h3>/g, '<h3 class="footer-col-title">Opening hours</h3>');
  html = html.replace(/<span class="footer-hours-label">Ma–Do:<\/span>/g, '<span class="footer-hours-label">Mon–Thu:</span>');
  html = html.replace(/<span class="footer-hours-label">Vr–Za:<\/span>/g, '<span class="footer-hours-label">Fri–Sat:</span>');
  html = html.replace(/<span class="footer-hours-label">Zondag:<\/span>/g, '<span class="footer-hours-label">Sunday:</span>');
  html = html.replace(/<h3 class="footer-col-title">Blijf op de hoogte<\/h3>/g, '<h3 class="footer-col-title">Stay in the loop</h3>');
  html = html.replace(/<p>Nieuwe menu's, events en seizoensgerechten\.<\/p>/g, "<p>New menus, events and seasonal dishes.</p>");
  html = html.replace(/placeholder="email@voorbeeld\.nl" aria-label="E-mailadres"/g, 'placeholder="email@example.com" aria-label="Email address"');
  html = html.replace(/<button type="submit">Aanmelden<\/button>/g, '<button type="submit">Subscribe</button>');
  html = html.replace(/© 2026 Amigo Grill · KvK 12345678/g, '© 2026 Amigo Grill · CoC 12345678');

  // 11. Breadcrumb update — keep <li><a href="home.html">Home</a></li>; replace second li label
  html = html.replace(
    /<ol>\s*<li><a href="home\.html">Home<\/a><\/li>\s*<li aria-current="page">[^<]+<\/li>\s*<\/ol>/,
    `<ol>\n      <li><a href="home.html">Home</a></li>\n      <li aria-current="page">${p.breadcrumb}</li>\n    </ol>`
  );

  // 12. Telephone display "020 845 1081" → "+31 20 845 1081" in visible text
  html = html.replace(/>020 845 1081</g, '>+31 20 845 1081<');

  // 13. JSON-LD URL updates: amigogrill.nl/<slug>/ → amigogrill.nl/en/<en-slug>/
  const urlRewrites = {
    'amigogrill.nl/privacy/': 'amigogrill.nl/en/privacy/',
    'amigogrill.nl/cookies/': 'amigogrill.nl/en/cookies/',
    'amigogrill.nl/ons-verhaal/': 'amigogrill.nl/en/our-story/',
    'amigogrill.nl/terras/': 'amigogrill.nl/en/terrace/',
    'amigogrill.nl/bedrijfsuitjes/': 'amigogrill.nl/en/business-events/',
    'amigogrill.nl/contact/': 'amigogrill.nl/en/contact/',
    'amigogrill.nl/reserveren/': 'amigogrill.nl/en/book/',
    'amigogrill.nl/menu/': 'amigogrill.nl/en/menu/',
  };
  for (const [from, to] of Object.entries(urlRewrites)) {
    html = html.replaceAll(from, to);
  }

  // 14. inLanguage in JSON-LD
  html = html.replaceAll('"inLanguage":"nl-NL"', '"inLanguage":"en-US"');
  html = html.replaceAll('"inLanguage": "nl-NL"', '"inLanguage": "en-US"');

  // 15. og:locale
  html = html.replace(/<meta property="og:locale" content="nl_NL">/g, '<meta property="og:locale" content="en_US">');
  // og:locale:alternate doesn't exist on these pages typically, but if it does, swap
  html = html.replace(/<meta property="og:locale:alternate" content="en_US">/g, '<meta property="og:locale:alternate" content="nl_NL">');

  await writeFile(destPath, html);
  console.log(`Built: pages/en/${p.dest}`);
}

console.log('\nMechanical transform complete. Now manually translate per-page content sections.');
