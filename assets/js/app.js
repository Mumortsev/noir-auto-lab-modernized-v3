// Reduce animation cost automatically on low-powered or data-saving devices.
(() => {const connection=navigator.connection || navigator.mozConnection || navigator.webkitConnection;
const limited=(typeof navigator.deviceMemory==='number'&&navigator.deviceMemory<=4)
 || (typeof navigator.hardwareConcurrency==='number'&&navigator.hardwareConcurrency<=4)
 || Boolean(connection&&connection.saveData);
if(limited)document.documentElement.classList.add('lite-effects');})();

(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reducedMotionNow = () => motionMedia.matches;

  // Three explicit positions. The middle one follows the OS while selected.
  const themeSwitch = $('#themeSwitch');
  const themeChoices = $$('[data-theme-choice]', themeSwitch);
  const themeMedia = window.matchMedia('(prefers-color-scheme: dark)');
  const root = document.documentElement;
  let themeMode = root.dataset.themeMode || 'system';
  function applyTheme(mode, persist = true) {
    if (!['light','system','dark'].includes(mode)) mode = 'system';
    themeMode = mode;
    const resolved = mode === 'system' ? (themeMedia.matches ? 'dark' : 'light') : mode;
    root.dataset.themeMode = mode;
    root.dataset.theme = resolved;
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.content = resolved === 'dark' ? '#111310' : '#eeeee8';
    themeChoices.forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.themeChoice === mode));
    });
    if (persist) { try { localStorage.setItem('noir-theme-mode', mode); } catch (_) {} }
  }
  themeChoices.forEach(button => button.addEventListener('click', () => applyTheme(button.dataset.themeChoice)));
  const onSystemThemeChange = () => { if (themeMode === 'system') applyTheme('system', false); };
  if (typeof themeMedia.addEventListener === 'function') themeMedia.addEventListener('change', onSystemThemeChange);
  else if (typeof themeMedia.addListener === 'function') themeMedia.addListener(onSystemThemeChange);
  applyTheme(themeMode, false);

  // Responsive navigation: close on selection, Escape, or moving back to desktop.
  const menuBtn = $('#menuBtn');
  const mobileNav = $('#mobileNav');
  const mobileMenuBreakpoint = window.matchMedia('(max-width: 1040px)');
  function setMenu(open, restoreFocus = false) {
    open = !!open && mobileMenuBreakpoint.matches;
    mobileNav.inert = !open;
    mobileNav.setAttribute('aria-hidden', String(!open));
    mobileNav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    document.body.classList.toggle('menu-open', open);
    if (restoreFocus && !open) menuBtn.focus({preventScroll:true});
  }
  menuBtn.addEventListener('click', () => setMenu(!mobileNav.classList.contains('open')));
  $$('a', mobileNav).forEach(a => a.addEventListener('click', () => setMenu(false)));
  window.addEventListener('keydown', e => { if (e.key === 'Escape' && mobileNav.classList.contains('open')) setMenu(false, true); });
  mobileMenuBreakpoint.addEventListener('change', () => { if (!mobileMenuBreakpoint.matches) setMenu(false, true); });

  // Graceful hero image fallback.
  const heroArt = $('#heroArt'), heroCar = $('#heroCar');
  heroCar.addEventListener('error', () => heroArt.classList.add('failed'));
  if (heroCar.complete && heroCar.naturalWidth === 0) heroArt.classList.add('failed');

  // Before/after visual comparison: keyboard accessible native range input.
  const compareControl = $('#compareControl');
  const compareBox = $('#compareBox');
  function updateCompare() {
    compareBox.style.setProperty('--split', `${compareControl.value}%`);
  }
  compareControl.addEventListener('input', updateCompare);
  updateCompare();
  $$('.compare-box img').forEach(img => img.addEventListener('error', () => {
    compareBox.style.background = 'radial-gradient(ellipse at 60% 40%,#73786a,#282b25 70%)';
    img.style.display = 'none';
  }));

  // Transparent demonstration estimator. Values are editable sample assumptions, not a real quote.
  const pricing = {
    sedan: {label:'Седан / купе', essential:85000, signature:190000},
    suv: {label:'SUV / кроссовер', essential:105000, signature:225000},
    sport: {label:'Спорт / крупный', essential:125000, signature:265000}
  };
  const addonPrices = {glass:18000, interior:22000, wheels:15000, ceramic:28000};
  const addonLabels = {glass:'Тонировка стёкол', interior:'Уход за интерьером', wheels:'Защита дисков', ceramic:'Дополнительная керамика'};
  const addonChecks = $$('[data-addon]');
  const state = {segment:'sedan', tier:'essential', addons:new Set()};
  const rubles = value => `${Math.round(value).toLocaleString('ru-RU')} ₽`;
  let latestEstimate = null;
  function recalculate(announce = false) {
    const segment = pricing[state.segment];
    const base = segment[state.tier];
    const addons = [...state.addons].reduce((sum, key) => sum + addonPrices[key], 0);
    const total = base + addons;
    latestEstimate = {segment:segment.label, tier:state.tier, base, addons, total, addonNames:[...state.addons].map(k => addonLabels[k])};
    $('#estimateTitle').textContent = `${state.tier.toUpperCase()} / ${segment.label}`;
    $('#estimateDesc').textContent = state.tier === 'essential'
      ? 'Фокус на ключевых зонах риска и базовой подготовке поверхности.'
      : 'Расширенная конфигурация защиты с более широким объёмом согласованных работ.';
    $('#basePrice').textContent = rubles(base);
    $('#addonPrice').textContent = rubles(addons);
    $('#segmentName').textContent = segment.label;
    $('#totalPrice').textContent = rubles(total);
    if (announce) $('#estimateAnnouncement').textContent = `Ориентировочный бюджет: ${rubles(total)}. ${state.tier.toUpperCase()}, ${segment.label}.`;
  }
  $$('[data-segment]').forEach(button => button.addEventListener('click', () => {
    state.segment = button.dataset.segment;
    $$('[data-segment]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    recalculate(true);
  }));
  $$('.choice[data-tier]').forEach(button => button.addEventListener('click', () => {
    state.tier = button.dataset.tier;
    $$('.choice[data-tier]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    recalculate(true);
  }));
  addonChecks.forEach(input => input.addEventListener('change', () => {
    if (input.checked) state.addons.add(input.dataset.addon);
    else state.addons.delete(input.dataset.addon);
    recalculate(true);
  }));
  const toast = $('#toast');
  let toastTimer;
  function showToast(text) {
    toast.textContent = text;
    toast.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), 3000);
  }
  $$('.package-select').forEach(button => button.addEventListener('click', () => {
    state.tier = button.dataset.tier;
    $$('.choice[data-tier]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tier === state.tier)));
    recalculate(true);
    $('#config').scrollIntoView({behavior:reducedMotionNow()? 'auto':'smooth'});
    showToast(`Пакет ${state.tier.toUpperCase()} выбран в конфигураторе`);
  }));
  $('#downloadEstimate').addEventListener('click', () => {
    const estimate = latestEstimate;
    const additions = estimate.addonNames.length ? estimate.addonNames.join(', ') : 'не выбраны';
    const content = [
      'NOIR AUTO LAB / Демонстрационный расчёт',
      'Это пример конфигурации, а не коммерческое предложение.',
      '',
      `Автомобиль: ${estimate.segment}`,
      `Пакет: ${estimate.tier.toUpperCase()}`,
      `Базовая стоимость: ${rubles(estimate.base)}`,
      `Дополнительные работы: ${additions}`,
      `Стоимость дополнений: ${rubles(estimate.addons)}`,
      `Всего: ${rubles(estimate.total)}`,
      '',
      'Реальная стоимость и сроки уточняются после осмотра.'
    ].join('\n');
    const file = new Blob(['\uFEFF', content], {type:'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'NOIR-AUTO-LAB-demo-estimate.txt';
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    showToast('Скачивание демо-расчёта начато');
  });
  $('#sendEstimate').addEventListener('click', () => {
    $('#contact').scrollIntoView({behavior:reducedMotionNow()? 'auto':'smooth'});
    $('#carModel').focus({preventScroll:true});
    showToast(`Ориентир ${rubles(latestEstimate.total)} подготовлен — заполните контакты`);
  });

  // Keep the native international number intact; validate rather than rewriting input.
  const phone = $('#clientPhone');
  const phoneError = $('#phoneError');
  function validatePhone(showError = false) {
    const digits = phone.value.replace(/\D/g, '');
    const valid = digits.length >= 10 && digits.length <= 15 && !/[a-zа-яё]/i.test(phone.value);
    phone.setCustomValidity(valid ? '' : 'Укажите корректный номер: от 10 до 15 цифр.');
    const expose = showError && !valid;
    phoneError.hidden = !expose;
    if (expose) phone.setAttribute('aria-invalid', 'true');
    else phone.removeAttribute('aria-invalid');
    return valid;
  }
  phone.addEventListener('input', () => validatePhone(false));
  phone.addEventListener('blur', () => { if (phone.value.trim()) validatePhone(true); });

  const form = $('#leadForm'), formResult = $('#formResult');
  ['#carModel','#clientName'].forEach(selector => $(selector).addEventListener('input', e => e.currentTarget.setCustomValidity('')));
  form.addEventListener('submit', event => {
    event.preventDefault();
    $('#carModel').setCustomValidity($('#carModel').value.trim() ? '' : 'Укажите марку и модель автомобиля.');
    $('#clientName').setCustomValidity($('#clientName').value.trim() ? '' : 'Укажите имя.');
    validatePhone(true);
    if (!form.reportValidity()) return;
    const car = $('#carModel').value.trim();
    const name = $('#clientName').value.trim();
    const phoneValue = $('#clientPhone').value.trim();
    if (!car || !name || !phoneValue) { showToast('Заполните обязательные поля'); return; }
    const estimate = latestEstimate;
    const addonsText = estimate.addonNames && estimate.addonNames.length ? estimate.addonNames.join(', ') : 'не выбраны';
    formResult.textContent = `Спасибо, ${name}. Демо-заявка для автомобиля ${car} сформирована локально. Пакет ${estimate.tier.toUpperCase()}, ориентир ${rubles(estimate.total)}; дополнительные работы: ${addonsText}. Телефон ${phoneValue} не отправлен и не сохранён.`;
    formResult.classList.add('show');
    formResult.scrollIntoView({behavior:reducedMotionNow()? 'auto':'smooth',block:'nearest'});
  });

  $$('.work-visual img').forEach(img => {
    const fail = () => img.classList.add('is-broken');
    img.addEventListener('error', fail);
    if (img.complete && img.naturalWidth === 0) fail();
  });

  // Infinite carousels: three identical cycles keep swipes native and allow
  // forward/backward movement past the ends without disabled buttons.
  const carouselControllers = {};
  $$('[data-slider-track]').forEach(track => {
    const originals = $$('[data-slide]', track);
    if (!originals.length) return;
    originals.forEach((card,i) => {
      card.dataset.workIndex = String(i);
      const trigger = card.querySelector('[data-open-work]');
      if (trigger) trigger.dataset.openWork = String(i);
    });
    const clones = source => source.map(node => {
      const clone = node.cloneNode(true);
      clone.setAttribute('aria-hidden','true');
      clone.querySelectorAll('button, a, input, [tabindex]').forEach(el => el.tabIndex = -1);
      return clone;
    });
    const before = clones(originals);
    const after = clones(originals);
    track.prepend(...before);
    track.append(...after);
    const all = $$('[data-slide]', track);
    const n = originals.length;
    const prev = $(`[data-slider-prev="${track.id}"]`);
    const next = $(`[data-slider-next="${track.id}"]`);
    const counter = $(`#${track.id === 'worksTrack' ? 'worksCount' : 'reviewsCount'}`);
    let active = 0;
    let ticking = false;
    let settlingTimer = 0;
    const xOf = i => all[i].offsetLeft - all[0].offsetLeft;
    const cycleWidth = () => xOf(n) - xOf(0);
    const nearest = () => {
      const x = track.scrollLeft;
      return all.reduce((best,card,i) => Math.abs(xOf(i)-x)<Math.abs(xOf(best)-x) ? i:best,0);
    };
    function refresh(){
      ticking=false;
      const i=nearest();
      active=Number(all[i].dataset.workIndex);
      counter.textContent = `${String(active+1).padStart(2,'0')} / ${String(n).padStart(2,'0')}`;
    }
    function instantTo(left){
      const oldSnap=track.style.scrollSnapType;
      const oldBehavior=track.style.scrollBehavior;
      track.style.scrollSnapType='none';
      track.style.scrollBehavior='auto';
      track.scrollLeft=left;
      track.style.scrollBehavior=oldBehavior;
      track.style.scrollSnapType=oldSnap;
    }
    // After reaching a clone, teleport to the same pixel in the middle cycle.
    function settle(){
      clearTimeout(settlingTimer);
      const width=cycleWidth();
      if (!width) return;
      const x=track.scrollLeft;
      if(x < width-1) instantTo(x+width);
      else if(x >= width*2-1) instantTo(x-width);
      refresh();
    }
    function go(delta){
      clearTimeout(settlingTimer);
      const index=nearest();
      let destination=index+delta;
      if(destination<1 || destination>=all.length-1){settle();destination=nearest()+delta;}
      if(destination<0||destination>=all.length)return;
      const target=xOf(destination);
      active=Number(all[destination].dataset.workIndex);
      counter.textContent=`${String(active+1).padStart(2,'0')} / ${String(n).padStart(2,'0')}`;
      track.scrollTo({left:target,behavior:reducedMotionNow()?'instant':'smooth'});
      if (reducedMotionNow()) settle();
    }
    prev.addEventListener('click',()=>go(-1));
    next.addEventListener('click',()=>go(1));
    track.addEventListener('keydown', event => {
      if(event.target!==track||!['ArrowLeft','ArrowRight'].includes(event.key))return;
      event.preventDefault();go(event.key==='ArrowRight'?1:-1);
    });
    track.addEventListener('scroll',()=>{
      if(!ticking){ticking=true;requestAnimationFrame(refresh);}
      // Older browsers without scrollend still recenter after the gesture.
      if(!('onscrollend' in track)){
        clearTimeout(settlingTimer);
        settlingTimer=setTimeout(settle,170);
      }
    },{passive:true});
    if('onscrollend' in track)track.addEventListener('scrollend',settle);
    // Use original real-card positions as the central, keyboard-accessible cycle.
    const reinitialize=()=>instantTo(xOf(n+active));
    reinitialize();
    window.addEventListener('resize',reinitialize,{passive:true});
    refresh();
    carouselControllers[track.id]={go,refresh};
  });

  // Full-viewport work gallery. Reviews remain a regular carousel.
  const workDialog=$('#workLightbox');
  const workItems=$$('[data-slide]', $('#worksTrack')).filter(card=>!card.hasAttribute('aria-hidden'));
  const workImage=$('#workLightboxImage');
  let workIndex=0;
  let previouslyFocused=null;
  let inertBefore=[];
  const renderWork=()=>{
    const card=workItems[workIndex];
    const original=card.querySelector('.work-visual img');
    const url=new URL(original.src);
    if(url.hostname==='images.unsplash.com'){
      const portrait=window.matchMedia('(max-width: 640px)').matches;
      url.searchParams.set('w',portrait?'900':'1920');
      url.searchParams.set('h',portrait?'1600':'1080');
      url.searchParams.set('crop','entropy');
      url.searchParams.set('q','84');
    }
    workImage.classList.remove('is-broken');
    workImage.src=url.href;
    workImage.alt=original.alt;
    $('#workLightboxKicker').textContent=card.querySelector('.work-kicker').textContent;
    $('#workLightboxTitle').textContent=card.querySelector('h3').textContent;
    $('#workLightboxDescription').textContent=card.querySelector('.work-details p').textContent;
    $('#workLightboxCount').textContent=`${String(workIndex+1).padStart(2,'0')} / ${String(workItems.length).padStart(2,'0')}`;
  };
  workImage.addEventListener('error',()=>workImage.classList.add('is-broken'));
  function closeWork(){
    if(workDialog.hidden)return;
    workDialog.hidden=true;
    document.body.classList.remove('work-lightbox-open');
    inertBefore.forEach(([el,old])=>el.inert=old);
    inertBefore=[];
    if(previouslyFocused?.isConnected)previouslyFocused.focus({preventScroll:true});
  }
  function openWork(index,trigger){
    workIndex=((index%workItems.length)+workItems.length)%workItems.length;
    previouslyFocused=trigger;
    renderWork();
    inertBefore=$$('header, main, footer, .mobile-nav, .skip-link').map(el=>[el,el.inert]);
    inertBefore.forEach(([el])=>el.inert=true);
    workDialog.hidden=false;
    document.body.classList.add('work-lightbox-open');
    $('#workLightboxClose').focus({preventScroll:true});
  }
  const moveWork=delta=>{workIndex=(workIndex+delta+workItems.length)%workItems.length;renderWork();};
  $('#worksTrack').addEventListener('click',event=>{
    const trigger=event.target.closest('[data-open-work]');
    if(!trigger)return;
    openWork(Number(trigger.dataset.openWork),trigger);
  });
  $('#workLightboxClose').addEventListener('click',closeWork);
  $('#workLightboxPrev').addEventListener('click',()=>moveWork(-1));
  $('#workLightboxNext').addEventListener('click',()=>moveWork(1));
  workDialog.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();closeWork();return;}
    if(event.key==='ArrowLeft'){event.preventDefault();moveWork(-1);return;}
    if(event.key==='ArrowRight'){event.preventDefault();moveWork(1);return;}
    if(event.key==='Tab'){
      const focusable=$$('button:not([disabled])',workDialog);
      const first=focusable[0],last=focusable.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  });
  window.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&!workDialog.hidden){event.preventDefault();closeWork();}
  });
  // Fullscreen gestures work independently of the regular gallery's native swipe.
  let swipeStart=null;
  workDialog.addEventListener('pointerdown',event=>{
    if(event.target.closest('button'))return;
    swipeStart={x:event.clientX,y:event.clientY};
  });
  workDialog.addEventListener('pointerup',event=>{
    if(!swipeStart)return;
    const dx=event.clientX-swipeStart.x,dy=event.clientY-swipeStart.y;
    swipeStart=null;
    if(Math.abs(dx)>48&&Math.abs(dx)>Math.abs(dy)*1.25)moveWork(dx<0?1:-1);
  });
  workDialog.addEventListener('pointercancel',()=>swipeStart=null);

  // Progressive, staggered reveal: major blocks and their individual cards rise into view.
  const revealSelectors = [
    '.hero-copy .eyebrow', '.hero-copy h1', '.hero-copy .hero-desc', '.hero-copy .actions',
    '.hero-art', '.hero-foot', '.section-head', '.comparison', '.package',
    '.method-aside', '.step', '.config-step', '.estimate', '.contact-copy',
    '.contact-detail', '.lead-form'
  ];
  const revealSet = new Set($$('.reveal'));
  revealSelectors.forEach(selector => $$(selector).forEach(el => {
    if (!el.closest('.hero-copy') && !el.matches('.hero-art,.hero-foot')) {
      el.classList.add('reveal');
    }
    revealSet.add(el);
  }));
  const revealItems = [...revealSet].sort((a,b) => {
    if (a === b) return 0;
    return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
  });
  // Small stagger is applied per local run, never as a long page-wide delay.
  let localIndex = 0, previousParent = null;
  revealItems.forEach(el => {
    const parent = el.parentElement;
    if (parent !== previousParent) localIndex = 0;
    el.style.setProperty('--reveal-delay', `${(localIndex % 4) * 75}ms`);
    localIndex++; previousParent = parent;
  });
  if ('IntersectionObserver' in window && !reducedMotionNow()) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('in'); observer.unobserve(entry.target); }
    }), {threshold:.1, rootMargin:'0px 0px -5% 0px'});
    revealItems.forEach(el => observer.observe(el));
    root.classList.add('reveal-enabled');
  } else revealItems.forEach(el => el.classList.add('in'));
  // Pause large decorative layers outside the viewport to avoid needless GPU work while scrolling.
  const auroraSections = $$('.hero, .packages');
  if ('IntersectionObserver' in window && !reducedMotionNow()) {
    const auroraObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      entry.target.classList.toggle('aurora-active', entry.isIntersecting);
    }), {rootMargin:'140px 0px', threshold:0});
    auroraSections.forEach(section => auroraObserver.observe(section));
  } else {
    auroraSections.forEach(section => section.classList.add('aurora-active'));
  }

  // Wait two frames so the hero's entrance animation starts from its true initial state.
  if (!reducedMotionNow()) requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('motion-ready')));
  recalculate();
})();

// Additional independent demo UI, all client-side, no network/storage of personal data.
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const button = id => document.getElementById(id);
  const getPrice = () => (button('totalPrice')?.textContent || '').trim();
  const describe = () => {
    const selected = [...document.querySelectorAll('[data-addon]:checked')].map(x => x.closest('label')?.querySelector('b')?.textContent?.trim()).filter(Boolean);
    return [
      'NOIR AUTO LAB — демо-расчёт',
      button('estimateTitle')?.textContent,
      `Стоимость пакета: ${button('basePrice')?.textContent}`,
      `Дополнительные работы: ${selected.length ? selected.join(', ') : 'не выбраны'}`,
      `Стоимость дополнений: ${button('addonPrice')?.textContent}`,
      `Итого: ${getPrice()}`,
      'Это иллюстративный расчёт. Точная стоимость зависит от осмотра автомобиля.'
    ].filter(Boolean).join('\n');
  };
  const notify = message => {const toast=button('toast');if(!toast)return;toast.textContent=message;toast.classList.add('show');clearTimeout(notify.timer);notify.timer=setTimeout(()=>toast.classList.remove('show'),3200);};
  button('copyEstimate')?.addEventListener('click', async () => {
    try {await navigator.clipboard.writeText(describe());notify('Демо-расчёт скопирован');}
    catch {notify('Не удалось скопировать: браузер заблокировал буфер обмена');}
  });
  button('printEstimate')?.addEventListener('click', () => {
    const data=button('printEstimateContent');if(!data)return;
    data.innerHTML='';
    const title=document.createElement('h1');title.textContent='NOIR AUTO LAB';data.append(title);
    const subtitle=document.createElement('p');subtitle.textContent='Предварительная демонстрационная смета';data.append(subtitle);
    describe().split('\n').slice(1).forEach(line=>{const row=document.createElement('p');row.textContent=line;data.append(row);});
    const note=document.createElement('small');note.textContent='Концептуальный сайт · расчёт не является офертой.';data.append(note);
    window.print();
  });
  button('resetEstimate')?.addEventListener('click', () => {
    document.querySelector('[data-segment="sedan"]')?.click();
    document.querySelector('.choice[data-tier="essential"]')?.click();
    document.querySelectorAll('[data-addon]:checked').forEach(input=>{input.checked=false;input.dispatchEvent(new Event('change',{bubbles:true}));});
    notify('Конфигурация сброшена');
  });
  button('demoFill')?.addEventListener('click', () => {
    button('carModel').value='Пример — спортивное купе';
    button('clientName').value='Демо-клиент';
    button('clientPhone').value='+7 900 000 00 00';
    button('clientPhone').dispatchEvent(new Event('input',{bubbles:true}));
    button('formResult').classList.remove('show');
    notify('Пример заполнен — данные не отправляются');
  });
})();
