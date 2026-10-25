# Blog posts: structure and localization

For AI agents. Technical reference for building any blog post and wiring it into the site.

## 1. Folder structure

```
components/blog.html                  list partial of the main page: one card per post
components/blog/<slug>/               one folder per post
├── index.html                        the post, a complete HTML document (required)
├── components/post.html              header partial (only if the post uses component-loader.js)
└── assets/                           the post's own files, free layout
    ├── lang/hu.json, en.json         dictionaries (only if the post uses i18n.js)
    ├── img/                          images; the list card's cover is one of them
    ├── css/                          own styles
    └── js/                           own scripts
```

- `<slug>`: lowercase ASCII letters, digits, hyphens; unique. It is the folder name, the URL segment and part of the list's dictionary keys.
- Depth: a post folder is always exactly three levels below the site root. Shared site files are referenced with `../../../`; the post's own files with paths relative to `index.html`. Do not use absolute (`/…`) paths.
- URL: the folder URL (`https://telexx12.github.io/components/blog/<slug>/`) serves `index.html` and is the share URL. The list links to it with a path relative to the main page: `components/blog/<slug>/`.
- Everything a post owns lives in its folder. Outside it a post touches only `components/blog.html` and the two site dictionaries (section 5).

## 2. Shared files a post can reuse

| File | What it does |
|---|---|
| `assets/js/preferences.js` | Applies and persists theme and language (section 3). Include synchronously in `<head>`, before the styles. On a post, `<html data-page="post">` is required: it switches off the main page's start logic (manual scroll restoration, hash stripping, restoring the saved place). |
| `assets/js/i18n.js` | Localization (section 4). Defines `window.I18n`. |
| `assets/js/component-loader.js` | For every `[data-component="x"]` it fetches `components/x.html` (relative to the page), translates it with `I18n`, replaces the slot, and finally dispatches `components:loaded` on `document`. Include last. |
| `assets/js/components/post.js` | Wiring of the standard post page. Needs `component-loader.js`, `i18n.js`, an `article.post` and the header partial. |
| `assets/css/base.css` | Colour tokens (`--fg`, `--panel`, `--rail`, `--line`, `--muted`, `--body`, `--accent`, `--accent-ink`), fonts, and the dark overrides under `:root[data-theme="dark"]`. |
| `assets/css/components/boot-story.css` | The fixed top bar (`.boot-bar`, `.bar-theme`, `.bar-lang`). Side effect: it hides the page scrollbar. |
| `assets/css/components/post.css` | The standard post look and its block classes (`post-*`). Hides `.post` (`opacity: 0`) until it has `data-ready`: without `post.js`, set that attribute yourself. |

**Standard post** = the shared files above plus the header partial. Load order in `<head>`: `preferences.js`; `base.css`, `boot-story.css`, `post.css`, then own CSS; deferred scripts `i18n.js`, `post.js`, own JS, and `component-loader.js` last. The body has a slot `[data-component="post"]` (the header goes there) and `article.post`.

`post.js` runs on `components:loaded`: it wires every `[data-action]` button (`theme` toggles `html[data-theme]`, `lang` calls `I18n.set`), awaits `I18n.translate(document)`, sets `data-ready` on `.post`, and handles the back link. It expects `.post` and `.post-back` to exist.

The header partial (identical in every post): `.boot-bar` with the back link `.post-back` (`href="../../../"`, text key `menu.blog`) and the buttons `.bar-theme` and `.bar-lang` (`data-action="theme"` / `"lang"`, accessible names `bar.theme` / `bar.lang`). Its keys are resolved from the post's own dictionary, so the three keys must exist there.

Class names of the shared look (`post-hero`, `post-wide`, `post-quote`, `post-code`, `post-table`, `post-note`, `post-more`, …) are defined in `post.css`; read it when you use them.

## 3. What the site needs from a post

1. **Reachable and listed:** the folder URL works, and the list has a card for it (section 5).
2. **Way back:** the main page is the site root. The standard back link calls `history.back()` when `history.length >= 2` and `document.referrer` is same-origin with the same pathname as the link; otherwise it navigates normally to `../../../`. A custom post should do the same. Reason: the main page records `sessionStorage.place` (its scroll position) on `pagehide` once the intro is passed. When Back reloads it, `preferences.js` and `home.js` skip the terminal and restore that position. A plain link to the root works too, but plays the terminal intro.
3. **Language and theme continuity:** `preferences.js` initialises `html[lang]` (`hu` or `en`) and `html[data-theme]` (`light` or `dark`) from `sessionStorage` keys `lang` and `theme`, falling back to `navigator.language` (starts with `hu` gives `hu`, anything else gives `en`) and `prefers-color-scheme`. A `MutationObserver` on the two attributes writes changes back. A post that does not include `preferences.js` must read and write the same keys itself, otherwise the visitor's choice is lost.
4. **Share metadata:** the `<head>` metadata (`title`, `description`, `og:*`) is static. It is the only thing link previews see.

## 4. Localization (`assets/js/i18n.js`)

- **Dictionaries:** flat JSON, key to string, one file per language: `assets/lang/hu.json` and `assets/lang/en.json`. They are fetched relative to the **current document**. On the main page that is the site's dictionaries; in a post it is the post's own `assets/lang/`. The two sets never merge: a post cannot see site keys and the main page cannot see post keys. Both language files must have identical keys.
- **Current language:** `html[lang]`.
- **Attributes** (applied to every matching element inside the translated root): `data-i18n="key"` sets `textContent`, `data-i18n-label="key"` sets `aria-label`, `data-i18n-placeholder="key"` sets `placeholder`. Other attributes (for example `alt`) cannot be translated.
- **API:** `I18n.translate(root, lang)` is async, with `lang` defaulting to the current language. `I18n.set(lang)` translates the whole document, then sets `html[lang]`. The dictionary of each language is fetched once and cached.
- **Missing key:** the element gets an empty string and the console shows `Missing text "key" in <lang>.json`.
- **`textContent` semantics:** the element's whole content is replaced. An element with `data-i18n` must have no child elements, and a value must not contain HTML. Inline formatting (bold, code, links) is done by cutting the text into sibling `<span data-i18n>` pieces next to the formatted elements; the order of pieces is fixed in the HTML, and the spaces belong inside the values.
- **Language-neutral content** (code, paths, URLs, names, numbers) stays in the HTML.
- **When it runs:** the loader translates each fetched partial before inserting it. The page content is translated by the standard `post.js` on `components:loaded`. A post without `post.js` calls `I18n.translate(document)` itself, after its own content exists.
- **Switching:** call `I18n.set("en")` or `I18n.set("hu")`; `preferences.js` persists the new value.
- **Required keys of a standard post** (in both files): `menu.blog`, `bar.theme`, `bar.lang` (header), `meta.date`, `meta.read`, `title`, `lead`, `tag1`, `tag2`. Content keys are free; per-section names such as `s1.title` and `s1.text` are the convention.

## 5. The list (`components/blog.html`) and the site dictionaries

- The partial is loaded into the main page by `data-component="blog"` in `components/boot-story.html`. Only the site dictionaries (`assets/lang/hu.json`, `en.json`) translate it, so every card string lives there. They duplicate title, date, first tag and reading time of the post's own dictionary on purpose; keep both in sync.
- Order: newest first, by hand. One `li.blog-cell` per post. The first one also has `blog-cell--featured` and a `p.blog-latest` line (key `blog.latest`).
- Card structure: `a.blog-card` (`href="components/blog/<slug>/"`) containing `div.blog-frame` (`div.blog-bar` with `i`, a `span` for the first tag and `time.blog-bar-date` with `datetime`, then `img.blog-cover` for the cover) and `div.blog-body` (`p.blog-latest` on the featured card only, `h3.blog-name`, `p.blog-line`, `p.blog-read`). The whole card is one link: no other link inside.
- Keys per post: `blog.<slug>.date`, `.title`, `.line` (one or two sentences), `.tag1`, `.read`. The second tag exists only in the post's dictionary. Other keys of the section: `blog.title`, `blog.lead` (section copy, do not touch), `blog.latest`, `blog.empty.title`, `blog.empty.text`.
- Covers are `<img>` elements. The partial may contain at most one `</svg>`: the VS Code Live Server extension truncates fetched partials with two or more.
- Empty state: with no posts, `p.blog-empty` (containing `span.blog-empty-title` and `span.blog-empty-text`, keys `blog.empty.title` and `blog.empty.text`) replaces the `ul.blog-grid`.
- The list's look is in `assets/css/components/blog.css` and is part of the site.

## 6. Add, edit, remove

**Add**

1. Choose the slug and create `components/blog/<slug>/index.html` with the assets it needs.
2. A standard post also needs the header partial copy and both dictionaries with the required keys.
3. Add the cover image under `assets/img/`.
4. In `components/blog.html` insert the new card first as the featured one. On the previous first card remove `blog-cell--featured` and its `p.blog-latest`. If the list was empty, replace `p.blog-empty` with the `ul.blog-grid`.
5. Add the five card keys to both site dictionaries, next to `blog.latest`.
6. Verify (section 8).

**Edit:** change both dictionaries. If title, summary, date, first tag or reading time change, change the card keys and both `datetime` attributes too. Avoid renaming a slug (shared links break); if it must happen, update the folder, `og:url`, the card `href` and `src`, and the key prefix.

**Remove:** delete the folder, the card and its five keys in both site dictionaries; promote the new first card to featured; if no post is left, restore the empty state. Grep the slug.

**Shared files** (`post.css`, `blog.css`, `post.js`, `preferences.js`, `i18n.js`) reach every post. Re-check every post after changing them, and update this file.

## 7. Conventions

- Code style: no comments in HTML, CSS or JS. JS is an IIFE, constants first, `init()` only wires listeners. Grep before inventing a class name.
- Keep each existing file's line endings (`git ls-files --eol <file>`; restore CRLF after a Write or a multi-line Edit if it said `w/crlf`).
- Do not invent content or facts about the maintainer; ask for what is missing.
- Do not commit or push: report the files to `git add`.
- Talk to the maintainer in Hungarian; write files in English.

## 8. Checks

1. Both dictionaries parse and have identical keys (post and site). Every key used in the post and in `components/blog.html` exists.
2. `components/blog.html` has at most one `</svg>`. No comments in changed code.
3. In a browser (Python Playwright, chromium, firefox and webkit; serve with `python -m http.server`): reach the list as a user does (wait for `.home`, press Space, wait for `.home[data-state="ready"]`, click `.home-tldr`, wait for `.tldr-stage[data-state="ready"]`, click `.tldr-link[href="#blog"]`, wait about 1.8 s), open the post, switch language and theme, use the back link, and open the post URL directly in both languages. Expect no console error or warning (ignore Firefox's `scroll-linked positioning`), no empty translated element, no broken image and no horizontal scroll at 390 px.
4. Look at screenshots of the list and the post in both themes.

Playwright disables the back-forward cache, so Back reloads the main page and exercises the saved-place fallback.
