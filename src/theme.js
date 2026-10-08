// This small controller is inlined in <head>; it must not depend on the DOM body.
(() => {
  const key = 'personal-home-theme';
  const media = matchMedia('(prefers-color-scheme: dark)');
  const valid = value => value === 'light' || value === 'dark';
  const read = () => { try { return localStorage.getItem(key); } catch { return null; } };
  let preference = read();
  let current;
  function apply() {
    current = valid(preference) ? preference : (media.matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = current;
    document.documentElement.style.colorScheme = current;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', current === 'dark' ? '#172b2c' : '#e9eee5');
    window.dispatchEvent(new CustomEvent('site-theme-change', {detail: {theme: current}}));
  }
  window.siteTheme = {
    get current() { return current; },
    toggle() {
      preference = current === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(key, preference); } catch { /* Still works in this page. */ }
      apply();
    }
  };
  media.addEventListener('change', () => { if (!valid(preference)) apply(); });
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) { preference = read(); apply(); }
  });
  window.addEventListener('pageshow', event => {
    if (event.persisted) { preference = read(); apply(); }
  });
  apply();
})();
