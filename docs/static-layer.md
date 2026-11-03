# Static layer

The site is client-rendered. These hand-kept copies make it readable without JavaScript. Source of truth: assets/lang/{hu,en}.json and components/*.html.

- index.html, inside `<div data-component="boot-story">`: static fallback, en then hu. Text comes from the dictionaries and components; the timeline years come from the `data-year` attributes in components/about.html. The terminal story (traits, filters), UI labels and the form are left out on purpose. component-loader.js replaces the whole placeholder with `slot.replaceWith`.
- assets/css/components/static.css: hides `.static-site` under `@media (scripting: enabled)` and shows it under `html[data-fallback]`.
- assets/js/components/static.js: sets `data-fallback` after 8 s if a `[data-component]` slot is still unfilled. component-loader.js sets it at once when a component fails to load and removes it when loading completes.
- index.html head: description, canonical, Open Graph (image = assets/img/og.png, 2400×1254, light theme), JSON-LD (WebSite + Person; `sameAs` = the profile links in components/about.html).
- llms.txt: English summary of the same facts.
- robots.txt: allows all crawlers and points to the sitemap.
- sitemap.xml: one URL. Add the URL of each blog post (components/blog/<slug>/) when it is published.
- Name: "Dávid Telegdi" in English copy, "Telegdi Dávid" in Hungarian copy. The document title is `site.title` in the dictionaries (i18n.js sets it on load and on language switch). The static `<title>`, meta description, Open Graph, JSON-LD (`alternateName` carries both orders), the static `<h1>`, llms.txt and README.md use the English order.

When site text, work, education, projects or profile links change, update every copy above in the same commit. Keep all copies factual; never add instructions aimed at LLMs.
- google917cbbe478c6fa02.html: Google Search Console verification file. Keep it at the repo root forever; deleting it unverifies the property.
