// Design / Code tabs, case study contents highlighting, and the footer year.

document.querySelectorAll('[role="tablist"]').forEach((list) => {
  const tabs = Array.from(list.querySelectorAll('[role="tab"]'));

  const select = (tab) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', (e) => {
      let next = null;
      if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
      if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === 'Home') next = tabs[0];
      if (e.key === 'End') next = tabs[tabs.length - 1];
      if (next) {
        e.preventDefault();
        select(next);
        next.focus();
      }
    });
  });
});

const tocLinks = document.querySelectorAll('.toc a');
if (tocLinks.length && 'IntersectionObserver' in window) {
  const byId = new Map(Array.from(tocLinks, (a) => [a.hash.slice(1), a]));
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      tocLinks.forEach((a) => a.classList.remove('is-active'));
      const link = byId.get(entry.target.id);
      if (link) link.classList.add('is-active');
    });
  }, { rootMargin: '-30% 0px -60% 0px' });
  byId.forEach((_, id) => {
    const section = document.getElementById(id);
    if (section) observer.observe(section);
  });
}

document.querySelectorAll('[data-year]').forEach((el) => {
  el.textContent = new Date().getFullYear();
});
