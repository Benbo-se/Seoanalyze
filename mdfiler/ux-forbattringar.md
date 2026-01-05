# UX/UI Förbättringar

Genererad: 2026-01-03 av UX-agent
Uppdaterad: 2026-01-05

---

## BETYG: 7/10

Solid grund men behöver polish.

---

## KRITISKT (fixa omedelbart)

1. **Error messages på engelska** - "Analysis failed" ska vara svenska
2. **Kontakt har bara mailto:** - Skapa riktigt kontaktformulär
3. **Ingen keyboard navigation** - Lägg till focus-states (a11y)
4. ~~**FAQ är för lång**~~ ✅ FIXAT 2026-01-05
   - Implementerat collapsible accordion med React useState
   - ChevronDown-ikon som roterar vid öppning
   - "Expandera alla" / "Stäng alla" knappar
   - FAQPage JSON-LD schema för rich snippets
5. **Test-kod i produktion** - Ta bort `noscript`-taggar från `/analys/[jobId]`

---

## HÖGT PRIORITERAT

1. **Progress-indikator saknas** - Användare väntar 30-90s utan feedback
2. **CTA-färger är kaotiska** - Röd, blå, grön, lila används slumpvis
   - Lösning: Endast RÖD för primary, GRÅ för secondary
3. **AI-Analys konkurrerar** med huvudfunktionen i hero - flytta nedåt
4. **Testimonials saknas** - Ingen social proof
5. **Team-info saknas** - Bara emoji på om-oss, inget namn/foto
6. **Kontakt-grid** - 4 kolumner på tablet, bör vara 2x2

---

## MEDEL PRIORITET

1. **Sökfunktion i bloggen** - För framtida skalering
2. **Kopiera-knapp på kodblock** - I bloggartiklar
3. **Uppdatera integritetspolicy-datum** - Står September 2025
4. **AI-chattbot** - Länkas men finns inte - ta bort eller implementera
5. **Bot-sidan** - IP-adresser saknas, tabeller ej responsiva
6. **Inline CSS** - Blanda inte med Tailwind, konvertera allt

---

## LÅG PRIORITET (nice-to-have)

1. Contents-tabell på långa artiklar
2. Dark mode
3. Social media-länkar i footer
4. Hero-video alternativ

---

## VAD SOM FUNGERAR BRA

- Stark value proposition och onboarding utan signup
- Bra informationsarkitektur (FAQ, Blog, Om oss)
- Modern design med Tailwind CSS
- Trust badges (stats, "100% gratis", "Ingen registrering")
- Header-navigation (Blogg, FAQ, Kontakt) - FIXAT 2026-01-03
- Lucide-ikoner istället för emojis (konsistent med resten av kodbasen) - FIXAT 2026-01-03
- FAQ accordion med "Expandera/Stäng alla" - FIXAT 2026-01-05
- FAQPage schema för Google rich snippets - FIXAT 2026-01-05
- Article schema på alla bloggartiklar - FIXAT 2026-01-05
- Emoji → Lucide på kontakt och om-oss sidor - FIXAT 2026-01-05
- Uppdaterad sitemap.xml med korrekta URLs - FIXAT 2026-01-05

---

## MOBIL-PROBLEM

- Feature-cards i 2 kolumner - bör vara 1 på mobil
- Kontakt-kort för tätt packade
- Footer-links med bullet-separators fungerar inte
- "Crawl pages" input för liten
