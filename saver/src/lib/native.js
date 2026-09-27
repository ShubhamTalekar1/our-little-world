// Bridges to the Android/iOS shell. Everything here is a no-op in a browser.
import { useEffect } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';

export const isNative = Capacitor.isNativePlatform();

// Implemented in android/app/src/main/java/.../ShareIntentPlugin.java
const ShareIntent = registerPlugin('ShareIntent');

const joinShare = ({ title, text } = {}) => {
  if (!text && !title) return null;
  // Most apps put everything in text; some send the page title separately.
  return title && text && !text.includes(title) ? `${title}\n${text}` : text || title;
};

/** Calls onShare(text) for shares that opened the app and for ones that arrive while it's open. */
export function listenForShares(onShare) {
  if (!isNative) return () => {};
  let handle;
  ShareIntent.getPending()
    .then((s) => {
      const input = joinShare(s);
      if (input) onShare(input);
    })
    .catch(() => {});
  ShareIntent.addListener('share', (s) => {
    const input = joinShare(s);
    if (input) onShare(input);
  }).then((h) => (handle = h));
  return () => handle?.remove();
}

/** Android back button: close what's open, else go back, else leave the app. */
export function listenForBack(handler) {
  if (!isNative) return () => {};
  let handle;
  App.addListener('backButton', () => {
    if (handler()) return;
    if (window.location.hash && window.location.hash !== '#/') window.history.back();
    else App.exitApp();
  }).then((h) => (handle = h));
  return () => handle?.remove();
}

/** In the app, open external links in an in-app browser tab instead of replacing Saver. */
export function interceptExternalLinks() {
  if (!isNative) return;
  document.addEventListener('click', (e) => {
    const a = e.target.closest?.('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!/^https?:\/\//i.test(href)) return;
    e.preventDefault();
    Browser.open({ url: href }).catch(() => window.open(href, '_system'));
  });
}

// Open sheets register here so the back button closes them first.
const sheets = [];
export function useCloseOnBack(onClose) {
  useEffect(() => {
    sheets.push(onClose);
    return () => {
      const i = sheets.lastIndexOf(onClose);
      if (i >= 0) sheets.splice(i, 1);
    };
  }, [onClose]);
}
export function closeTopSheet() {
  const top = sheets[sheets.length - 1];
  if (!top) return false;
  top();
  return true;
}
