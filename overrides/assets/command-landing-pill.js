/* Sign-in header: the 1px sentinel lives at document y=16px. No scroll listener. */
(() => {
  const header = document.querySelector('body > header.tle-landing-header');
  const sentinel = document.getElementById('tleHeaderScrollSentinel');
  if (!header || !sentinel) return;
  if (!('IntersectionObserver' in window)) {
    // Keep a static full-width, accessible header if the API is unavailable.
    return;
  }
  const observer = new IntersectionObserver(([entry]) => {
    header.classList.toggle('is-floating', !entry.isIntersecting);
  }, { threshold: 0 });
  observer.observe(sentinel);
})();
