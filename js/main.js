// Theme switch, motion, Design / Code tabs, case study contents highlighting, and the footer year.

const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// Light / dark theme. Light is the default; a visitor's choice is remembered.

const toggle = document.querySelector('.theme-toggle');
const syncToggle = () => {
  const dark = root.dataset.theme === 'dark';
  toggle.setAttribute('aria-pressed', String(dark));
};
if (toggle) {
  syncToggle();
  toggle.addEventListener('click', () => {
    const dark = root.dataset.theme !== 'dark';
    if (dark) root.dataset.theme = 'dark';
    else delete root.dataset.theme;
    try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch (e) { /* storage blocked: theme still switches */ }
    syncToggle();
  });
}

// Header shrinks once the page is scrolled.

const header = document.querySelector('.site-header');
const onHeaderScroll = () => header && header.classList.toggle('is-small', window.scrollY > 40);
window.addEventListener('scroll', onHeaderScroll, { passive: true });
onHeaderScroll();

// Design / Code tabs on case study pages.

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

// Case study contents: highlight the section being read.

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

// Design to code story: the step follows how far the pinned section has scrolled.
// It works with reduced motion too; only the transitions are switched off.

const story = document.querySelector('.story-track');
const morph = document.querySelector('.morph');
const storySteps = document.querySelectorAll('.story-steps li');
const storyBar = document.querySelector('.story-progress i');

const updateStory = () => {
  if (!story) return;
  const box = story.getBoundingClientRect();
  const travel = box.height - window.innerHeight * 0.85;
  const progress = Math.min(1, Math.max(0, -box.top / travel));
  const step = progress < 0.34 ? 0 : progress < 0.67 ? 1 : 2;
  morph.dataset.step = step;
  storySteps.forEach((li, i) => li.classList.toggle('is-on', i === step));
  storyBar.style.width = `${progress * 100}%`;
};

// Split text into word spans, keeping nested tags like <em>.

const splitWords = (el, className, startIndex = 0) => {
  let i = startIndex;
  const walk = (node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (!part.trim()) { frag.append(part); return; }
          const span = document.createElement('span');
          span.className = className;
          span.style.setProperty('--i', i++);
          span.textContent = part;
          frag.append(span);
        });
        child.replaceWith(frag);
      } else {
        walk(child);
      }
    });
  };
  walk(el);
  return el.querySelectorAll(`.${className}`);
};

let updateMotion = () => {};

if (!reduceMotion) {
  root.classList.add('motion');

  // 1. Hero headline rises in word by word.
  const hero = document.querySelector('.hero');
  if (hero) {
    splitWords(hero.querySelector('h1'), 'w');
    requestAnimationFrame(() => hero.classList.add('is-in'));
  }

  // 4. Cards arrive one after another as their section scrolls into view.
  const groups = [document.querySelectorAll('.work-grid .project-card'), document.querySelectorAll('.toolkits .toolkit')];
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('is-in');
      revealObserver.unobserve(el);
      // After the entrance, switch to quick transitions so hover feels responsive.
      const delay = (parseFloat(el.style.getPropertyValue('--i')) || 0) * 110 + 850;
      setTimeout(() => el.classList.add('is-settled'), delay);
    });
  }, { threshold: 0.15 });
  groups.forEach((items) => items.forEach((el, i) => {
    el.classList.add('reveal');
    el.style.setProperty('--i', i % 2);
    revealObserver.observe(el);
  }));

  // 5. Project cards tilt toward the pointer, with a soft light on the screenshot.
  if (canHover) {
    document.querySelectorAll('.project-card').forEach((card) => {
      const stage = card.querySelector('.stage');
      card.addEventListener('pointermove', (e) => {
        if (!card.classList.contains('is-settled')) return;
        const box = card.getBoundingClientRect();
        const x = (e.clientX - box.left) / box.width;
        const y = (e.clientY - box.top) / box.height;
        card.style.transform = `translateY(-4px) rotateX(${(0.5 - y) * 6}deg) rotateY(${(x - 0.5) * 8}deg)`;
        stage.style.setProperty('--mx', `${x * 100}%`);
        stage.style.setProperty('--my', `${y * 100}%`);
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  }

  // 6. A heading that darkens word by word as you scroll past it.
  const fills = Array.from(document.querySelectorAll('.fill-text')).map((el) => ({ el, words: splitWords(el, 'fw') }));

  // 3. Case study screenshots grow to full size as they scroll into view.
  const growers = document.querySelectorAll('.case-figure .figure-stage img');

  updateMotion = () => {
    const vh = window.innerHeight;
    fills.forEach(({ el, words }) => {
      const top = el.getBoundingClientRect().top;
      const progress = Math.min(1, Math.max(0, (vh * 0.9 - top) / (vh * 0.45)));
      const lit = Math.round(progress * words.length);
      words.forEach((w, i) => w.classList.toggle('is-lit', i < lit));
    });
    growers.forEach((img) => {
      const top = img.parentElement.getBoundingClientRect().top;
      const t = Math.min(1, Math.max(0, (vh - top) / (vh * 0.7)));
      img.style.setProperty('--grow', (0.86 + 0.14 * t).toFixed(3));
      img.style.setProperty('--fade', (0.6 + 0.4 * t).toFixed(3));
    });
  };
}

let ticking = false;
const onScroll = () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    updateStory();
    updateMotion();
    ticking = false;
  });
};
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
updateStory();
updateMotion();

document.querySelectorAll('[data-year]').forEach((el) => {
  el.textContent = new Date().getFullYear();
});
