window.I18n = (() => {
    const base = new URL("../lang/", document.currentScript.src);
    const dictionaries = new Map();

    function load(lang) {
        if (!dictionaries.has(lang)) {
            dictionaries.set(lang, fetch(new URL(`${lang}.json`, base)).then((response) => response.json()));
        }
        return dictionaries.get(lang);
    }

    async function translate(root, lang = currentLang()) {
        const texts = await load(lang);
        const text = (key) => {
            if (!(key in texts)) console.warn(`Missing text "${key}" in ${lang}.json`);
            return texts[key] ?? "";
        };
        root.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = text(el.dataset.i18n); });
        root.querySelectorAll("[data-i18n-label]").forEach((el) => el.setAttribute("aria-label", text(el.dataset.i18nLabel)));
    }

    async function set(lang) {
        await translate(document, lang);
        document.documentElement.lang = lang;
    }

    function currentLang() {
        return document.documentElement.lang || "hu";
    }

    load(currentLang());
    return { translate, set };
})();
