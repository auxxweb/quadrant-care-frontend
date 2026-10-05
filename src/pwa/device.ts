export function isStandalonePwa() {
  return (
    window.matchMedia('(display-mode: standalone)').matches
    || window.matchMedia('(display-mode: fullscreen)').matches
    || (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isIos() {
  const ua = window.navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
}

export function isAndroid() {
  return /android/i.test(window.navigator.userAgent);
}
