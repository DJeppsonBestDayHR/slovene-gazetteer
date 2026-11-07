Vezni List — the website version of the gazetteer. The files, all produced by `python web/build_web.py`:

* `index.html` — the app (reader + data inside, opens instantly); its "Update from the web" button
  looks for the workbook BESIDE it, so a newer workbook dropped into this folder is picked up
  without rebuilding the page.
* `Slovene Lands Place Names 1900.xlsx` — the workbook (same file as the repo root).
* `Vezni List Guide.pdf` — the printable guide (the Guide button inside the app links to it).
* `sw.js` + `manifest.webmanifest` + `roundel.svg` — the offline copy and the home-screen install
  (the page is always fetched from the network first; the kept copy is for no signal). Plus
  `apple-touch-icon.png` and `wallmap.jpg`.

Published from the PUBLIC repository github.com/djeppsonbestdayhr/slovene-gazetteer (Settings → Pages →
Deploy from a branch → main / root). The app lives at https://djeppsonbestdayhr.github.io/slovene-gazetteer/ — on the iPad open it in Safari,
Share → Add to Home Screen (it is named Vezni List). To update later: re-run `python web/build_web.py`
and upload whichever files changed — a new workbook alone is enough for the data.
