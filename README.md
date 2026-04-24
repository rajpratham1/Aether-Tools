# Aether Tools

Aether Tools is a browser-based utility hub with a glassmorphism dashboard, productivity widgets, quick generators, and an embedded website security scanner.

## Current tool set

- Weather and AQI dashboard
- Pomodoro focus timer
- Quick tasks with local persistence
- Password generator with click-to-copy
- QR code generator
- Text analytics
- JSON toolkit for validate, prettify, minify, and copy
- Color studio
- Unit converters
- Alarm clock
- Calendar
- Calculator
- Stopwatch
- Sticky notes
- Embedded security scanner via `security-scanner.html`

## Files

- `index.html`: main Aether Tools dashboard
- `security-scanner.html`: standalone scanner page bundled into the app
- `security-tester.js`: scanner engine used by the standalone and embedded scanner
- `robots.txt`: crawler rules
- `sitemap.xml`: sitemap for the main app and scanner page

## Notes

- The embedded scanner is lazy-loaded for smoother page performance.
- The scanner is browser-based, so cross-origin accuracy improves when a relay proxy is configured.
- User preferences and notes are stored in browser local storage.
