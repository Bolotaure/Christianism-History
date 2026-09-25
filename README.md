# Christianism-History

Interactive timelines for 10-year-olds, in English, French and Japanese.

Themes (chosen with the drop-down title at the top of the page):
- **History of Christianity**: 52 events, from Abraham to today. Data in `data/`.
- **History of Japan**: 50 events, from the Ice Age to today. Data in `data/japan/`.
- **History of France**: 50 events, from Tautavel Man to today. Data in `data/france/`.
- **History of the United States**: 50 events, from the first Americans to today. Data in `data/usa/`.
- **The French Revolution**: 50 events, from Louis XVI to Bonaparte and the legacy of the Revolution. Data in `data/revolution/`.

Files per theme:
- `events.json` / `events.fr.json` / `events.ja.json`: the events (text, date, period, illustration, reference links).
- `glossary.json` / `glossary.fr.json` / `glossary.ja.json`: explanations of the underlined words.

Illustrations: copies of the Wikimedia Commons images are in `images/<theme>/<event id>.*` (served by GitHub Pages);
each event's `pic` field points to its copy and `image` keeps the Wikimedia original, used as a fallback.

`index.html` loads its data from `raw.githubusercontent.com/Bolotaure/Christianism-History/main/data/`.
To change a story or an explanation, edit the JSON only.

The globe button at the top right switches the language. Theme and language are remembered on the device, and the last card opened in each theme is marked with a check mark (a bookmark) that the timeline scrolls to.
A link ending in `#japan`, `#france`, `#usa`, `#revolution`, `#fr`, `#ja-japan`, etc. opens a specific theme and/or language.

Open it at https://bolotaure.github.io/Christianism-History/
or https://htmlpreview.github.io/?https://github.com/Bolotaure/Christianism-History/blob/main/index.html
