// ============================================
//  LINGUAFLOW — UI CONTROLLER
// ============================================

// ---- DOM Refs ----
const sourceLangSel  = document.getElementById('sourceLang');
const targetLangSel  = document.getElementById('targetLang');
const sourceTextArea = document.getElementById('sourceText');
const resultArea     = document.getElementById('resultArea');
const resultFooter   = document.getElementById('resultFooter');
const confidenceText = document.getElementById('confidenceText');
const charCountEl    = document.getElementById('charCount');
const translateBtn   = document.getElementById('translateBtn');
const swapBtn        = document.getElementById('swapBtn');
const clearBtn       = document.getElementById('clearBtn');
const copyBtn        = document.getElementById('copyBtn');
const pasteBtn       = document.getElementById('pasteBtn');
const srcSpeakBtn    = document.getElementById('srcSpeakBtn');
const tgtSpeakBtn    = document.getElementById('tgtSpeakBtn');
const shareBtn       = document.getElementById('shareBtn');
const progressBar    = document.getElementById('progressBar');
const statusBar      = document.getElementById('statusBar');
const quickChips     = document.getElementById('quickChips');
const historyToggle  = document.getElementById('historyToggle');
const historyPanel   = document.getElementById('historyPanel');
const historyList    = document.getElementById('historyList');
const clearHistoryBtn= document.getElementById('clearHistoryBtn');
const toastEl        = document.getElementById('toast');

// ---- State ----
let currentTranslation = '';
let currentSourceLang  = 'auto';
let currentTargetLang  = 'fr';
let translateDebounce  = null;
let isLoading          = false;

// ---- Init ----
function init() {
  populateLanguageSelects();
  renderQuickChips();
  renderHistory();
  bindEvents();
  setStatus('Ready to translate — enter text and click Translate.', '');
}

// ---- Populate selects ----
function populateLanguageSelects() {
  // Source: auto + all languages
  sourceLangSel.innerHTML = '<option value="auto">🔍 Auto Detect</option>';
  LANGUAGES.forEach(lang => {
    const opt = document.createElement('option');
    opt.value = lang.code;
    opt.textContent = `${lang.flag} ${lang.name}`;
    sourceLangSel.appendChild(opt);
  });

  // Target: all languages (default French)
  targetLangSel.innerHTML = '';
  LANGUAGES.forEach(lang => {
    const opt = document.createElement('option');
    opt.value = lang.code;
    opt.textContent = `${lang.flag} ${lang.name}`;
    targetLangSel.appendChild(opt);
  });

  sourceLangSel.value = 'auto';
  targetLangSel.value = 'fr';
  currentSourceLang   = 'auto';
  currentTargetLang   = 'fr';
}

// ---- Quick chips ----
function renderQuickChips() {
  quickChips.innerHTML = '';
  POPULAR_TARGETS.forEach(lang => {
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.textContent = `${lang.flag} ${lang.name}`;
    chip.addEventListener('click', () => {
      targetLangSel.value = lang.code;
      currentTargetLang   = lang.code;
      if (sourceTextArea.value.trim()) doTranslate();
      // Scroll to card
      document.getElementById('translatorCard').scrollIntoView({ behavior: 'smooth' });
    });
    quickChips.appendChild(chip);
  });
}

// ---- Events ----
function bindEvents() {
  // Translate button
  translateBtn.addEventListener('click', doTranslate);

  // Auto-translate on input pause (debounce 800ms)
  sourceTextArea.addEventListener('input', () => {
    const len = sourceTextArea.value.length;
    charCountEl.textContent = len;
    charCountEl.parentElement.classList.toggle('warn', len > 4500);
    clearTimeout(translateDebounce);
    if (len > 2) {
      translateDebounce = setTimeout(doTranslate, 900);
    }
  });

  // Keyboard shortcut Ctrl/Cmd + Enter
  sourceTextArea.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      doTranslate();
    }
  });

  // Language selects
  sourceLangSel.addEventListener('change', () => {
    currentSourceLang = sourceLangSel.value;
    if (sourceTextArea.value.trim()) doTranslate();
  });
  targetLangSel.addEventListener('change', () => {
    currentTargetLang = targetLangSel.value;
    if (sourceTextArea.value.trim()) doTranslate();
  });

  // Swap
  swapBtn.addEventListener('click', doSwap);

  // Clear
  clearBtn.addEventListener('click', () => {
    sourceTextArea.value = '';
    charCountEl.textContent = '0';
    resultArea.innerHTML = '<div class="placeholder-text">Translation will appear here…</div>';
    resultFooter.style.display = 'none';
    currentTranslation = '';
    setStatus('Ready to translate.', '');
  });

  // Copy
  copyBtn.addEventListener('click', async () => {
    if (!currentTranslation) { showToast('Nothing to copy yet.', 'error'); return; }
    try {
      await copyToClipboard(currentTranslation);
      showToast('Translation copied! ✓', 'success');
    } catch {
      showToast('Copy failed.', 'error');
    }
  });

  // Paste
  pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      sourceTextArea.value = text;
      charCountEl.textContent = text.length;
      if (text.trim()) doTranslate();
    } catch {
      showToast('Paste not available — try Ctrl+V.', 'error');
    }
  });

  // TTS — source
  srcSpeakBtn.addEventListener('click', () => {
    const text = sourceTextArea.value.trim();
    if (!text) { showToast('Nothing to speak.', 'error'); return; }
    const lang = currentSourceLang === 'auto' ? 'en' : currentSourceLang;
    speakText(text, lang);
  });

  // TTS — target
  tgtSpeakBtn.addEventListener('click', () => {
    if (!currentTranslation) { showToast('No translation yet.', 'error'); return; }
    speakText(currentTranslation, currentTargetLang);
  });

  // Share
  shareBtn.addEventListener('click', async () => {
    if (!currentTranslation) { showToast('No translation to share.', 'error'); return; }
    const shareData = {
      title: 'LinguaFlow Translation',
      text: `Original: ${sourceTextArea.value}\n\nTranslation (${currentTargetLang}): ${currentTranslation}`,
    };
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await copyToClipboard(shareData.text);
      showToast('Copied to clipboard for sharing!', 'success');
    }
  });

  // History toggle
  historyToggle.addEventListener('click', () => {
    const isOpen = historyPanel.style.display !== 'none';
    historyPanel.style.display = isOpen ? 'none' : 'block';
    historyToggle.classList.toggle('active', !isOpen);
    document.querySelector('.pill[id=""]')?.classList.remove('active');
    if (!isOpen) renderHistory();
  });

  clearHistoryBtn.addEventListener('click', () => {
    clearHistory();
    renderHistory();
    showToast('History cleared.', 'success');
  });
}

// ---- Swap languages ----
function doSwap() {
  if (currentSourceLang === 'auto') {
    showToast('Cannot swap with Auto Detect. Select a source language first.', 'error');
    return;
  }
  const prevSource = currentSourceLang;
  const prevTarget = currentTargetLang;

  sourceLangSel.value = prevTarget;
  targetLangSel.value = prevSource;
  currentSourceLang   = prevTarget;
  currentTargetLang   = prevSource;

  // Swap text if there's a translation
  if (currentTranslation) {
    sourceTextArea.value = currentTranslation;
    charCountEl.textContent = currentTranslation.length;
    resultArea.innerHTML = '<div class="placeholder-text">Re-translating…</div>';
    currentTranslation = '';
    doTranslate();
  }
}

// ---- Main translate function ----
async function doTranslate() {
  const text = sourceTextArea.value.trim();
  if (!text) return;
  if (isLoading) return;

  isLoading = true;
  setLoading(true);
  setStatus('Translating…', '');

  try {
    const result = await translateText(text, currentSourceLang, currentTargetLang);
    currentTranslation = result.translatedText;

    // Display result
    resultArea.innerHTML = `<div class="result-text">${escapeHtml(result.translatedText)}</div>`;
    resultFooter.style.display = 'flex';

    // Confidence
    if (result.confidence > 0) {
      confidenceText.textContent = `${result.confidence}% confidence`;
    } else {
      confidenceText.textContent = '';
    }

    // Detected lang
    let statusMsg = `Translated to ${getLangName(currentTargetLang)}`;
    if (result.detectedLang) {
      statusMsg += ` · Detected: ${getLangName(result.detectedLang)}`;
    }
    setStatus(statusMsg, 'success');

    // Save to history
    const srcLangDisplay = currentSourceLang === 'auto'
      ? (result.detectedLang ? getLangName(result.detectedLang) : 'Auto')
      : getLangName(currentSourceLang);

    saveToHistory({
      sourceText:   text,
      targetText:   result.translatedText,
      sourceLang:   srcLangDisplay,
      targetLang:   getLangName(currentTargetLang),
      confidence:   result.confidence,
    });

  } catch (err) {
    setStatus(`Error: ${err.message}`, 'error');
    resultArea.innerHTML = `<div style="color:var(--rose); font-size:14px;">⚠ ${escapeHtml(err.message)}</div>`;
  } finally {
    isLoading = false;
    setLoading(false);
  }
}

// ---- Render history ----
function renderHistory() {
  const history = getHistory();
  if (history.length === 0) {
    historyList.innerHTML = '<div class="history-empty">No translations yet.</div>';
    return;
  }

  historyList.innerHTML = '';
  history.forEach(item => {
    const el = document.createElement('div');
    el.className = 'history-item';
    el.innerHTML = `
      <div class="history-source">${escapeHtml(truncate(item.sourceText, 80))}</div>
      <div class="history-target">${escapeHtml(truncate(item.targetText, 80))}</div>
      <div class="history-meta">
        <span>${item.sourceLang} → ${item.targetLang}</span>
        <span>${timeAgo(item.timestamp)}</span>
        ${item.confidence ? `<span>${item.confidence}% match</span>` : ''}
      </div>
    `;
    // Click to restore
    el.addEventListener('click', () => {
      sourceTextArea.value       = item.sourceText;
      charCountEl.textContent    = item.sourceText.length;
      currentTranslation         = item.targetText;
      resultArea.innerHTML = `<div class="result-text">${escapeHtml(item.targetText)}</div>`;
      resultFooter.style.display = 'flex';
      confidenceText.textContent = item.confidence ? `${item.confidence}% confidence` : '';
      historyPanel.style.display = 'none';
      historyToggle.classList.remove('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    historyList.appendChild(el);
  });
}

// ---- UI Helpers ----
function setLoading(on) {
  progressBar.classList.toggle('active', on);
  translateBtn.classList.toggle('loading', on);
}

function setStatus(msg, type) {
  statusBar.textContent  = msg;
  statusBar.className    = `status-bar ${type}`;
}

function showToast(msg, type = '') {
  toastEl.textContent = msg;
  toastEl.className   = `toast ${type} show`;
  setTimeout(() => { toastEl.classList.remove('show'); }, 2800);
}

function getLangName(code) {
  const found = LANGUAGES.find(l => l.code === code);
  return found ? found.name : code;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br>');
}

function truncate(str, max) {
  return str.length <= max ? str : str.slice(0, max) + '…';
}

function timeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ---- Start ----
document.addEventListener('DOMContentLoaded', init);
