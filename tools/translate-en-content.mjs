// Bulk-translates remaining EN pages by replacing common NL phrases with native EN.
// Per-page unique paragraphs (long content) are still done by hand via Edit.

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const EN_DIR = path.join(process.cwd(), 'pages', 'en');

// Pages that still need content translation (home + our-story already done by hand)
const targets = ['terrace.html', 'business-events.html', 'contact.html', 'book.html', 'menu.html', 'privacy.html', 'cookies.html'];

// Common NL → EN replacements (UI strings, buttons, headings)
const replacements = [
  // Section headers
  ['Reserveer een tafel', 'Book a table'],
  ['Bekijk het menu', 'View the menu'],
  ['Reserveer online', 'Book online'],
  ['Reserveer voor parrillada', 'Book for parrillada'],
  ['Bel voor een terrastafel', 'Call for a terrace table'],
  ['Vraag offerte aan', 'Request a quote'],
  ['Bekijk pakketten', 'View packages'],
  ['Bekijk de volledige kaart', 'View the full menu'],
  ['Mail voor offerte', 'Email for a quote'],
  ['Reserveer terras', 'Book terrace'],
  ['Reserveer binnen', 'Book indoor'],
  ['Reserveer een tafel op het terras', 'Book a terrace table'],
  ['Bel voor grote groepen', 'Call for large groups'],
  ['Mail ons', 'Email us'],
  // Common CTAs / nav text
  ['Bel ons', 'Call us'],
  ['Reserveer', 'Book'],
  // Eyebrows
  ['Wat onze gasten zeggen', 'What our guests say'],
  ['Veelgestelde vragen', 'Frequently asked questions'],
  ['Tot vanavond', 'See you tonight'],
  ['Bedrijfsuitjes', 'Private events'],
  ['Goed om te weten', 'Good to know'],
  ['Tot snel', 'See you soon'],
  ['Klaar voor een Argentijnse avond?', 'Ready for an Argentinian evening?'],
  ['Klaar om te reserveren?', 'Ready to book?'],
  ['Reserveer. Wij doen de rest.', "Book. We'll handle the rest."],
  // Common messages
  ['Tijdens openingstijden', 'During opening hours'],
  ['Drie manieren om contact op te nemen', 'Three ways to get in touch'],
  ['Hoe kom je bij ons', 'How to reach us'],
  ['Openingstijden', 'Opening hours'],
  ['Dagelijks geopend', 'Open daily'],
  ['De keuken sluit ongeveer een uur voor sluitingstijd.', 'The kitchen closes about an hour before closing time.'],
  // Days
  ['<dt>Maandag</dt>', '<dt>Monday</dt>'],
  ['<dt>Dinsdag</dt>', '<dt>Tuesday</dt>'],
  ['<dt>Woensdag</dt>', '<dt>Wednesday</dt>'],
  ['<dt>Donderdag</dt>', '<dt>Thursday</dt>'],
  ['<dt>Vrijdag</dt>', '<dt>Friday</dt>'],
  ['<dt>Zaterdag</dt>', '<dt>Saturday</dt>'],
  ['<dt>Zondag</dt>', '<dt>Sunday</dt>'],
  // Contact
  ['Bellen', 'Call'],
  ['Mailen', 'Email'],
  ['WhatsApp openen', 'Open WhatsApp'],
  ['Voor het terras, grote groepen, of specifieke wensen is dit de snelste weg.', 'For the terrace, large groups, or specific requests this is the fastest route.'],
  ['Voor offertes, bedrijfsuitjes, of niet-urgente vragen. We reageren op werkdagen binnen 4 uur.', 'For quotes, private events, or non-urgent questions. We reply within 4 working hours.'],
  ['Korte vragen of last-minute reservering. Stuur een bericht met datum, tijd en aantal personen.', 'Quick questions or last-minute booking. Send a message with date, time, and number of guests.'],
  // Route
  ['Met openbaar vervoer', 'By public transport'],
  ['Met de auto', 'By car'],
  ['Met de fiets', 'By bike'],
  ['Vanaf Anne Frank Huis', 'From the Anne Frank House'],
  ['Vanaf Centraal Station 15 minuten lopen.', "From Central Station, it's a 15-minute walk."],
  ['Met tram 13 of 17 uitstappen bij halte Westermarkt, dan 2 minuten lopen.', 'Take tram 13 or 17 to Westermarkt stop, then 2 minutes on foot.'],
  ['Nachttram 13 rijdt tot 00:30.', 'The night tram line 13 runs until 00:30.'],
  ['Betaald parkeren in de grachtengordel.', 'Paid parking in the canal belt.'],
  ['Parkeergarage Q-Park De Kolk aan de Nieuwezijds Kolk is 5 minuten lopen (200+ plekken).', 'Q-Park De Kolk car park on Nieuwezijds Kolk is 5 minutes on foot (200+ spaces).'],
  ['Parkeren aan de gracht.', 'Park along the canal.'],
  ['Zomeravonden is het vol aan onze kant van de brug — dan staan de fietsen aan de overkant.', 'Summer evenings the bike racks fill up on our side, and bikes get parked across the bridge.'],
  ["3 minuten lopen. Je loopt de Westermarkt op, steekt over, en staat aan de Prinsengracht. Wij zitten links, nummer 188.", "3 minutes' walk. Head onto the Westermarkt, cross over, and you're on the Prinsengracht. We're on the left side, number 188."],
  // Page-hero common
  ['<span class="page-hero-bg-word" aria-hidden="true">Verhaal</span>', '<span class="page-hero-bg-word" aria-hidden="true">Story</span>'],
  ['<span class="page-hero-bg-word" aria-hidden="true">Terras</span>', '<span class="page-hero-bg-word" aria-hidden="true">Terrace</span>'],
  ['<span class="page-hero-bg-word" aria-hidden="true">Bedrijfsuitjes</span>', '<span class="page-hero-bg-word" aria-hidden="true">Events</span>'],
  ['<span class="page-hero-bg-word" aria-hidden="true">Reserveren</span>', '<span class="page-hero-bg-word" aria-hidden="true">Book</span>'],
  // Common single words / fragments
  ['Tip</div>', 'Tip</div>'],
  ['Hoe je het meeste uit de avond haalt', 'How to get the most out of your evening'],
  ['Tips voor een goede terras avond', 'Tips for a good terrace evening'],
  ['Twee seizoenen, twee sferen', 'Two seasons, two atmospheres'],
  ['Het hele jaar door', 'Year-round'],
  // Footer common already in build script but cover misses
  ['Argentijns vuur aan de gracht, sinds 2011.', 'Argentinian fire on the canal, since 2011.'],
];

for (const file of targets) {
  const p = path.join(EN_DIR, file);
  let html = await readFile(p, 'utf8');
  let count = 0;
  for (const [from, to] of replacements) {
    if (html.includes(from)) {
      html = html.replaceAll(from, to);
      count++;
    }
  }
  await writeFile(p, html);
  console.log(`${file}: ${count} replacements applied`);
}
