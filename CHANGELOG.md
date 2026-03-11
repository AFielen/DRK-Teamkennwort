# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.1.0/).

---

## [Unreleased]

### Added
- Print-Styles: Header, Footer und Buttons werden beim Drucken ausgeblendet, Cards brechen nicht um
- Bottom-Sheet-Animationen (`.drk-sheet-enter`, `.drk-backdrop-enter`) als Template-Pattern
- Accessibility: `focus-visible`-Outline für `<details>`/`<summary>` Elemente
- `favicon.svg` (Rotes Kreuz auf rotem Hintergrund) in `public/`
- `CHANGELOG.md` erstellt

### Changed
- Alle Pflichtseiten (Impressum, Datenschutz, Hilfe, Spenden, 404) nutzen jetzt konsequent CSS-Variablen statt Tailwind-Hardcoded-Farben (`bg-gray-50`, `text-gray-900` etc.)
- Impressum vervollständigt: Telefonnummer, Vorstandsname, Umsatzsteuer-ID, Registernummer, Haftungsausschluss
- Datenschutzerklärung erweitert auf 9 nummerierte Abschnitte (Hosting-Platzhalter, Änderungshinweis etc.)
- Hilfe-Seite: Kontakt-E-Mail auf `digitalisierung@drk-aachen.de` aktualisiert, erweiterte Kontaktbox
- Header-Subtitle responsive: Langversion ab `sm:`, Kurzversion auf Mobile
- `tsconfig.json`: `jsx` auf `react-jsx` aktualisiert, `.next/dev/types/**/*.ts` in `include` ergänzt

---

## [1.0.0] – 2026-03-03

### Added
- Initiales DRK App-Template mit Next.js 16, React 19, TypeScript strict, Tailwind CSS 4
- DRK Design-System: CSS-Variablen, Utility-Klassen (`.drk-card`, `.drk-btn-primary` etc.)
- Pflichtseiten: Impressum, Datenschutz, Hilfe, Spenden, 404
- i18n-System (DE/EN) mit shared + app-spezifischen Übersetzungen
- Root-Layout mit DRK-Header (rot) und Footer (hell)
- Animationen: `.drk-fade-in`, `.drk-slide-up`
- Status-Badges: `.drk-badge-success`, `.drk-badge-warning`, `.drk-badge-error`
