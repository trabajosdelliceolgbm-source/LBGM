// ============ MENÚ MÓVIL ============
const burgerBtn = document.getElementById('burgerBtn');
const mainNav = document.getElementById('mainNav');
burgerBtn?.addEventListener('click', () => {
  mainNav.classList.toggle('open');
});

// ============ SISTEMA DE PESTAÑAS ============
const tabButtons = document.querySelectorAll('.tab-btn');
const panels = document.querySelectorAll('.panel');
const tabSlider = document.getElementById('tabSlider');
const tabsNav = document.getElementById('tabsNav');

function moveSlider(btn){
  if(!btn || !tabSlider) return;
  const navRect = tabsNav.getBoundingClientRect();
  const btnRect = btn.getBoundingClientRect();
  tabSlider.style.left = (btnRect.left - navRect.left) + 'px';
  tabSlider.style.width = btnRect.width + 'px';
}

// ============ TRANSICIÓN CINEMATOGRÁFICA ENTRE PESTAÑAS ============
// Un barrido navy/dorado cubre toda la pantalla, muestra brevemente el
// nombre de la sección a la que se entra y se retira, mientras que por
// debajo (oculto) ya cambiamos el panel activo. Así cada cambio de
// pestaña se siente como una escena nueva, no como un simple show/hide.
const tabTransition = document.getElementById('tabTransition');
const ttIndexEl = document.getElementById('ttIndex');
const ttNameEl = document.getElementById('ttName');
let ttTimers = [];

function prefersReducedMotion(){
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function runTabTransition(targetBtn, onCovered){
  if(!tabTransition || prefersReducedMotion()){
    onCovered();
    return;
  }
  const indexText = targetBtn.querySelector('.tab-index')?.textContent || '';
  const nameText = targetBtn.querySelector('.tab-name')?.textContent || '';
  if(ttIndexEl) ttIndexEl.textContent = indexText;
  if(ttNameEl) ttNameEl.textContent = nameText;

  ttTimers.forEach(t => clearTimeout(t));
  ttTimers = [];

  tabTransition.classList.remove('tt-run');
  tabTransition.classList.add('tt-active');
  void tabTransition.offsetWidth; // fuerza reflow para reiniciar la animación
  tabTransition.classList.add('tt-run');

  const SWEEP_TOTAL = 780;   // debe calzar con la duración de ttSweep en CSS
  const COVER_POINT = 370;   // instante en que la pantalla queda totalmente cubierta

  ttTimers.push(setTimeout(onCovered, COVER_POINT));
  ttTimers.push(setTimeout(() => {
    tabTransition.classList.remove('tt-active', 'tt-run');
  }, SWEEP_TOTAL + 20));
}

function activateTab(tabName, { scroll = true, animate = true, onDone } = {}){
  const targetBtn = document.getElementById('tabbtn-' + tabName);
  if(!targetBtn) return;

  // Si ya estamos en esa pestaña, igual podemos saltar a una sub-sección (submenú After School)
  if(targetBtn.classList.contains('active')){
    if(onDone) requestAnimationFrame(onDone);
    return;
  }

  function swapContent(){
    tabButtons.forEach(b => {
      const isMatch = b.dataset.tab === tabName;
      b.classList.toggle('active', isMatch);
      b.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });
    panels.forEach(p => p.classList.toggle('active', p.id === tabName));
    moveSlider(targetBtn);
    history.replaceState(null, '', '#' + tabName);
    if(onDone) requestAnimationFrame(onDone);
  }

  if(scroll){
    document.querySelector('.ficha-wrap')?.scrollIntoView({ behavior:'smooth', block:'start' });
  }

  if(animate){
    runTabTransition(targetBtn, swapContent);
  } else {
    swapContent();
  }
}

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => activateTab(btn.dataset.tab));
});

// ============ SUB-PESTAÑAS INTERNAS DE AFTER SCHOOL ============
// Independientes del sistema de pestañas principal: "Información", "Avisos", "Galería" y "Contacto"
const asSubtabButtons = document.querySelectorAll('.as-subtab-btn');
const asSubpanels = document.querySelectorAll('.as-subpanel');

function activateAsSubtab(name){
  if(!name) return;
  const targetBtn = document.getElementById('assubbtn-' + name);
  if(!targetBtn) return;
  asSubtabButtons.forEach(b => {
    const isMatch = b.dataset.assub === name;
    b.classList.toggle('active', isMatch);
    b.setAttribute('aria-selected', isMatch ? 'true' : 'false');
  });
  asSubpanels.forEach(p => {
    const isMatch = p.id === 'as' + name.charAt(0).toUpperCase() + name.slice(1);
    p.classList.toggle('active', isMatch);
    p.hidden = !isMatch;
  });
}
asSubtabButtons.forEach(btn => {
  btn.addEventListener('click', () => activateAsSubtab(btn.dataset.assub));
});

// Cualquier elemento con data-goto navega a una pestaña
// (si además trae data-scrollto, después de cambiar de pestaña salta a esa sub-sección;
// si trae data-assub, primero cambia la sub-pestaña de After School correspondiente)
document.querySelectorAll('[data-goto]').forEach(el => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    if(el.dataset.assub) activateAsSubtab(el.dataset.assub);
    const scrollToId = el.dataset.scrollto;
    activateTab(el.dataset.goto, {
      scroll: !scrollToId,
      onDone: scrollToId ? () => {
        document.getElementById(scrollToId)?.scrollIntoView({ behavior:'smooth', block:'start' });
      } : undefined
    });
    mainNav?.classList.remove('open');
    document.querySelectorAll('.nav-dropdown.open').forEach(d => d.classList.remove('open'));
  });
});

// ============ SUBMENÚ "AFTER SCHOOL" ============
// La flechita ▾ abre/cierra el submenú (clic, no solo hover) — clave en celular,
// donde no existe el hover. En escritorio el hover ya lo abre por CSS.
document.querySelectorAll('.nav-caret').forEach(caret => {
  caret.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const dropdown = caret.closest('.nav-dropdown');
    const wasOpen = dropdown.classList.contains('open');
    document.querySelectorAll('.nav-dropdown.open').forEach(d => d.classList.remove('open'));
    dropdown.classList.toggle('open', !wasOpen);
  });
});
document.addEventListener('click', (e) => {
  if(!e.target.closest('.nav-dropdown')){
    document.querySelectorAll('.nav-dropdown.open').forEach(d => d.classList.remove('open'));
  }
});

// Estado inicial según el hash de la URL, si corresponde a una pestaña válida
window.addEventListener('load', () => {
  const initial = window.location.hash.replace('#','');
  const valid = ['nosotros','admision','normas','afterschool','galeria','noticias','contacto'];
  if(valid.includes(initial) && initial !== 'nosotros'){
    activateTab(initial, { scroll:false, animate:false });
  } else {
    moveSlider(document.querySelector('.tab-btn.active'));
  }
});
window.addEventListener('resize', () => {
  moveSlider(document.querySelector('.tab-btn.active'));
});

// ============ CONTADORES ANIMADOS ============
function animateCount(el, target, duration = 1400){
  const start = performance.now();
  function tick(now){
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target);
    if(progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// Años del liceo en el eyebrow del hero
const yearsEl = document.getElementById('yearsCount');
if(yearsEl){
  const currentYear = new Date().getFullYear();
  animateCount(yearsEl, currentYear - 1950, 1200);
}

// Estadísticas de "Nosotros": se animan una sola vez, cuando la pestaña se abre
let statsAnimated = false;
function maybeAnimateStats(){
  if(statsAnimated) return;
  const nosotrosPanel = document.getElementById('nosotros');
  if(nosotrosPanel && nosotrosPanel.classList.contains('active')){
    document.querySelectorAll('.stat strong[data-count]').forEach(el => {
      animateCount(el, parseInt(el.dataset.count, 10));
    });
    statsAnimated = true;
  }
}
maybeAnimateStats();
document.getElementById('tabbtn-nosotros')?.addEventListener('click', () => setTimeout(maybeAnimateStats, 50));

// ============ PILARES (micro-interacción) ============
document.querySelectorAll('.pillar').forEach(p => {
  p.addEventListener('click', () => {
    p.animate(
      [{ transform:'scale(1)' }, { transform:'scale(0.97)' }, { transform:'scale(1)' }],
      { duration:220, easing:'ease-out' }
    );
  });
});

// ============ STEPPER DE ADMISIÓN (acordeón) ============
document.querySelectorAll('.step-head').forEach(head => {
  head.addEventListener('click', () => {
    const step = head.closest('.step');
    const wasOpen = step.classList.contains('open');
    document.querySelectorAll('.step').forEach(s => s.classList.remove('open'));
    if(!wasOpen) step.classList.add('open');
  });
});
// Abre el primer paso por defecto
document.querySelector('.step[data-step="1"]')?.classList.add('open');

// ============ ACORDEÓN "SOBRE EL PROGRAMA" (After School) ============
document.querySelectorAll('.as-acc-head').forEach(head => {
  head.addEventListener('click', () => {
    const item = head.closest('.as-acc-item');
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.as-acc-item').forEach(i => i.classList.remove('open'));
    if(!wasOpen) item.classList.add('open');
  });
});

// ============ GALERÍAS / LIGHTBOX ============
// Hay dos galerías separadas. Para agregar o reordenar fotos en cualquiera
// de las dos: solo edita la lista correspondiente. El orden en que aparecen
// aquí es el orden en que se muestran en la página.
// "src"/"images" apuntan a archivos dentro de img/galeria/ (mismo nombre que el archivo subido).
//
// Cada tarjeta puede tener UNA foto o VARIAS:
//   { src: 'img/galeria/archivo.jpg', caption: 'Texto' }                                 -> una sola foto
//   { images: ['img/galeria/a.jpg', 'img/galeria/b.jpg'], caption: 'Texto' }              -> varias fotos
// Si una tarjeta tiene varias fotos, en la página aparecen flechitas ‹ › y puntitos
// para pasar entre ellas sin salir de la tarjeta; al hacer clic se abren todas
// en grande, y ahí las flechas del visor recorren TODA la galería en orden.

// Galería de After School (dentro de la pestaña After School)
const AFTER_SCHOOL_GALLERY = [
  { images: ['img/galeria/01-rincon-de-juego.jpg', 'img/galeria/02-rincon-de-juego-mesas.jpg'], caption: 'Rincón de Juego' },
  { src: 'img/galeria/08-ordenando-rincon-de-juego.jpg',    caption: 'Ordenando el Rincón de Juego' },
  { src: 'img/galeria/03-rincon-del-arte.jpg',              caption: 'Rincón del Arte' },
  { src: 'img/galeria/04-hora-del-cuento.jpg',              caption: 'Hora del cuento' },
  { src: 'img/galeria/05-area-de-descanso.jpg',             caption: 'Área de descanso' },
  { src: 'img/galeria/06-espacio-after-school.jpg',         caption: 'Espacio After School' },
  { src: 'img/galeria/07-preparando-las-salas.jpg',         caption: 'Preparando las actividades' },
];

// Galería general del Liceo (pestaña Galería) — fotos de ejemplo, reemplázalas
// subiendo los archivos a img/galeria-liceo/ y editando esta lista.
const LICEO_GALLERY = [
  { src: 'img/galeria-liceo/01-fachada.jpg',           caption: 'Fachada del liceo' },
  { src: 'img/galeria-liceo/02-salas-de-clase.jpg',    caption: 'Salas de clase' },
  { src: 'img/galeria-liceo/03-laboratorio.jpg',       caption: 'Laboratorio de ciencias' },
  { src: 'img/galeria-liceo/04-talleres.jpg',          caption: 'Talleres técnicos' },
];

// ---------- ÍCONOS DE LA CUADRÍCULA "AS" (After School) ----------
// Cada ícono de la cuadrícula abre una imagen relacionada al hacer clic.
// Por ahora usan ilustraciones propias (SVG) que conservan el color de cada
// casilla — puedes reemplazarlas por fotos reales cuando las tengas: solo
// sube el archivo a img/afterschool/ y cambia el "src" de más abajo (puede
// ser .jpg, .png o .svg). El orden debe calzar con los íconos en index.html
// (✎ tareas, ▦ agenda, ☺ juego libre, ♟ juegos de mesa, ✂ manualidades, ♫ música, ★ reconocimientos, ▢ el espacio).
const AS_ICON_MEDIA = [
  { src: 'img/afterschool/tareas.svg',        caption: 'Hora de tareas — un momento acompañado para avanzar en las tareas del día.' },
  { src: 'img/afterschool/agenda.svg',        caption: 'Organización del día — planificamos juntos las actividades de la jornada.' },
  { src: 'img/afterschool/juego-libre.svg',   caption: 'Juego libre — tiempo de recreación y juego dentro del liceo.' },
  { src: 'img/afterschool/juegos-mesa.svg',   caption: 'Juegos de mesa — ajedrez, damas y otros juegos para pensar en grupo.' },
  { src: 'img/afterschool/manualidades.svg',  caption: 'Manualidades — actividades creativas con distintos materiales.' },
  { src: 'img/afterschool/musica.svg',        caption: 'Música — canciones y ritmo como parte de las experiencias del día.' },
  { src: 'img/afterschool/logros.svg',        caption: 'Reconocimientos — celebramos los logros y avances de cada niño o niña.' },
  { src: 'img/afterschool/espacio.svg',       caption: 'El espacio After School — un lugar cálido y seguro para esperar.' },
];

const fallbackClasses = ['g1','g2','g3','g4','g5','g6'];

// Acepta tarjetas con "src" (una foto) o "images" (varias fotos) por igual.
function normalizeGalleryList(list){
  return list.map(entry => ({
    ...entry,
    images: (entry.images && entry.images.length) ? entry.images : (entry.src ? [entry.src] : []),
  }));
}

function renderGalleryInto(containerId, rawList){
  const grid = document.getElementById(containerId);
  if(!grid) return;
  grid.innerHTML = '';

  const list = normalizeGalleryList(rawList);

  // Aplana todas las fotos de la galería, en orden, para que el visor grande
  // pueda recorrerlas todas con las flechas (no solo las de una tarjeta).
  const flat = [];
  list.forEach(entry => {
    entry._flatStart = flat.length;
    entry.images.forEach(src => flat.push({ src, caption: entry.caption }));
  });

  list.forEach((entry, i) => {
    const imgs = entry.images;
    let current = 0;

    const card = document.createElement('div');
    card.className = 'gallery-item' + (imgs.length > 1 ? ' has-multi' : '');
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', 'Ver foto: ' + entry.caption);

    const img = document.createElement('img');
    img.src = imgs[0] || '';
    img.alt = entry.caption;
    img.loading = 'lazy';
    // Si el archivo todavía no existe, se ve un degradado en vez de un ícono roto
    img.addEventListener('error', () => {
      card.classList.add('g-fallback', fallbackClasses[i % fallbackClasses.length]);
    });

    const span = document.createElement('span');
    span.textContent = entry.caption;

    const openThisPhoto = () => openLightbox(flat, entry._flatStart + current);
    card.addEventListener('click', openThisPhoto);
    card.addEventListener('keydown', (e) => {
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openThisPhoto(); }
    });

    card.append(img, span);

    if(imgs.length > 1){
      const dotsWrap = document.createElement('div');
      dotsWrap.className = 'gallery-item-dots';
      const dotEls = imgs.map((_, di) => {
        const dot = document.createElement('span');
        dot.className = 'gallery-item-dot' + (di === 0 ? ' active' : '');
        dotsWrap.appendChild(dot);
        return dot;
      });

      function goTo(nextIndex){
        current = (nextIndex + imgs.length) % imgs.length;
        img.src = imgs[current];
        dotEls.forEach((dot, di) => dot.classList.toggle('active', di === current));
      }

      const prevBtn = document.createElement('button');
      prevBtn.type = 'button';
      prevBtn.className = 'gallery-item-nav gallery-item-prev';
      prevBtn.innerHTML = '‹';
      prevBtn.setAttribute('aria-label', 'Foto anterior de ' + entry.caption);
      prevBtn.addEventListener('click', (e) => { e.stopPropagation(); goTo(current - 1); });

      const nextBtn = document.createElement('button');
      nextBtn.type = 'button';
      nextBtn.className = 'gallery-item-nav gallery-item-next';
      nextBtn.innerHTML = '›';
      nextBtn.setAttribute('aria-label', 'Foto siguiente de ' + entry.caption);
      nextBtn.addEventListener('click', (e) => { e.stopPropagation(); goTo(current + 1); });

      const count = document.createElement('span');
      count.className = 'gallery-item-count';
      count.textContent = `📷 ${imgs.length}`;

      card.append(prevBtn, nextBtn, dotsWrap, count);
    }

    grid.appendChild(card);
  });
}

const lightbox = document.getElementById('lightbox');
const lightboxCaption = document.getElementById('lightboxCaption');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');
let activeGalleryList = [];
let currentPhotoIndex = 0;

function openLightbox(list, index){
  activeGalleryList = list;
  currentPhotoIndex = index;
  showPhoto(currentPhotoIndex);
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
}

function showPhoto(index){
  const photo = activeGalleryList[index];
  if(!photo) return;
  lightboxCaption.textContent = photo.caption || '';
  lightboxImg.src = photo.src;
  lightboxImg.alt = photo.caption || '';
}

function showNext(){
  if(!activeGalleryList.length) return;
  currentPhotoIndex = (currentPhotoIndex + 1) % activeGalleryList.length;
  showPhoto(currentPhotoIndex);
}

function showPrev(){
  if(!activeGalleryList.length) return;
  currentPhotoIndex = (currentPhotoIndex - 1 + activeGalleryList.length) % activeGalleryList.length;
  showPhoto(currentPhotoIndex);
}

lightboxNext?.addEventListener('click', (e) => { e.stopPropagation(); showNext(); });
lightboxPrev?.addEventListener('click', (e) => { e.stopPropagation(); showPrev(); });

function closeLightbox(){
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
}
lightboxClose?.addEventListener('click', closeLightbox);
lightbox?.addEventListener('click', (e) => { if(e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', (e) => {
  if(!lightbox.classList.contains('open')) return;
  if(e.key === 'Escape') closeLightbox();
  if(e.key === 'ArrowRight') showNext();
  if(e.key === 'ArrowLeft') showPrev();
});

renderGalleryInto('afterSchoolGallery', AFTER_SCHOOL_GALLERY);
renderGalleryInto('galleryGrid', LICEO_GALLERY);

// Cada botón de la cuadrícula "AS" abre su imagen/GIF en el mismo lightbox de la galería
document.querySelectorAll('#asVisual .as-icon').forEach((btn, i) => {
  btn.addEventListener('click', () => openLightbox(AS_ICON_MEDIA, i));
});

// ============ NOTICIAS, AGENDA Y REDES SOCIALES ============
// Enlaces reales del liceo — se usan tanto en los botones de "Síguenos"
// (en el HTML) como en las noticias que provienen de esas redes.
const FB_URL = 'https://web.facebook.com/Lgmistral';
const IG_URL = 'https://www.instagram.com/liceo.bgm.m/';

// ---- AGENDA / CALENDARIO ----
// Vacía por ahora — agrega aquí los eventos reales del liceo cuando los
// tengas (reuniones, actos, fechas de matrícula, etc). Cada objeto:
//   date          -> fecha exacta en formato 'AAAA-MM-DD', ej: '2026-09-05'
//   tag/tagLabel  -> 'reunion' → 'Reunión', 'actividad' → 'Actividad', 'fecha' → 'Fecha clave'
//   title / text  -> lo que quieras mostrar al hacer clic en el día
// Puede haber varios eventos en la misma fecha; se listan todos.
// Ejemplo (déjalo comentado como guía o bórralo cuando agregues el primero real):
//   { date: '2026-09-05', tag: 'reunion', tagLabel: 'Reunión', title: 'Reunión de apoderados', text: '18:30 hrs, gimnasio del liceo.' },
const EVENTS = [
];

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const calTitle = document.getElementById('calTitle');
const calendarGrid = document.getElementById('calendarGrid');
const calPrev = document.getElementById('calPrev');
const calNext = document.getElementById('calNext');

const today = new Date();
let calYear = today.getFullYear();
let calMonth = today.getMonth(); // 0-indexado

function isoDate(y, m, d){
  return `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

function eventsForDate(iso){
  return EVENTS.filter(ev => ev.date === iso);
}

function closeDayDetail(){
  const detail = document.getElementById('dayDetail');
  detail?.remove();
}

function openDayDetail(iso, items){
  closeDayDetail();
  const calendar = document.getElementById('calendar');
  if(!calendar) return;

  const [y, m, d] = iso.split('-');
  const dateLabel = `${d} de ${MESES[parseInt(m,10) - 1]} de ${y}`;

  const detail = document.createElement('div');
  detail.id = 'dayDetail';
  detail.className = 'day-detail is-open';
  detail.innerHTML = `
    <button class="day-detail-close" type="button" aria-label="Cerrar">✕</button>
    <span class="day-detail-date">${dateLabel}</span>
    ${items.map(it => `
      <div class="day-detail-item">
        <h4>${it.title}</h4>
        <p>${it.text || ''}</p>
      </div>
    `).join('')}
  `;
  calendar.appendChild(detail);
  detail.querySelector('.day-detail-close')?.addEventListener('click', closeDayDetail);
}

function renderCalendar(){
  if(!calendarGrid || !calTitle) return;
  closeDayDetail();

  calTitle.textContent = `${MESES[calMonth]} ${calYear}`;
  calendarGrid.innerHTML = '';

  const firstOfMonth = new Date(calYear, calMonth, 1);
  // Lunes = 0 ... Domingo = 6 (para que la semana empiece en lunes, como en Chile)
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(calYear, calMonth, 0).getDate();

  const todayIso = isoDate(today.getFullYear(), today.getMonth(), today.getDate());

  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  for(let i = 0; i < totalCells; i++){
    const dayNum = i - startOffset + 1;
    const cell = document.createElement('div');

    let cellYear = calYear, cellMonth = calMonth, cellDay = dayNum, isPad = false;
    if(dayNum < 1){
      isPad = true;
      cellMonth = calMonth - 1 < 0 ? 11 : calMonth - 1;
      cellYear = calMonth - 1 < 0 ? calYear - 1 : calYear;
      cellDay = daysInPrevMonth + dayNum;
    } else if(dayNum > daysInMonth){
      isPad = true;
      cellMonth = calMonth + 1 > 11 ? 0 : calMonth + 1;
      cellYear = calMonth + 1 > 11 ? calYear + 1 : calYear;
      cellDay = dayNum - daysInMonth;
    }

    const iso = isoDate(cellYear, cellMonth, cellDay);
    const dayEvents = eventsForDate(iso);

    cell.className = 'cal-cell' + (isPad ? ' is-pad' : '') + (iso === todayIso ? ' is-today' : '') + (dayEvents.length ? ' has-events' : '');

    const dayEl = document.createElement('span');
    dayEl.className = 'cal-day';
    dayEl.textContent = cellDay;
    cell.appendChild(dayEl);

    if(dayEvents.length){
      const tagsWrap = document.createElement('div');
      tagsWrap.className = 'cal-tags';
      dayEvents.slice(0, 2).forEach(ev => {
        const tagEl = document.createElement('span');
        tagEl.className = 'cal-tag tag-' + ev.tag;
        tagEl.textContent = ev.title;
        tagsWrap.appendChild(tagEl);
      });
      if(dayEvents.length > 2){
        const more = document.createElement('span');
        more.className = 'cal-more';
        more.textContent = `+${dayEvents.length - 2} más`;
        tagsWrap.appendChild(more);
      }
      cell.appendChild(tagsWrap);
      cell.addEventListener('click', () => openDayDetail(iso, dayEvents));
    }

    calendarGrid.appendChild(cell);
  }

  if(EVENTS.length === 0){
    calendarGrid.innerHTML = '<p class="cal-empty">Todavía no hay eventos agendados. Se irán marcando aquí a medida que se confirmen.</p>';
  }
}

calPrev?.addEventListener('click', () => {
  calMonth -= 1;
  if(calMonth < 0){ calMonth = 11; calYear -= 1; }
  renderCalendar();
});
calNext?.addEventListener('click', () => {
  calMonth += 1;
  if(calMonth > 11){ calMonth = 0; calYear += 1; }
  renderCalendar();
});

renderCalendar();

// ---- NOTICIAS ----
// Vacía por ahora — agrega aquí las noticias reales del liceo (o cópialas
// desde una publicación de Facebook/Instagram). Cada objeto:
//   date              -> '22 ago 2026'
//   title / text      -> lo que quieras mostrar
//   tag (opcional)    -> 'Noticia', 'Actividad' o 'Reconocimiento' (esta
//                        última se destaca en dorado, pensada para logros
//                        de estudiantes).
//   source (opcional) -> 'facebook' o 'instagram', si la noticia viene de
//                        esa red. Muestra un link "Ver en ..." en la tarjeta.
//   link (opcional)   -> URL directa a la publicación real. Si no la
//                        tienes, usa FB_URL o IG_URL (van al perfil).
// Ejemplo (déjalo comentado como guía o bórralo cuando agregues la primera real):
//   { date: '22 ago 2026', title: '...', text: '...', tag: 'Reconocimiento', source: 'instagram', link: IG_URL, color: 'g2' },
const NEWS = [
];

function renderNewsInto(containerId, list, emptyMessage){
  const grid = document.getElementById(containerId);
  if(!grid) return;
  grid.innerHTML = '';
  if(list.length === 0){
    grid.innerHTML = `<p class="news-empty">${emptyMessage}</p>`;
    return;
  }
  list.forEach(item => {
    const card = document.createElement('article');
    card.className = 'news-card';

    if(item.tag){
      const tagEl = document.createElement('span');
      tagEl.className = 'news-tag' + (item.tag === 'Reconocimiento' ? ' tag-reconocimiento' : '');
      tagEl.textContent = item.tag;
      card.appendChild(tagEl);
    }

    const thumb = document.createElement('div');
    thumb.className = 'news-thumb ' + (item.color || 'g1');
    thumb.textContent = 'Liceo Gabriela Mistral';

    const body = document.createElement('div');
    body.className = 'news-body';
    body.innerHTML = `<span class="news-date">${item.date}</span><h3>${item.title}</h3><p>${item.text}</p>`;

    if(item.source && item.link){
      const srcLabel = item.source === 'facebook' ? 'Ver en Facebook' : 'Ver en Instagram';
      const srcLink = document.createElement('a');
      srcLink.className = 'news-source src-' + item.source;
      srcLink.href = item.link;
      srcLink.target = '_blank';
      srcLink.rel = 'noopener';
      srcLink.innerHTML = `${srcLabel} <span class="src-arrow">↗</span>`;
      body.appendChild(srcLink);
    }

    card.append(thumb, body);
    grid.appendChild(card);
  });
}
renderNewsInto('newsGrid', NEWS, 'Todavía no hay noticias publicadas aquí. Mientras tanto, revisa las novedades en nuestro Facebook e Instagram.');

// ---- AVISOS PROPIOS DE AFTER SCHOOL ----
// Avisos y novedades solo del programa After School (cambios de horario,
// actividades especiales, etc.) — distintas de las noticias generales del liceo.
// Mismo formato que NEWS, arriba.
const AS_AVISOS = [
];
renderNewsInto('asAvisosGrid', AS_AVISOS, 'Todavía no hay avisos publicados para After School. Cuando haya novedades del programa, aparecerán aquí.');

// ============ FORMULARIOS DE CONTACTO ============
function setFieldError(input, message){
  input.classList.toggle('invalid', Boolean(message));
  const msgEl = input.closest('.field')?.querySelector('.field-msg');
  if(msgEl) msgEl.textContent = message || '';
}

function validateField(input){
  if(input.validity.valueMissing){
    setFieldError(input, 'Este campo es obligatorio.');
    return false;
  }
  if(input.type === 'email' && input.validity.typeMismatch){
    setFieldError(input, 'Ingresa un correo válido.');
    return false;
  }
  setFieldError(input, '');
  return true;
}

function wireContactForm(formId, successId, fieldIds, successMessage){
  const form = document.getElementById(formId);
  const successEl = document.getElementById(successId);
  if(!form) return;

  fieldIds.forEach(id => {
    const input = document.getElementById(id);
    input?.addEventListener('blur', () => validateField(input));
    input?.addEventListener('input', () => {
      if(input.classList.contains('invalid')) validateField(input);
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fields = fieldIds.map(id => document.getElementById(id));
    const allValid = fields.map(validateField).every(Boolean);

    if(!allValid){
      successEl.textContent = '';
      fields.find(f => f.classList.contains('invalid'))?.focus();
      return;
    }

    successEl.textContent = successMessage;
    form.reset();
    fields.forEach(f => setFieldError(f, ''));
  });
}

wireContactForm('contactForm', 'formSuccess', ['fName','fEmail','fMessage'],
  '¡Gracias! Tu mensaje quedó registrado (formulario de ejemplo — conéctalo a tu correo o backend).');

wireContactForm('asContactForm', 'asFormSuccess', ['asfName','asfEmail','asfMessage'],
  '¡Gracias! Tu consulta sobre After School quedó registrada (formulario de ejemplo — conéctalo a tu correo o backend).');