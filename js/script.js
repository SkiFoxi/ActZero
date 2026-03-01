// Управление видео в 3D-карточках: запуск при наведении, остановка при уходе
document.querySelectorAll('.group').forEach(card => {
  const video = card.querySelector('video');
  if (!video) return;

  card.addEventListener('mouseenter', () => {
    // Пытаемся воспроизвести видео (может быть заблокировано браузером)
    video.play().catch(e => {
      // Игнорируем ошибки автозапуска (пользователь должен сначала взаимодействовать со страницей)
      console.log('Видео не может быть запущено автоматически:', e);
    });
  });

  card.addEventListener('mouseleave', () => {
    video.pause();
    video.currentTime = 0; // сбрасываем на начало
  });
});