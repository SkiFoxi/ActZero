// ===== 3D карточки: hover (десктоп) + touch (мобильный) =====
document.querySelectorAll('.card-3d').forEach(card => {
  const video = card.querySelector('video');
  const inner = card.querySelector('.card-3d-inner');
  if (!video || !inner) return;

  video.load(); // принудительно начать загрузку (preload="none" иначе блокирует)

  // --- Десктоп: hover ---
  card.addEventListener('mouseenter', () => {
    video.play().catch(() => {});
  });
  card.addEventListener('mouseleave', () => {
    video.pause();
    video.currentTime = 0;
  });

  // --- Мобильный: tap = flip + play, повторный tap = flip назад + stop ---
  let flipped = false;
  card.addEventListener('touchstart', (e) => {
    e.preventDefault();
    flipped = !flipped;
    inner.style.transform = flipped ? 'rotateY(180deg)' : '';
    if (flipped) {
      video.play().catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, { passive: false });
});

// ===== Активная ссылка в навигации =====
(function () {
  const current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const page = link.getAttribute('href').split('/').pop();
    if (page === current) link.classList.add('active');
  });
})();