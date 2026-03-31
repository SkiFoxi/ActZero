// ========== ДАННЫЕ ЛОКАЦИЙ ==========
const locationsData = {
  locations: [
    {
      id: 'loc_1',
      name: 'Локация 1',
      address: 'ул. Примерная, д. 10, Москва',
      coordinates: { lat: 55.7558, lon: 37.6173 },
      region: 'Москва',
      city: 'Москва',
      description: 'Описание локации',
      business_types_suitable: ['cafe', 'restaurant'],
      traffic_score: 8.5,
      competition_density: 2.3,
      demographics: {
        age_group: '26-35',
        average_income: 75000,
        interests: ['food', 'technology'],
        population_density: 5000,
      },
      score: 0.95,
      image: '/video/Ai_image.png',
      images: ['/video/Ai_image.png', '/video/kaisa_1.png', 'https://via.placeholder.com/300x200?text=Image+3'],
    },
    {
      id: 'loc_2',
      name: 'Локация 2',
      address: 'ул. Тверская, д. 5, Москва',
      coordinates: { lat: 55.7584, lon: 37.6086 },
      region: 'Москва',
      city: 'Москва',
      description: 'Оживлённое место',
      business_types_suitable: ['shop', 'cafe'],
      traffic_score: 9.2,
      competition_density: 4.1,
      demographics: {
        age_group: '18-35',
        average_income: 80000,
        interests: ['shopping', 'food'],
        population_density: 7000,
      },
      score: 0.88,
      image: '/video/Ai_image.png',
      images: ['/video/kaisa_1.png', '/video/Ai_image.png', 'https://via.placeholder.com/300x200?text=Additional'],
    },
  ],
  total: 2,
};

// ========== SIDEBAR FUNCTIONS ==========
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('overlay').classList.add('open');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('open');
}

// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
let openTimer = null;
let closeTimer = null;
let currentBalloonPlacemark = null;

// ========== ФУНКЦИЯ ПОКАЗА ПАНОРАМЫ ==========
function showPanorama(lat, lon, locationName, locationAddress) {
  if (!ymaps.panorama || !ymaps.panorama.isSupported()) {
    alert('Ваш браузер не поддерживает панорамы.');
    return;
  }

  let panoramaContainer = document.getElementById('panorama-container');
  let closeBtn = null;

  if (!panoramaContainer) {
    panoramaContainer = document.createElement('div');
    panoramaContainer.id = 'panorama-container';
    panoramaContainer.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 80%;
      height: 80%;
      background: #fff;
      z-index: 1000;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      overflow: hidden;
    `;
    document.body.appendChild(panoramaContainer);

    closeBtn = document.createElement('button');
    closeBtn.innerText = '✕';
    closeBtn.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: #fff;
      border: none;
      font-size: 24px;
      cursor: pointer;
      z-index: 1001;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
      font-weight: bold;
    `;
    closeBtn.onclick = () => {
      panoramaContainer.remove();
    };
  } else {
    closeBtn = panoramaContainer.querySelector('button');
    if (!closeBtn) {
      closeBtn = document.createElement('button');
      closeBtn.innerText = '✕';
      closeBtn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: #fff;
        border: none;
        font-size: 24px;
        cursor: pointer;
        z-index: 1001;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        font-weight: bold;
      `;
      closeBtn.onclick = () => {
        panoramaContainer.remove();
      };
    }
  }

  panoramaContainer.innerHTML = '<div style="padding:20px; text-align:center;">Загрузка панорамы...</div>';
  if (closeBtn) panoramaContainer.appendChild(closeBtn);

  ymaps.panorama.locate([lat, lon]).then(
    function (panoramas) {
      if (!panoramas.length) {
        panoramaContainer.innerHTML = '<div style="padding:20px; text-align:center;">Панорама не найдена для этих координат</div>';
        if (closeBtn) panoramaContainer.appendChild(closeBtn);
        return;
      }

      const player = new ymaps.panorama.Player(panoramaContainer, panoramas[0], {
        direction: [0, -50],
        zoom: 1,
        controls: []
      });

      // Добавляем плавающую метку (фиксированная на экране, не в 3D)
      setTimeout(() => {
        const floatingMarker = document.createElement('div');
        floatingMarker.style.cssText = `
          position: absolute;
          bottom: 30px;
          right: 30px;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          color: white;
          font-family: 'Manrope', sans-serif;
          z-index: 1002;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 8px 20px rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.2);
          animation: floatMarker 3s ease-in-out infinite;
        `;

        const style = document.createElement('style');
        style.textContent = `
          @keyframes floatMarker {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
          }
        `;
        document.head.appendChild(style);

        floatingMarker.onmouseenter = () => {
          floatingMarker.style.transform = 'scale(1.05)';
          floatingMarker.style.background = 'rgba(0, 0, 0, 0.85)';
        };
        floatingMarker.onmouseleave = () => {
          floatingMarker.style.transform = 'scale(1)';
          floatingMarker.style.background = 'rgba(0, 0, 0, 0.75)';
        };
        floatingMarker.onclick = () => {
          panoramaContainer.remove();
        };

        const iconImg = document.createElement('img');
        iconImg.src = '/video/Ai_image.png';
        iconImg.style.cssText = 'width: 40px; height: 40px; border-radius: 50%; object-fit: cover; box-shadow: 0 2px 8px rgba(0,0,0,0.2);';

        const textDiv = document.createElement('div');
        textDiv.innerHTML = `
          <div style="font-weight: bold; font-size: 15px; margin-bottom: 4px;">${locationName}</div>
          <div style="font-size: 11px; opacity: 0.85;">${locationAddress}</div>
        `;

        floatingMarker.appendChild(iconImg);
        floatingMarker.appendChild(textDiv);
        panoramaContainer.appendChild(floatingMarker);

        if (closeBtn && !panoramaContainer.contains(closeBtn)) {
          panoramaContainer.appendChild(closeBtn);
        }
        if (closeBtn) closeBtn.style.zIndex = '1003';
      }, 500);
    },
    function (err) {
      console.error('Ошибка загрузки панорамы:', err);
      panoramaContainer.innerHTML = '<div style="padding:20px; text-align:center;">Не удалось загрузить панораму</div>';
      if (closeBtn) panoramaContainer.appendChild(closeBtn);
    }
  );
}

// ========== ФУНКЦИЯ ГЕНЕРАЦИИ СОДЕРЖИМОГО БАЛУНА ==========
function generateBalloonContent(location, currentIndex = 0) {
  const images = location.images || [];
  const hasImages = images.length > 0;

  const slideHtml = hasImages
    ? `
      <div class="carousel-slide">
        <img src="${images[currentIndex]}" alt="Изображение локации">
      </div>
    `
    : '<div class="carousel-slide"><div style="text-align:center; padding:20px;">Нет изображений</div></div>';

  const navHtml =
    hasImages && images.length > 1
      ? `
      <div class="carousel-nav">
        <button class="carousel-prev" title="Предыдущее">←</button>
        <span class="carousel-index">${currentIndex + 1} / ${images.length}</span>
        <button class="carousel-next" title="Следующее">→</button>
      </div>
    `
      : '';

  const incomeFormatted = new Intl.NumberFormat('ru-RU').format(location.demographics.average_income);

  const ageGroupMap = {
    '18-25': '🧑‍🎓',
    '26-35': '👨‍💼',
    '36-45': '👔',
    '46-60': '👴',
    '60+': '👵',
  };
  const ageIcon = ageGroupMap[location.demographics.age_group] || '👥';

  return `
    <div class="modern-balloon">
      <div class="carousel-container">
        ${slideHtml}
        ${navHtml}
      </div>
      <div class="balloon-info">
        <b>${location.name}</b>
        <div class="address">${location.address}</div>
        <div class="description">${location.description}</div>
        <div class="business-types">
          ${location.business_types_suitable
            .map(
              (type) =>
                `<span class="business-type">${
                  type === 'cafe' ? '☕ Кафе' : type === 'restaurant' ? '🍽️ Ресторан' : type === 'shop' ? '🛍️ Магазин' : type
                }</span>`
            )
            .join('')}
        </div>
        <div class="info-row">
          <div class="rating">Рейтинг: ${location.score}</div>
          <div class="score-badge">${location.score >= 0.9 ? '🔥 Высокий потенциал' : location.score >= 0.7 ? '📈 Хороший' : '📊 Средний'}</div>
        </div>
        <div class="info-row">
          <div class="traffic-score">Трафик: ${location.traffic_score}/10</div>
          <div class="competition-density">Конкуренция: ${location.competition_density}</div>
        </div>
        <div class="demographics">
          <span class="demographics-item">${ageIcon} ${location.demographics.age_group}</span>
          <span class="demographics-item">💰 ${incomeFormatted} ₽</span>
          <span class="demographics-item">👥 ${location.demographics.population_density} чел/км²</span>
        </div>
        <button 
          class="panorama-btn" 
          onclick="showPanorama(${location.coordinates.lat}, ${location.coordinates.lon}, '${location.name}', '${location.address}')"
          style="margin-top: 12px; width: 100%; padding: 8px; background: #1e40af; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; font-size: 14px;"
        >
          🌍 Посмотреть панораму
        </button>
      </div>
    </div>
  `;
}

// ========== ИНИЦИАЛИЗАЦИЯ КАРУСЕЛИ ==========
function initCarousel(balloonElement, location) {
  const images = location.images || [];
  if (images.length <= 1) return;

  let currentIndex = 0;
  const slideDiv = balloonElement.querySelector('.carousel-slide');
  const indexSpan = balloonElement.querySelector('.carousel-index');
  const prevBtn = balloonElement.querySelector('.carousel-prev');
  const nextBtn = balloonElement.querySelector('.carousel-next');

  if (!slideDiv || !indexSpan || !prevBtn || !nextBtn) return;

  function updateSlide() {
    slideDiv.innerHTML = `<img src="${images[currentIndex]}" alt="Изображение локации">`;
    indexSpan.textContent = `${currentIndex + 1} / ${images.length}`;
  }

  const onPrev = (e) => {
    e.stopPropagation();
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    updateSlide();
  };

  const onNext = (e) => {
    e.stopPropagation();
    currentIndex = (currentIndex + 1) % images.length;
    updateSlide();
  };

  prevBtn.addEventListener('click', onPrev);
  nextBtn.addEventListener('click', onNext);

  balloonElement._carouselHandlers = { onPrev, onNext };
}

// ========== ПЛАНИРОВЩИК ЗАКРЫТИЯ БАЛУНА ==========
function scheduleCloseBalloon(placemark) {
  if (closeTimer) clearTimeout(closeTimer);
  closeTimer = setTimeout(() => {
    if (placemark && placemark.balloon && placemark.balloon.isOpen()) {
      placemark.balloon.close();
    }
    closeTimer = null;
  }, 4000);
}

// ========== ОТКРЫТИЕ БАЛУНА С ЗАДЕРЖКОЙ ==========
function openBalloonWithDelay(placemark, location) {
  if (currentBalloonPlacemark === placemark && placemark.balloon.isOpen()) {
    return;
  }

  if (openTimer) {
    clearTimeout(openTimer);
    openTimer = null;
  }

  if (currentBalloonPlacemark && currentBalloonPlacemark !== placemark && currentBalloonPlacemark.balloon.isOpen()) {
    currentBalloonPlacemark.balloon.close();
  }

  openTimer = setTimeout(() => {
    if (currentBalloonPlacemark === placemark && placemark.balloon.isOpen()) {
      return;
    }

    const balloonHtml = generateBalloonContent(location);
    placemark.properties.set('balloonContent', balloonHtml);
    placemark.balloon.open();
    currentBalloonPlacemark = placemark;

    setTimeout(() => {
      const balloonElement = document.querySelector('.ymaps-2-1-79-balloon');
      if (balloonElement && placemark.userData) {
        initCarousel(balloonElement, placemark.userData);

        const onBalloonMouseEnter = () => {
          if (closeTimer) {
            clearTimeout(closeTimer);
            closeTimer = null;
          }
        };
        const onBalloonMouseLeave = () => {
          scheduleCloseBalloon(placemark);
        };
        balloonElement.addEventListener('mouseenter', onBalloonMouseEnter);
        balloonElement.addEventListener('mouseleave', onBalloonMouseLeave);
        balloonElement._mouseHandlers = { onBalloonMouseEnter, onBalloonMouseLeave };
      }
    }, 50);
  }, 300);
}

// ========== МЕНЮ ВЫБОРА ГОРОДА С ПОИСКОМ ==========
function setupCitySelector(map) {
  // Контейнер меню
  const selectorContainer = document.createElement('div');
  selectorContainer.className = 'city-selector-container';

  // Кнопка-переключатель
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'city-selector-toggle';
  toggleBtn.innerHTML = '🌍 Города';
  toggleBtn.title = 'Выбрать город';

  // Панель
  const panel = document.createElement('div');
  panel.className = 'city-selector-panel';
  panel.style.display = 'none';

  // Поле ввода и кнопка
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Введите название города...';
  searchInput.className = 'city-search-input';

  const searchBtn = document.createElement('button');
  searchBtn.textContent = 'Найти';
  searchBtn.className = 'city-search-btn';

  // Контейнер для подсказок
  const suggestionsContainer = document.createElement('div');
  suggestionsContainer.className = 'city-suggestions';

  // Контейнер для истории
  const historyTitle = document.createElement('div');
  historyTitle.className = 'city-history-title';
  historyTitle.textContent = 'Недавние города';
  const historyList = document.createElement('ul');
  historyList.className = 'city-results-list';

  // Сообщения об ошибках
  const messageDiv = document.createElement('div');
  messageDiv.className = 'city-message';
  messageDiv.style.display = 'none';

  // Сборка панели
  panel.appendChild(searchInput);
  panel.appendChild(suggestionsContainer);
  panel.appendChild(searchBtn);
  panel.appendChild(messageDiv);
  panel.appendChild(historyTitle);
  panel.appendChild(historyList);

  selectorContainer.appendChild(toggleBtn);
  selectorContainer.appendChild(panel);
  document.body.appendChild(selectorContainer);

  // ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

  let debounceTimer = null;

  // Поиск города (вызывается при клике на кнопку или выборе подсказки)
  async function searchCity(query) {
    if (!query.trim()) return;

    searchBtn.disabled = true;
    searchBtn.textContent = 'Поиск...';
    messageDiv.style.display = 'none';
    suggestionsContainer.style.display = 'none';

    try {
      const res = await ymaps.geocode(query, { results: 1 });
      const firstGeo = res.geoObjects.get(0);
      if (!firstGeo) {
        messageDiv.textContent = 'Город не найден. Попробуйте уточнить название.';
        messageDiv.style.display = 'block';
        return;
      }

      const coords = firstGeo.geometry.getCoordinates();
      const name = firstGeo.getAddressLine() || query;

      addToHistory(name, coords);
      map.setCenter(coords, 12);
      panel.style.display = 'none';
    } catch (err) {
      console.error(err);
      messageDiv.textContent = 'Ошибка при поиске. Попробуйте позже.';
      messageDiv.style.display = 'block';
    } finally {
      searchBtn.disabled = false;
      searchBtn.textContent = 'Найти';
    }
  }

  // Сохранение истории (максимум 3 записи)
  function addToHistory(name, coords) {
    let history = JSON.parse(localStorage.getItem('citySearchHistory') || '[]');
    history = history.filter(item => item.name !== name);
    history.unshift({ name, coords, timestamp: Date.now() });
    history = history.slice(0, 3);
    localStorage.setItem('citySearchHistory', JSON.stringify(history));
    renderHistory();
  }

  // Отображение истории
  function renderHistory() {
    const history = JSON.parse(localStorage.getItem('citySearchHistory') || '[]');
    historyList.innerHTML = '';
    if (history.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'Нет недавних городов';
      li.className = 'empty-history';
      historyList.appendChild(li);
      return;
    }
    history.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item.name;
      li.addEventListener('click', () => {
        map.setCenter(item.coords, 12);
        panel.style.display = 'none';
      });
      historyList.appendChild(li);
    });
  }

  // Загрузка подсказок – предпочтительно suggest, fallback геокодер
  async function loadSuggestions(query) {
    if (!query.trim() || query.length < 2) {
      suggestionsContainer.style.display = 'none';
      return;
    }

    try {
      let items = [];
      // Пытаемся использовать suggest, если он доступен
      if (typeof ymaps.suggest === 'function') {
        try {
          const suggestResult = await ymaps.suggest(query);
          items = suggestResult.map(item => ({
            displayName: item.displayName,
            value: item.value
          }));
        } catch (err) {
          console.warn('ymaps.suggest недоступен, используем геокодер', err);
          // fallback на геокодер
          const geoRes = await ymaps.geocode(query, { results: 5 });
          geoRes.geoObjects.each(obj => {
            const name = obj.getAddressLine();
            if (name) items.push({ displayName: name, value: name });
          });
        }
      } else {
        // suggest нет, используем геокодер
        const geoRes = await ymaps.geocode(query, { results: 5 });
        geoRes.geoObjects.each(obj => {
          const name = obj.getAddressLine();
          if (name) items.push({ displayName: name, value: name });
        });
      }

      if (items.length === 0) {
        suggestionsContainer.style.display = 'none';
        return;
      }

      suggestionsContainer.innerHTML = '';
      items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'city-suggestion-item';
        div.textContent = item.displayName;
        div.addEventListener('click', () => {
          searchInput.value = item.displayName;
          suggestionsContainer.style.display = 'none';
          searchCity(item.displayName);
        });
        suggestionsContainer.appendChild(div);
      });
      suggestionsContainer.style.display = 'block';
    } catch (err) {
      console.error('Ошибка загрузки подсказок:', err);
      suggestionsContainer.style.display = 'none';
    }
  }

  // Обработчик ввода с debounce
  function onInputChange(e) {
    const val = e.target.value;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      loadSuggestions(val);
    }, 300);
  }

  // ========== ПОДКЛЮЧЕНИЕ ОБРАБОТЧИКОВ ==========

  searchBtn.addEventListener('click', () => {
    searchCity(searchInput.value);
  });

  searchInput.addEventListener('input', onInputChange);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      searchCity(searchInput.value);
    }
  });

  // Закрытие подсказок при потере фокуса
  searchInput.addEventListener('blur', () => {
    setTimeout(() => {
      suggestionsContainer.style.display = 'none';
    }, 200);
  });

  // Открытие/закрытие панели
  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isVisible = panel.style.display === 'flex';
    panel.style.display = isVisible ? 'none' : 'flex';
    if (!isVisible) {
      searchInput.focus();
      renderHistory();
      suggestionsContainer.style.display = 'none';
    }
  });

  // Закрытие при клике вне меню
  document.addEventListener('click', (e) => {
    if (!selectorContainer.contains(e.target)) {
      panel.style.display = 'none';
    }
  });

  // Инициализация
  renderHistory();
}

// ========== MAP INITIALIZATION ==========
function initMap() {
  const firstLocation = locationsData.locations[0];
  const center = firstLocation ? [firstLocation.coordinates.lat, firstLocation.coordinates.lon] : [55.7558, 37.6173];

  const map = new ymaps.Map('map', {
    center: center,
    zoom: 12,
    controls: ['zoomControl', 'fullscreenControl'],
    balloonAutoPan: false,
  });

  // Сохраняем карту глобально для использования в других функциях
  window.map = map;

  let markersVisible = true;
  let markers = [];
  let clusterMarker = null;

  function getClusterCenter() {
    let avgLat = 0, avgLon = 0;
    locationsData.locations.forEach((loc) => {
      avgLat += loc.coordinates.lat;
      avgLon += loc.coordinates.lon;
    });
    return [avgLat / locationsData.locations.length, avgLon / locationsData.locations.length];
  }

  function showIndividualMarkers() {
    if (clusterMarker) {
      map.geoObjects.remove(clusterMarker);
      clusterMarker = null;
    }

    locationsData.locations.forEach((location, index) => {
      if (markers[index]) return;

      const coords = [location.coordinates.lat, location.coordinates.lon];
      const image = location.image ? location.image : '/video/Ai_image.png';

      const placemark = new ymaps.Placemark(
        coords,
        {
          hintContent: location.name,
          iconCaption: (index + 1).toString(),
        },
        {
          iconLayout: 'default#image',
          iconImageHref: image,
          iconImageSize: [40, 40],
          iconImageOffset: [-20, -40],
          openBalloonOnClick: false,
          hideIconOnBalloonOpen: false,
          balloonOffset: [-100, -27],
        }
      );

      placemark.userData = location;

      placemark.events.add('mouseenter', () => {
        openBalloonWithDelay(placemark, location);
      });

      placemark.events.add('mouseleave', () => {
        if (openTimer) {
          clearTimeout(openTimer);
          openTimer = null;
        }
        scheduleCloseBalloon(placemark);
      });

      map.geoObjects.add(placemark);
      markers[index] = placemark;
    });

    markersVisible = true;
  }

  function showClusterMarker() {
    markers.forEach((marker) => {
      if (marker) {
        map.geoObjects.remove(marker);
      }
    });
    markers = [];

    const center = getClusterCenter();
    const count = locationsData.locations.length;

    const balloonContent = `
      <div style="text-align: center; max-width: 280px;">
        <b>Локации</b><br>
        Всего: ${count}<br>
        <small>Приближайте карту для подробностей</small>
      </div>
    `;

    const clusterImage = '/video/Ai_image.png';
    const clusterSize = [60, 60];
    const clusterOffset = [-30, -60];

    clusterMarker = new ymaps.Placemark(
      center,
      {
        balloonContent: balloonContent,
        hintContent: `Локации (${count})`,
        iconContent: count.toString(),
      },
      {
        iconLayout: 'default#imageWithContent',
        iconImageHref: clusterImage,
        iconImageSize: clusterSize,
        iconImageOffset: clusterOffset,
        iconContentOffset: [0, 0],
        iconContentSize: clusterSize,
        iconContentPadding: [0, 0, 0, 0],
        iconContentStyle: {
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#ffffff',
          textAlign: 'center',
          lineHeight: `${clusterSize[1]}px`,
          textShadow: '0 0 4px rgba(0,0,0,0.7)',
        },
        openBalloonOnClick: true,
      }
    );

    map.geoObjects.add(clusterMarker);
    markersVisible = false;
  }

  map.events.add('boundschange', () => {
    const zoom = map.getZoom();
    if (zoom < 14 && markersVisible) {
      showClusterMarker();
    } else if (zoom >= 14 && !markersVisible) {
      showIndividualMarkers();
    }
  });

  map.events.add('click', () => {
    if (currentBalloonPlacemark && currentBalloonPlacemark.balloon.isOpen()) {
      currentBalloonPlacemark.balloon.close();
    }
  });

  showIndividualMarkers();

  if (locationsData.locations.length > 1) {
    const allCoords = locationsData.locations.map((loc) => [loc.coordinates.lat, loc.coordinates.lon]);
    const bounds = ymaps.util.bounds.fromPoints(allCoords);
    map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 50 });
  }

  const mapContainer = document.getElementById('map');
  const resizeObserver = new ResizeObserver(() => {
    if (locationsData.locations.length > 1) {
      const allCoords = locationsData.locations.map((loc) => [loc.coordinates.lat, loc.coordinates.lon]);
      const bounds = ymaps.util.bounds.fromPoints(allCoords);
      map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 50 });
    }
    map.container.fitToViewport();
  });
  resizeObserver.observe(mapContainer);

  map.events.add('balloonclose', () => {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    currentBalloonPlacemark = null;

    const balloonElement = document.querySelector('.ymaps-2-1-79-balloon');
    if (balloonElement && balloonElement._mouseHandlers) {
      balloonElement.removeEventListener('mouseenter', balloonElement._mouseHandlers.onBalloonMouseEnter);
      balloonElement.removeEventListener('mouseleave', balloonElement._mouseHandlers.onBalloonMouseLeave);
      delete balloonElement._mouseHandlers;
    }
    if (balloonElement && balloonElement._carouselHandlers) {
      const prevBtn = balloonElement.querySelector('.carousel-prev');
      const nextBtn = balloonElement.querySelector('.carousel-next');
      if (prevBtn) prevBtn.removeEventListener('click', balloonElement._carouselHandlers.onPrev);
      if (nextBtn) nextBtn.removeEventListener('click', balloonElement._carouselHandlers.onNext);
      delete balloonElement._carouselHandlers;
    }
  });

  // Добавляем меню выбора города с поиском
  setupCitySelector(map);

  return map;
}

// ========== DOM READY ==========
document.addEventListener('DOMContentLoaded', () => {
  if (typeof ymaps !== 'undefined') {
    ymaps.ready(initMap);
  } else {
    console.error('Яндекс.Карты не загрузились');
  }
});