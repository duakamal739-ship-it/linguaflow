// ============================================
//  LINGUAFLOW — TRANSLATION ENGINE
//  Uses MyMemory Free Translation API
//  https://mymemory.translated.net/doc/spec.php
// ============================================

const API_BASE = 'https://api.mymemory.translated.net/get';

/**
 * Translate text using MyMemory API
 * @param {string} text        - Text to translate
 * @param {string} sourceLang  - Source language code (or 'auto')
 * @param {string} targetLang  - Target language code
 * @returns {Promise<{translatedText: string, confidence: number, detectedLang: string|null}>}
 */
async function translateText(text, sourceLang, targetLang) {
  if (!text || !text.trim()) {
    throw new Error('Please enter some text to translate.');
  }
  if (text.length > 5000) {
    throw new Error('Text is too long. Maximum 5000 characters.');
  }

  // Build language pair
  const langPair = sourceLang === 'auto'
    ? `${targetLang}`
    : `${sourceLang}|${targetLang}`;

  const params = new URLSearchParams({
    q:    text.trim(),
    langpair: sourceLang === 'auto' ? `autodetect|${targetLang}` : `${sourceLang}|${targetLang}`,
  });

  const url = `${API_BASE}?${params}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Network error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // MyMemory returns responseStatus 200 for success, 403/429 for rate limit
  if (data.responseStatus === 403) {
    throw new Error('Daily translation limit reached. Try again tomorrow or use a different text.');
  }
  if (data.responseStatus === 429) {
    throw new Error('Too many requests. Please wait a moment before translating again.');
  }
  if (!data.responseData || !data.responseData.translatedText) {
    throw new Error('No translation received. Please try again.');
  }

  const translated    = data.responseData.translatedText;
  const matchPercent  = parseFloat(data.responseData.match) || 0;
  const confidence    = Math.round(matchPercent * 100);

  // Try to detect source language from response
  let detectedLang = null;
  if (sourceLang === 'auto' && data.matches && data.matches.length > 0) {
    const firstMatch = data.matches[0];
    if (firstMatch.source && firstMatch.source !== 'autodetect') {
      detectedLang = firstMatch.source;
    }
  }

  return {
    translatedText: translated,
    confidence,
    detectedLang,
    rawMatches: data.matches || [],
  };
}

/**
 * Use browser Web Speech API for TTS
 * @param {string} text - Text to speak
 * @param {string} lang - BCP-47 language code
 */
function speakText(text, lang) {
  if (!window.speechSynthesis) {
    showToast('Text-to-speech not supported in this browser.', 'error');
    return;
  }
  window.speechSynthesis.cancel();
  const utterance    = new SpeechSynthesisUtterance(text);
  utterance.lang     = lang;
  utterance.rate     = 0.9;
  utterance.pitch    = 1;
  utterance.volume   = 1;
  window.speechSynthesis.speak(utterance);
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
  } else {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity  = '0';
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
}

// ---- History Storage ----
const HISTORY_KEY = 'linguaflow_history';

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveToHistory(entry) {
  const history = getHistory();
  history.unshift({ ...entry, timestamp: Date.now() });
  const trimmed = history.slice(0, 50); // keep last 50
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
}

function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}
