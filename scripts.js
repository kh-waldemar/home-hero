/* Minimal utilities and state */
const qs = (s, el = document) => el.querySelector(s);
const qsa = (s, el = document) => Array.from(el.querySelectorAll(s));

// Header shrink on scroll
(() => {
  const header = qs('.site-header');
  let lastY = 0;
  const onScroll = () => {
    const y = window.scrollY || document.documentElement.scrollTop;
    header.classList.toggle('shrink', y > 10);
    lastY = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

// Current year
(() => { const y = new Date().getFullYear(); const el = qs('#year'); if (el) el.textContent = String(y); })();

// Reveal on scroll
(() => {
  const items = qsa('.reveal');
  if (!('IntersectionObserver' in window)) { items.forEach(i => i.classList.add('visible')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -10% 0px' });
  items.forEach(i => io.observe(i));
})();

// Story Viewer
const StoryViewer = (() => {
  const el = qs('.story-viewer');
  if (!el) return null;
  const stage = qs('.stage', el);
  const progress = qs('.progress', el);
  const caption = qs('.caption-row .caption', el);
  const ext = qs('.caption-row .ext', el);
  const btnPrev = qs('.zone.prev', el);
  const btnNext = qs('.zone.next', el);
  const btnClose = qs('.close', el);

  let items = [];
  let index = 0;
  let timer = null;
  const DURATION = 5000; // ms per item

  const buildProgress = () => {
    progress.innerHTML = '';
    for (let i = 0; i < items.length; i++) {
      const segWrap = document.createElement('div');
      segWrap.className = 'seg';
      const segFill = document.createElement('div');
      segFill.className = 'seg fill';
      segWrap.appendChild(segFill);
      progress.appendChild(segWrap);
    }
  };

  const setProgress = (i, ratio) => {
    const fills = qsa('.progress .fill', el);
    fills.forEach((f, idx) => {
      if (idx < i) f.style.transform = 'scaleX(1)';
      else if (idx === i) f.style.transform = `scaleX(${Math.max(0, Math.min(1, ratio))})`;
      else f.style.transform = 'scaleX(0)';
    });
  };

  const clearStage = () => { stage.innerHTML = ''; };

  const loadItem = (i) => {
    if (!items[i]) return;
    clearStage();
    const it = items[i];
    const frame = document.createElement('div');
    frame.className = 'frame';
    let node;
    if (it.type === 'video') {
      node = document.createElement('video');
      node.src = it.src;
      node.playsInline = true;
      node.muted = true;
      node.autoplay = true;
      node.loop = false;
      if (it.poster) node.poster = it.poster;
      node.addEventListener('loadedmetadata', () => { /* ready */ });
    } else {
      node = document.createElement('img');
      node.src = it.src;
      node.loading = 'lazy';
      node.alt = it.caption || '';
    }
    frame.appendChild(node);
    stage.appendChild(frame);
    caption.textContent = it.caption || '';
    if (it.link) { ext.hidden = false; ext.href = it.link; } else { ext.hidden = true; ext.removeAttribute('href'); }
  };

  const startTimer = () => {
    const start = performance.now();
    stopTimer();
    const tick = (now) => {
      const elapsed = now - start;
      const ratio = elapsed / DURATION;
      setProgress(index, ratio);
      if (ratio >= 1) { next(); return; }
      timer = requestAnimationFrame(tick);
    };
    timer = requestAnimationFrame(tick);
  };
  const stopTimer = () => { if (timer) cancelAnimationFrame(timer); timer = null; };

  const open = (list, startIdx = 0) => {
    items = list;
    index = startIdx;
    buildProgress();
    loadItem(index);
    setProgress(index, 0);
    el.hidden = false;
    el.classList.add('show');
    document.body.style.overflow = 'hidden';
    startTimer();
  };
  const close = () => {
    stopTimer();
    el.classList.remove('show');
    el.hidden = true;
    document.body.style.overflow = '';
  };
  const prev = () => { index = (index - 1 + items.length) % items.length; loadItem(index); setProgress(index, 0); startTimer(); };
  const next = () => { index = (index + 1) % items.length; loadItem(index); setProgress(index, 0); startTimer(); };

  // Events
  btnPrev.addEventListener('click', prev);
  btnNext.addEventListener('click', next);
  btnClose.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (el.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
  });
  el.addEventListener('pointerdown', () => stopTimer());
  el.addEventListener('pointerup', () => startTimer());

  return { open, close };
})();

// Build gallery items and attach click to open viewer
(() => {
  const figures = qsa('.gallery-item');
  const items = figures.map(fig => ({
    type: fig.dataset.type,
    src: fig.dataset.src,
    poster: fig.dataset.poster,
    caption: fig.dataset.caption,
    link: fig.dataset.link
  }));
  // Render thumbnails into figures
  figures.forEach((fig, i) => {
    const type = fig.dataset.type;
    if (type === 'video') {
      const v = document.createElement('video');
      v.src = fig.dataset.src;
      if (fig.dataset.poster) v.poster = fig.dataset.poster;
      v.playsInline = true; v.muted = true; v.preload = 'metadata';
      fig.appendChild(v);
    } else {
      const img = document.createElement('img');
      img.src = fig.dataset.src; img.loading = 'lazy'; img.alt = fig.dataset.caption || '';
      fig.appendChild(img);
    }
    fig.addEventListener('click', () => { if (StoryViewer) StoryViewer.open(items, i); });
  });
})();

// Estimate form submission
(() => {
  const form = qs('#estimate-form');
  if (!form) return;
  const submitBtn = qs('#submitBtn', form);
  const statusEl = qs('#form-status', form);
  const start = Date.now();

  // enable after 3s
  setTimeout(() => { submitBtn.disabled = false; }, 3000);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusEl.hidden = true; statusEl.textContent = '';
    const data = new FormData(form);
    const name = (data.get('name') || '').toString().trim();
    const phone = (data.get('phone') || '').toString().trim();
    const email = (data.get('email') || '').toString().trim();
    const projectType = (data.get('projectType') || '').toString();
    const message = (data.get('message') || '').toString();
    const honeypot = (data.get('website') || '').toString();

    if (honeypot) return; // bot
    if (!name || !phone) {
      statusEl.hidden = false; statusEl.textContent = 'Please provide name and phone.'; return;
    }
    if (Date.now() - start < 3000) {
      statusEl.hidden = false; statusEl.textContent = 'Please wait a moment before submitting.'; return;
    }

    // UTM params
    const url = new URL(window.location.href);
    const utm = { source: url.searchParams.get('utm_source') || '', medium: url.searchParams.get('utm_medium') || '', campaign: url.searchParams.get('utm_campaign') || '' };

    const payload = {
      source: 'website-landing',
      timestamp: new Date().toISOString(),
      name, phone, email, projectType, message,
      utm
    };

    const WEBHOOK = '{N8N_WEBHOOK_URL}'; // replace later

    try {
      submitBtn.disabled = true;
      const res = WEBHOOK && WEBHOOK.startsWith('http') ? await fetch(WEBHOOK, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      }) : { ok: false };

      if (res.ok) {
        statusEl.hidden = false;
        statusEl.innerHTML = 'Thanks! We\'ll be in touch shortly. <a class="text-link" href="/pages/thank-you.html">Continue</a>';
        form.reset();
      } else {
        throw new Error('Webhook not configured or failed');
      }
    } catch (err) {
      console.warn('Submit failed', err);
      statusEl.hidden = false;
      const body = encodeURIComponent(`Name: ${name}\nPhone: ${phone}\nEmail: ${email}\nProject: ${projectType}\nMessage: ${message}`);
      statusEl.innerHTML = `There was a problem sending your request. You can email us directly: <a class="text-link" href="mailto:homeheroremodelingllc@gmail.com?subject=Estimate%20Request&body=${body}">homeheroremodelingllc@gmail.com</a>`;
    } finally {
      submitBtn.disabled = false;
    }
  });
})();

// GA4 placeholder
function initGA(measurementId) {
  if (!measurementId) return; // no-op if empty
  // Placeholder: user can insert GA4 gtag script later if desired.
  console.info('GA init placeholder', measurementId);
}

// Reviews carousel (infinite marquee-style with lazy iframes)
async function initReviewsCarousel() {
  const track = document.getElementById('reviews-track');
  if (!track) return;

  try {
    const res = await fetch('assets/reviews-embeds.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load embeds');
    const embeds = await res.json();

    const makeSlide = (item) => {
      const slide = document.createElement('div');
        slide.className = 'review-card';
        slide.innerHTML = `<iframe loading="lazy" data-src="${item.src}" scrolling="no" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowfullscreen="true"></iframe>`;
      return slide;
    };

    const viewportW = track.parentElement.clientWidth || window.innerWidth;
    let widthSum = 0, idx = 0;
    while (widthSum < viewportW * 2 && embeds.length) {
      const item = embeds[idx % embeds.length];
      const slide = makeSlide(item);
      track.appendChild(slide);
      widthSum += 376; // approx slide width + gap
      idx++;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const iframe = e.target.querySelector('iframe');
          if (iframe && !iframe.src) {
            const src = iframe.dataset.src;
            iframe.src = src;
            console.info('[reviews] loading', src);
            // Fallback if not rendered in 5s
            const slide = e.target;
            const timer = setTimeout(() => {
              if (!iframe.contentWindow || iframe.clientHeight === 0) {
                const fb = document.createElement('div');
                fb.className = 'review-fallback';
                fb.innerHTML = `<div>Facebook embed blocked</div><a class="btn btn-ghost" target="_blank" rel="noopener" href="${src}">Open on Facebook</a>`;
                slide.innerHTML = '';
                slide.appendChild(fb);
                console.warn('[reviews] fallback shown for', src);
              }
            }, 5000);
            iframe.addEventListener('load', () => { clearTimeout(timer); });
          }
          io.unobserve(e.target);
        }
      });
    }, { root: track.parentElement, rootMargin: '800px' });
    Array.from(track.children).forEach(slide => io.observe(slide));

    let offset = 0;
    let speed = 40; // px/s
  let playing = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let last = performance.now();

    const step = (now) => {
      if (!playing) { last = now; return requestAnimationFrame(step); }
      const dt = (now - last) / 1000; last = now;
      offset -= speed * dt;
      track.style.transform = `translateX(${offset}px)`;
      const first = track.firstElementChild;
      if (first) {
        const firstW = first.getBoundingClientRect().width + 16;
        if (Math.abs(offset) > firstW) {
          track.appendChild(first);
          offset += firstW;
          io.observe(track.lastElementChild);
        }
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);

  const root = track.parentElement;
    const setPlay = (state) => {
      playing = state;
      const btn = document.getElementById('reviews-toggle');
      if (btn) { btn.textContent = playing ? 'Pause' : 'Play'; btn.setAttribute('aria-pressed', String(playing)); }
    };
  // Continuous autoplay: no hover pause. Pause only by button or drag.
    document.getElementById('reviews-toggle')?.addEventListener('click', () => setPlay(!playing));

      const nudge = (dir) => { const w = (track.firstElementChild?.getBoundingClientRect().width || 360) + 24; offset += dir * w; track.style.transform = `translateX(${offset}px)`; };
    root.querySelector('.reviews-nav.prev')?.addEventListener('click', () => nudge(1));
    root.querySelector('.reviews-nav.next')?.addEventListener('click', () => nudge(-1));

    let dragging = false, startX = 0, startOffset = 0;
  const startDrag = (x) => { dragging = true; setPlay(false); startX = x; startOffset = offset; };
  const moveDrag  = (x) => { if (dragging) { offset = startOffset + (x - startX); track.style.transform = `translateX(${offset}px)`; } };
  const endDrag   = () => { if (dragging) { dragging = false; setPlay(true); } };

    root.addEventListener('pointerdown', e => { root.setPointerCapture(e.pointerId); startDrag(e.clientX); });
    root.addEventListener('pointermove',  e => moveDrag(e.clientX));
    root.addEventListener('pointerup',    endDrag);
    root.addEventListener('pointercancel',endDrag);

    root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft')  nudge(1);
      if (e.key === 'ArrowRight') nudge(-1);
      if (e.key === ' ') { e.preventDefault(); setPlay(!playing); }
    });
  } catch (e) {
    console.warn('Reviews carousel init failed', e);
  }
}

document.addEventListener('DOMContentLoaded', initReviewsCarousel);
