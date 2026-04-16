// ===== Глобальные функции для модальных окон =====
window.openModal = function() {
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
    } else {
        console.error('Модалка registerModal не найдена');
    }
};

window.closeModal = function() {
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = '';
    }
};

window.openLoginModal = function() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
    } else {
        console.error('Модалка loginModal не найдена');
    }
};

window.closeLoginModal = function() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = '';
    }
};

// ===== 3D карточки: hover (десктоп) + touch (мобильный) =====
document.querySelectorAll('.card-3d').forEach(card => {
  const video = card.querySelector('video');
  const inner = card.querySelector('.card-3d-inner');
  if (!video || !inner) return;

  video.load();

  card.addEventListener('mouseenter', () => {
    video.play().catch(() => {});
  });
  card.addEventListener('mouseleave', () => {
    video.pause();
    video.currentTime = 0;
  });

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
document.addEventListener('DOMContentLoaded', function() {
  let currentPath = location.pathname;
  if (currentPath.endsWith('/')) {
    currentPath += 'index.html';
  }

  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href.startsWith('/')) {
      let linkPath = href;
      if (linkPath.endsWith('/')) {
        linkPath += 'index.html';
      }
      if (currentPath === linkPath) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    }
  });
});

// ===== Инициализация модалок =====
// ИСПРАВЛЕНИЕ: вместо DOMContentLoaded + ненадёжного setTimeout
// теперь это отдельная функция, которую вызывает index.html
// строго ПОСЛЕ того как modal.html вставлен в DOM через fetch.
window.initModalListeners = function() {
    const registerModal = document.getElementById('registerModal');
    if (!registerModal) {
      console.error('modal.html не загружен — registerModal не найден');
      return;
    }

    // Регистрация
    const submitBtn = document.getElementById('submitRegister');
    if (submitBtn) {
      submitBtn.addEventListener('click', async () => {
        const name     = document.getElementById('regName')?.value.trim() || '';
        const email    = document.getElementById('regEmail')?.value.trim() || '';
        const phone    = document.getElementById('regPhone')?.value.trim() || '';
        const password = document.getElementById('regPassword')?.value || '';
        const agree    = document.getElementById('regAgree')?.checked || false;

        if (!name || !email || !password) {
          alert('Пожалуйста, заполните имя, email и пароль');
          return;
        }

        if (!agree) {
          alert('Примите условия использования');
          return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Отправка...';

        try {
          // Шаг 1 — регистрируем пользователя
          const regResponse = await fetch('http://localhost:8081/users', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  username: email,
                  password,
                  email,
                  full_name: name,
                  phone: phone || undefined
              })
          });

          if (!regResponse.ok) {
              const err = await regResponse.json();
              alert(err.error_description || 'Ошибка регистрации');
              return;
          }

          // Шаг 2 — получаем токен
          const tokenResponse = await fetch('http://localhost:8081/token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: `grant_type=password&client_id=actzero-client-id&client_secret=actzero-client-secret&username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
          });

          const tokenData = await tokenResponse.json();

          if (!tokenData.access_token) {
              // ИСПРАВЛЕНИЕ: раньше здесь было сообщение "войдите вручную",
              // что путало пользователя. Теперь показываем конкретную ошибку.
              alert('Ошибка входа после регистрации: ' + (tokenData.error_description || 'попробуйте ещё раз'));
              return;
          }

          localStorage.setItem('token', tokenData.access_token);
          closeModal();
          window.location.href = '/htmllist/lkabinet.html';
        } catch (error) {
          alert('Ошибка соединения с сервером');
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Зарегистрироваться';
        }
      });
    }

    // Логин
    const loginBtn = document.getElementById('submitLogin');
    if (loginBtn) {
      loginBtn.addEventListener('click', async () => {
        const email    = document.getElementById('loginEmail')?.value.trim();
        const password = document.getElementById('loginPassword')?.value;

        if (!email || !password) {
          alert('Заполните email и пароль');
          return;
        }

        loginBtn.disabled = true;
        loginBtn.textContent = 'Вход...';

        try {
          const tokenResponse = await fetch('http://localhost:8081/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `grant_type=password&client_id=actzero-client-id&client_secret=actzero-client-secret&username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
          });

          const tokenData = await tokenResponse.json();
          if (!tokenData.access_token) {
            alert('Неверный email или пароль');
            return;
          }

          localStorage.setItem('token', tokenData.access_token);
          closeLoginModal();
          window.location.href = '/htmllist/lkabinet.html';
        } catch (error) {
          alert('Ошибка соединения с сервером');
        } finally {
          loginBtn.disabled = false;
          loginBtn.textContent = 'Войти';
        }
      });
    }

    // Переключение между модалками
    const showLoginFromRegister = document.getElementById('showLoginFromRegister');
    if (showLoginFromRegister) {
      showLoginFromRegister.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal();
        openLoginModal();
      });
    }

    const showRegisterFromLogin = document.getElementById('showRegisterFromLogin');
    if (showRegisterFromLogin) {
      showRegisterFromLogin.addEventListener('click', (e) => {
        e.preventDefault();
        closeLoginModal();
        openModal();
      });
    }

    // Закрытие по крестику и бэкдропу
    const closeModalBtn = document.getElementById('closeModal');
    const modalBackdrop = document.getElementById('modalBackdrop');
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);

    const closeLoginModalBtn = document.getElementById('closeLoginModal');
    const loginModalBackdrop = document.getElementById('loginModalBackdrop');
    if (closeLoginModalBtn) closeLoginModalBtn.addEventListener('click', closeLoginModal);
    if (loginModalBackdrop) loginModalBackdrop.addEventListener('click', closeLoginModal);

    // Закрытие по Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal();
        closeLoginModal();
      }
    });

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
      { color: 'bg-red-400',    label: 'Слабый'   },
      { color: 'bg-orange-400', label: 'Средний'  },
      { color: 'bg-yellow-400', label: 'Хороший'  },
      { color: 'bg-green-500',  label: 'Отличный' }
    ];

    if (pwdInput) {
      pwdInput.addEventListener('input', () => {
        const v = pwdInput.value;
        let score = 0;
        if (v.length >= 8)          score++;
        if (/[A-Z]/.test(v))        score++;
        if (/[0-9]/.test(v))        score++;
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

    // Открытие по кнопкам "Перейти в кабинет"
    document.querySelectorAll('button').forEach(btn => {
      const text = btn.textContent.trim();
      if (text === 'Перейти в кабинет' || text === 'Попробовать бесплатно') {
        btn.addEventListener('click', openModal);
      }
    });
};