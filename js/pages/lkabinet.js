// ActZero SPA Router v2
const PAGES = {
  overview:  { title: 'Обзор',           sub: 'Добро пожаловать 👋' },
  campaigns: { title: 'Кампании',        sub: 'Управление рекламой' },
  stats:     { title: 'Статистика',      sub: 'Аналитика и отчёты' },
  budget:    { title: 'Бюджет и оплата', sub: 'Управление финансами' },
  map:       { title: 'Карта локаций',   sub: 'Рекомендации мест для бизнеса' },
  courses:   { title: 'Курсы',           sub: 'Обучение и развитие' },
  profile:   { title: 'Профиль',         sub: 'Настройки аккаунта' },
  help:      { title: 'Поддержка',       sub: 'Помощь и контакты' },
};

let mapInitialized = false;

function navigateTo(pageId, pushState = true) {
  if (!PAGES[pageId]) pageId = 'overview';

  // Скрываем все секции
  document.querySelectorAll('.page-section').forEach(el => {
    el.style.display = 'none';
    el.classList.remove('page-visible');
  });

  // Показываем нужную
  const pageEl = document.getElementById('page-' + pageId);
  if (!pageEl) return;
  pageEl.style.display = 'block';
  requestAnimationFrame(() => pageEl.classList.add('page-visible'));

  // Заголовок
  const info = PAGES[pageId];
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = info.title;
  const subEl = document.getElementById('page-subtitle');
  if (subEl && pageId !== 'overview') subEl.textContent = info.sub;

  // Активная ссылка
  document.querySelectorAll('.sidebar-link[data-page]').forEach(link => {
    link.classList.toggle('active', link.dataset.page === pageId);
  });

  // Hash
  if (pushState) history.pushState({ page: pageId }, '', '#' + pageId);

  // Карта
  if (pageId === 'map') {
    if (!mapInitialized) {
      if (typeof ymaps !== 'undefined') ymaps.ready(initMap);
      mapInitialized = true;
    } else if (window.map) {
      setTimeout(() => window.map.container.fitToViewport(), 100);
    }
  }

  // Курсы
  if (pageId === 'courses' && typeof renderCourses === 'function') renderCourses();

  // Контролы карты — скрываем/показываем
  document.querySelectorAll('.filter-selector-container, .city-selector-container').forEach(el => {
    el.style.visibility = pageId === 'map' ? 'visible' : 'hidden';
    el.style.pointerEvents = pageId === 'map' ? '' : 'none';
  });

  closeSidebar();
}

function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('overlay').classList.add('open');
}

function closeSidebar() {
  const s = document.getElementById('sidebar');
  const o = document.getElementById('overlay');
  if (s) s.classList.remove('open');
  if (o) o.classList.remove('open');
}

window.addEventListener('popstate', e => {
  const pageId = e.state?.page || location.hash.replace('#', '') || 'overview';
  navigateTo(pageId, false);
});

document.addEventListener('DOMContentLoaded', () => {
  const hash = location.hash.replace('#', '');
  navigateTo(PAGES[hash] ? hash : 'overview', false);
});