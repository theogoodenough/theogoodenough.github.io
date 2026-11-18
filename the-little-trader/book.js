// Interactive board book viewer: pages turned with the arrows, a swipe, a click on either half of the page or the
// arrow keys; glowing spots open inserts (ledger pages) in an overlay; a closing page can carry a stamp that comes
// down a moment after the page is shown. Everything comes from book.json, written by boardbook_build.py.
(async () => {
  const book = await (await fetch('book.json')).json();
  const $ = s => document.querySelector(s);
  const sheet = $('.sheet'), art = $('.art'), spots = $('.spots'), stamp = $('.stamp'), hint = $('.hint');
  const prev = $('.prev'), next = $('.next'), count = $('.count'), insert = $('.insert'), insertArt = $('.insert-art');
  const seen = new Set();
  let at = 0, timer = null, opener = null;

  const setImg = (img, im) => {
    img.src = im.src; img.srcset = im.srcset; img.sizes = im.sizes || '100vw';
    img.width = im.w; img.height = im.h; img.alt = im.alt || '';
  };
  const preload = i => { const p = book.pages[i]; if (p) { const im = new Image(); im.srcset = p.srcset; im.sizes = '100vw'; im.src = p.src; } };

  function show(i, instant) {
    if (i < 0 || i >= book.pages.length) return;
    clearTimeout(timer);
    const draw = () => {
      at = i; const p = book.pages[i];
      setImg(art, p);
      spots.replaceChildren(...(p.spots || []).map(s => {
        const b = document.createElement('button');
        b.className = 'spot' + (seen.has(s.opens) ? ' seen' : '');
        const [x, y, w, h] = s.rect;
        Object.assign(b.style, { left: `${x * 100}%`, top: `${y * 100}%`, width: `${w * 100}%`, height: `${h * 100}%` });
        b.setAttribute('aria-label', s.label);
        b.addEventListener('click', e => { e.stopPropagation(); open(s.opens, b); });
        return b;
      }));
      stamp.classList.remove('down'); sheet.classList.remove('jolt');
      if (p.stamp) {
        setImg(stamp, p.stamp); stamp.alt = '';
        const [x, y, w, h] = p.stamp.rect;
        Object.assign(stamp.style, { display: 'block', left: `${x * 100}%`, top: `${y * 100}%`, width: `${w * 100}%`, height: `${h * 100}%` });
        timer = setTimeout(() => {
          stamp.classList.add('down'); sheet.classList.add('jolt');
          art.alt = p.stamp.alt || art.alt;
        }, p.stamp.delay_ms ?? 1400);
      } else {
        stamp.style.display = 'none';
      }
      prev.disabled = i === 0; next.disabled = i === book.pages.length - 1;
      count.textContent = p.label || '';
      const unseen = (p.spots || []).some(s => !seen.has(s.opens));
      hint.hidden = !(unseen && seen.size === 0 && book.hint); hint.textContent = book.hint || '';
      history.replaceState(null, '', '#' + p.id);
      sheet.classList.remove('leaving');
      preload(i + 1); preload(i - 1);
    };
    if (instant) return draw();
    sheet.classList.add('leaving');
    setTimeout(draw, 180);
  }

  function open(id, from) {
    const im = book.inserts[id]; if (!im) return;
    seen.add(id); if (from) from.classList.add('seen'); hint.hidden = true;
    setImg(insertArt, im); opener = from;
    insert.hidden = false; $('.close').focus();
  }
  function close() { insert.hidden = true; if (opener) opener.focus(); opener = null; }

  prev.addEventListener('click', () => show(at - 1));
  next.addEventListener('click', () => show(at + 1));
  art.addEventListener('click', e => {
    const r = art.getBoundingClientRect();
    show(e.clientX - r.left < r.width / 2 ? at - 1 : at + 1);
  });
  insert.addEventListener('click', close);   // a click anywhere on the insert, page or margin, closes it
  document.addEventListener('keydown', e => {
    if (!insert.hidden) { if (e.key === 'Escape') close(); return; }
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); show(at + 1); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); show(at - 1); }
    if (e.key === 'Home') show(0);
    if (e.key === 'End') show(book.pages.length - 1);
  });
  let x0 = null;
  $('.page').addEventListener('pointerdown', e => { x0 = e.clientX; });
  $('.page').addEventListener('pointerup', e => {
    if (x0 === null) return; const dx = e.clientX - x0; x0 = null;
    if (Math.abs(dx) > 50 && e.pointerType !== 'mouse') show(dx < 0 ? at + 1 : at - 1);
  });

  const fromHash = () => book.pages.findIndex(p => '#' + p.id === location.hash);
  window.addEventListener('hashchange', () => { const i = fromHash(); if (i >= 0 && i !== at) { close(); show(i, true); } });
  show(Math.max(fromHash(), 0), true);
  window.boardbook = { show, open, close, get at() { return at; } };   // for the check script
})();
