# Skaluenzen

Web-Tool für Gitarren-Skalenübungen. Erzeugt für jede Tonart, Leiter und Lage fünf Übungsteile als Tabulatur, spielt sie ab und exportiert sie als MusicXML für Guitar Pro.

## Funktionen

- **Leitern:** Tonleiter (Dur, natürliches Moll), Pentatonik, Blues (mit Blue Note)
- **Grundtöne:** alle 12 Dur- und 13 Molltonarten mit korrekter Schreibweise
- **Fingersätze:** Lage (4-Bund-Fenster) oder 3 Töne pro Saite, bei Pentatonik und Blues die fünf Boxen
- **Übungsteile:**
  1. Achteltriolen in Dreiergruppen
  2. Sechzehntel in Vierergruppen
  3. Sechzehntel in Terzen bzw. Sprüngen
  4. Sechzehnteltriolen 1-3-5
  5. Sechzehntel 1-3-5-7
- **Wiedergabe:** Gitarrenklang, Metronom mit Einzähler, Tempo 40 bis 200, Schleife, Mitscrollen
- **Export:** MusicXML mit Tabulatur (Saite und Bund) für Guitar Pro, MuseScore und andere Notenprogramme

## Starten

Keine Abhängigkeiten, kein Build. `index.html` im Browser öffnen.

Oder mit lokalem Server:

```
npm start
```

## Tests

```
npm test
```

Prüft alle Kombinationen aus Leiter, Tongeschlecht, Grundton, Fingersatz, Lage und Umfang, unter anderem:

- jede Lage enthält alle Leitertöne lückenlos und aufsteigend
- jede Gruppe entspricht ihrem Muster (Dreier, Vierer, Sprünge, 1-3-5, 1-3-5-7), auf- und abwärts
- jeder Teil beginnt und endet auf dem Startton und erreicht den höchsten Ton der Lage
- jeder Takt ist genau 4/4 lang
- Saite, Bund und notierte Tonhöhe im MusicXML stimmen überein

## Aufbau

```
index.html          Seite
css/style.css       Gestaltung, helles und dunkles Farbschema
js/core.js          Leitern, Fingersätze, Sequenzen, MusicXML, ZIP (auch in Node nutzbar)
js/app.js           Oberfläche, Tabulatur-Darstellung, Wiedergabe, Export
tests/              Prüfskript für alle Kombinationen
```

Neue Übungsteile kommen in `SECTIONS` in `js/core.js`. Neue Leitern in `TYPES` (Halbtonabstände und Buchstabenschritte für die Schreibweise).

## Guitar Pro

„Für Guitar Pro speichern“ lädt eine `.musicxml` herunter. In Guitar Pro über Datei › Importieren › MusicXML öffnen.
