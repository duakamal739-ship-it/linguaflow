# 🌐 LinguaFlow — Universal Translator

A beautiful, production-ready language translation web app with a dark editorial aesthetic.

---

## ✨ Features

- **Real-time Translation** — Auto-translates as you type (debounced)
- **50+ Languages** — Full language database with flags
- **Auto Language Detection** — Detects source language automatically
- **Text-to-Speech** — Listen to both source and translated text
- **Copy & Share** — One-click copy; native share sheet on mobile
- **Swap Languages** — Instantly swap source/target languages
- **Paste from Clipboard** — Paste button for quick input
- **Translation History** — Last 50 translations saved locally
- **Character Counter** — Live count with 5000-char limit warning
- **Confidence Score** — Shows API match quality percentage
- **Quick Language Chips** — One-click popular language selection
- **Keyboard Shortcut** — `Ctrl/Cmd + Enter` to translate
- **Fully Responsive** — Works on desktop, tablet, and mobile

---

## 🗂️ Project Structure

```
linguaflow/
├── index.html          ← Main HTML (entry point)
├── css/
│   └── style.css       ← Complete design system & styles
├── js/
│   ├── languages.js    ← Language database (70+ languages)
│   ├── translator.js   ← API integration + TTS + clipboard
│   └── ui.js           ← UI controller, events, history
└── README.md           ← This file
```

---

## 🚀 Getting Started

### Option 1 — Open directly
Just open `index.html` in any modern browser. **No server needed.**

### Option 2 — Local dev server
```bash
# Python
python -m http.server 3000

# Node (npx)
npx serve .

# VS Code
# Install "Live Server" extension, right-click index.html → "Open with Live Server"
```

---

## 🌐 API Used

**MyMemory Translation API** — [https://mymemory.translated.net](https://mymemory.translated.net)

- ✅ **Free** — No API key required
- ✅ **No sign-up** — Works instantly
- ✅ **50+ languages** supported
- ⚠️ **Rate limit** — ~5,000 words/day per IP (free tier)

For higher volume, register a free account at MyMemory for an API key:
```js
// In translator.js, add your email to increase quota:
const params = new URLSearchParams({
  q: text,
  langpair: `${sourceLang}|${targetLang}`,
  de: 'your@email.com',   // ← increases daily limit
});
```

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Background | `#0a0a0f` |
| Surface | `#111118` |
| Gold accent | `#c9a84c` |
| Teal accent | `#2dd4bf` |
| Display font | Playfair Display (serif) |
| Body font | DM Sans |
| Mono font | DM Mono |

---

## 🔧 Customization

### Add more languages
Edit `js/languages.js` — add entries to the `LANGUAGES` array:
```js
{ code: 'xx', name: 'Language Name', flag: '🏳️' }
```

### Change default language pair
In `js/ui.js`, edit `init()`:
```js
sourceLangSel.value = 'en';   // Default source
targetLangSel.value = 'es';   // Default target
```

### Adjust debounce delay
In `js/ui.js`:
```js
translateDebounce = setTimeout(doTranslate, 900); // milliseconds
```

---

## 📱 Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Translation | ✅ | ✅ | ✅ | ✅ |
| Text-to-Speech | ✅ | ✅ | ✅ | ✅ |
| Clipboard API | ✅ | ✅ | ✅* | ✅ |
| Web Share | ✅ | ✅ | ✅ | ✅ |

*Clipboard requires HTTPS or localhost in Safari.

---

## 📄 License
MIT — Free to use, modify, and distribute.
