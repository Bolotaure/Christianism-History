# Christianism-History

Interactive timeline of the history of Christianity, written for 10-year-olds.

- `index.html`: the page (slide the timeline, touch a pin to open a card, touch an underlined word for its explanation).
- `data/events.json` / `data/events.fr.json`: the 52 events in English / French / Japanese (`events.ja.json`) (text, date, period, illustration, reference links).
- `data/glossary.json` / `data/glossary.fr.json`: explanations of the underlined words in English / French / Japanese (`glossary.ja.json`).

The globe button at the top right switches between English, French and Japanese. The choice is remembered on the device.
A link ending in `#en`, `#fr` or `#ja` opens the page directly in that language.

The page loads its data from `raw.githubusercontent.com/Bolotaure/Christianism-History/main/data/`.
To change a story or an explanation, edit the JSON only.
