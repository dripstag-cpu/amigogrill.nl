# Amigo Grill — Website

Statische website voor Amigo Grill, Argentijns steakhouse aan de Prinsengracht 188, Amsterdam.

## Structuur

```
/
├── index.html              → redirect naar pages/home.html
├── robots.txt              → AI + search bot directives
├── sitemap.xml             → alle 9 pagina's
├── vercel.json             → cache headers voor assets
├── assets/
│   ├── css/
│   ├── images/
│   ├── js/                 → main.js, motion.js, menu-scrollspy.js
│   └── video/
└── pages/
    ├── home.html
    ├── menu.html
    ├── reserveren.html
    ├── verhaal.html        → Ons verhaal
    ├── terras.html
    ├── bedrijfsuitjes.html
    ├── contact.html
    ├── privacy.html
    ├── cookies.html
    └── shared.css
```

## Lokaal draaien

Geen build-stap nodig — pure HTML/CSS/JS. Open `index.html` in een browser, of draai een eenvoudige lokale server:

```bash
# Python 3
python -m http.server 8000

# Of Node (npx)
npx serve .
```

Bezoek dan `http://localhost:8000/`.

## Deployen

Wordt automatisch via Vercel gedeployed bij elke push naar `main`.

## SEO / AI

- JSON-LD (schema.org) op elke pagina: Restaurant, WebPage, BreadcrumbList, FAQPage waar relevant
- Open Graph + Twitter Card tags
- `robots.txt` staat expliciet GPTBot, ChatGPT-User, PerplexityBot, ClaudeBot, Google-Extended, CCBot toe
- `sitemap.xml` lijst alle pagina's

## Credits

Foto's: eigen restaurant · Fonts: Fraunces + Inter via Google Fonts · TheFork reserverings-widget
