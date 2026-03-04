// ===== 3D карточки: hover (десктоп) + touch (мобильный) =====
document.querySelectorAll('.card-3d').forEach(card => {
  const video = card.querySelector('video');
  const inner = card.querySelector('.card-3d-inner');
  if (!video || !inner) return;

  video.load(); // принудительно начать загрузку

  // Десктоп: hover
  card.addEventListener('mouseenter', () => {
    video.play().catch(() => {});
  });
  card.addEventListener('mouseleave', () => {
    video.pause();
    video.currentTime = 0;
  });

  // Мобильный: tap = flip + play, повторный tap = flip назад + stop
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

// ===== Активная ссылка в навигации (надёжное сравнение путей) =====
document.addEventListener('DOMContentLoaded', function() {
  // Текущий путь, например: "/", "/index.html", "/htmllist/individuals.html"
  let currentPath = location.pathname;

  // Если путь заканчивается на "/" — добавляем index.html
  if (currentPath.endsWith('/')) {
    currentPath += 'index.html';
  }

  // Перебираем все ссылки навигации
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');

    // Работаем только с абсолютными ссылками (начинаются с /)
    if (href.startsWith('/')) {
      // Приводим ссылку к тому же формату, что и currentPath
      let linkPath = href;
      // Если ссылка заканчивается на "/", тоже добавляем index.html (хотя у нас таких нет)
      if (linkPath.endsWith('/')) {
        linkPath += 'index.html';
      }

      // Сравниваем полные пути
      if (currentPath === linkPath) {
        link.classList.add('active');
      } else {
        link.classList.remove('active'); // убираем активный класс у других
      }
    }
  });
});

// ===== Модальное окно регистрации (только если есть на странице) =====
if (document.getElementById('registerModal')) {
  const modal = document.getElementById('registerModal');
  const backdrop = document.getElementById('modalBackdrop');
  const closeBtn = document.getElementById('closeModal');

  window.openModal = function() {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
  };

  window.closeModal = function() {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
  };

  // Открытие по кнопкам "Перейти в кабинет" и "Попробовать бесплатно"
  document.querySelectorAll('button').forEach(btn => {
    const text = btn.textContent.trim();
    if (text === 'Перейти в кабинет' || text === 'Попробовать бесплатно') {
      btn.addEventListener('click', openModal);
    }
  });

  if (backdrop) backdrop.addEventListener('click', closeModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  // Password toggle
  const pwdInput = document.getElementById('regPassword');
  const togglePwd = document.getElementById('togglePassword');
  if (pwdInput && togglePwd) {
    togglePwd.addEventListener('click', () => {
      pwdInput.type = pwdInput.type === 'password' ? 'text' : 'password';
    });
  }

  // Password strength
  const bars = [
    document.getElementById('bar1'),
    document.getElementById('bar2'),
    document.getElementById('bar3'),
    document.getElementById('bar4')
  ].filter(Boolean);
  const strengthLabel = document.getElementById('strengthLabel');
  const levels = [
    { color: 'bg-red-400', label: 'Слабый' },
    { color: 'bg-orange-400', label: 'Средний' },
    { color: 'bg-yellow-400', label: 'Хороший' },
    { color: 'bg-green-500', label: 'Отличный' }
  ];

  if (pwdInput) {
    pwdInput.addEventListener('input', () => {
      const v = pwdInput.value;
      let score = 0;
      if (v.length >= 8) score++;
      if (/[A-Z]/.test(v)) score++;
      if (/[0-9]/.test(v)) score++;
      if (/[^A-Za-z0-9]/.test(v)) score++;

      bars.forEach((bar, i) => {
        bar.className = 'h-1 flex-1 rounded-full transition-all duration-300 ';
        bar.className += (i < score && score > 0) ? levels[score - 1].color : 'bg-gray-200';
      });
      if (strengthLabel) {
        strengthLabel.textContent = v.length > 0 ? levels[Math.max(score - 1, 0)].label : '';
      }
    });
  }

  // Submit
  const submitBtn = document.getElementById('submitRegister');
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      const name = document.getElementById('regName')?.value.trim() || '';
      const email = document.getElementById('regEmail')?.value.trim() || '';
      const agree = document.getElementById('regAgree')?.checked || false;

      if (!name || !email || !agree) {
        alert('Пожалуйста, заполните все поля и примите условия.');
        return;
      }

      closeModal();
      const toast = document.getElementById('successToast');
      if (toast) {
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3500);
      }
    });
  }
}