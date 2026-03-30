// ========== ДАННЫЕ ЛОКАЦИЙ ==========
const locationsData = {
  "locations": [
    {
      "id": "loc_1",
      "name": "Локация 1",
      "address": "ул. Примерная, д. 10, Москва",
      "coordinates": { "lat": 55.7558, "lon": 37.6173 },
      "region": "Москва",
      "city": "Москва",
      "description": "Описание локации",
      "business_types_suitable": ["cafe", "restaurant"],
      "traffic_score": 8.5,
      "competition_density": 2.3,
      "demographics": {
        "age_group": "26-35",
        "average_income": 75000,
        "interests": ["food", "technology"],
        "population_density": 5000
      },
      "score": 0.95,
      "image": "/video/Ai_image.png",   // изображение для метки
      "images": [                        // изображения для балуна (карусель)
        "/video/Ai_image.png",
        "/video/kaisa_1.png",
        "https://via.placeholder.com/300x200?text=Image+3"
      ]
    },
    {
      "id": "loc_2",
      "name": "Локация 2",
      "address": "ул. Тверская, д. 5, Москва",
      "coordinates": { "lat": 55.7584, "lon": 37.6086 },
      "region": "Москва",
      "city": "Москва",
      "description": "Оживлённое место",
      "business_types_suitable": ["shop", "cafe"],
      "traffic_score": 9.2,
      "competition_density": 4.1,
      "demographics": {
        "age_group": "18-35",
        "average_income": 80000,
        "interests": ["shopping", "food"],
        "population_density": 7000
      },
      "score": 0.88,
      "image": "/video/Ai_image.png",
      "images": [
        "/video/kaisa_1.png",
        "/video/Ai_image.png",
        "https://via.placeholder.com/300x200?text=Additional"
      ]
    }
  ],
  "total": 2
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
let closeTimer = null;           // таймер закрытия балуна
let openTimer = null;            // таймер задержки открытия
let currentBalloonPlacemark = null; // текущая метка с открытым балуном

// ========== ФУНКЦИЯ ГЕНЕРАЦИИ СОДЕРЖИМОГО БАЛУНА ==========
// ========== ФУНКЦИЯ ГЕНЕРАЦИИ СОДЕРЖИМОГО БАЛУНА (СОВРЕМЕННЫЙ ДИЗАЙН) ==========
function generateBalloonContent(location, currentIndex = 0) {
  const images = location.images || [];
  const hasImages = images.length > 0;

  // Слайд изображения
  const slideHtml = hasImages ? `
    <div class="carousel-slide">
      <img src="${images[currentIndex]}" alt="Изображение локации">
    </div>
  ` : '<div class="carousel-slide"><div style="text-align:center; padding:20px;">Нет изображений</div></div>';

  // Навигация (только если больше 1 изображения)
  const navHtml = hasImages && images.length > 1 ? `
    <div class="carousel-nav">
      <button class="carousel-prev" title="Предыдущее">←</button>
      <span class="carousel-index">${currentIndex + 1} / ${images.length}</span>
      <button class="carousel-next" title="Следующее">→</button>
    </div>
  ` : '';

  // Форматируем средний доход
  const incomeFormatted = new Intl.NumberFormat('ru-RU').format(location.demographics.average_income);

  // Возрастная группа с иконкой
  const ageGroupMap = {
    "18-25": "🧑‍🎓",
    "26-35": "👨‍💼",
    "36-45": "👔",
    "46-60": "👴",
    "60+": "👵"
  };
  const ageIcon = ageGroupMap[location.demographics.age_group] || "👥";

  // Формируем HTML с современным дизайном
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
          ${location.business_types_suitable.map(type => `<span class="business-type">${type === 'cafe' ? '☕ Кафе' : type === 'restaurant' ? '🍽️ Ресторан' : type === 'shop' ? '🛍️ Магазин' : type}</span>`).join('')}
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
        <div class="info-row">
          <div class="rating">Рейтинг: ${location.score}</div>
          <div class="score-badge">${location.score >= 0.9 ? '🔥 Высокий потенциал' : location.score >= 0.7 ? '📈 Хороший' : '📊 Средний'}</div>
        </div>
      </div>
    </div>
  `;
}

// ========== ИНИЦИАЛИЗАЦИЯ КАРУСЕЛИ ВНУТРИ БАЛУНА ==========
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

  // Сохраняем обработчики для очистки
  balloonElement._carouselHandlers = { onPrev, onNext };
}

// ========== ОТКРЫТИЕ БАЛУНА С ЗАДЕРЖКОЙ ==========
function openBalloonWithDelay(placemark, location) {
  // Если уже открыт этот же балун, ничего не делаем
  if (currentBalloonPlacemark === placemark && placemark.balloon.isOpen()) {
    return;
  }

  // Отменяем существующий таймер закрытия и открытия
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
  if (openTimer) {
    clearTimeout(openTimer);
    openTimer = null;
  }

  // Задержка 300 мс перед открытием
  openTimer = setTimeout(() => {
    // Проверяем, не закрыт ли уже балун (например, мышь ушла до открытия)
    if (currentBalloonPlacemark === placemark && placemark.balloon.isOpen()) {
      return;
    }

    // Генерируем содержимое балуна
    const balloonHtml = generateBalloonContent(location);
    placemark.properties.set('balloonContent', balloonHtml);

    // Открываем балун
    placemark.balloon.open();

    // Запоминаем текущую метку
    currentBalloonPlacemark = placemark;

    // После открытия инициализируем карусель и обработчики задержки на балуне
    setTimeout(() => {
      const balloonElement = document.querySelector('.ymaps-2-1-79-balloon');
      if (balloonElement && placemark.userData) {
        // Инициализируем карусель
        initCarousel(balloonElement, placemark.userData);

        // Добавляем обработчики для удержания балуна при наведении
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
    }, 50); // Небольшая задержка, чтобы DOM успел отрисоваться
  }, 300);
}

// ========== ПЛАНИРОВЩИК ЗАКРЫТИЯ БАЛУНА ==========
function scheduleCloseBalloon(placemark) {
  if (closeTimer) clearTimeout(closeTimer);
  closeTimer = setTimeout(() => {
    if (placemark.balloon.isOpen()) {
      placemark.balloon.close();
    }
    closeTimer = null;
  }, 200);
}

// ========== MAP INITIALIZATION ==========
function initMap() {
  const firstLocation = locationsData.locations[0];
  const center = firstLocation
    ? [firstLocation.coordinates.lat, firstLocation.coordinates.lon]
    : [55.7558, 37.6173];

  const map = new ymaps.Map("map", {
    center: center,
    zoom: 12,
    controls: ["zoomControl", "fullscreenControl"],
    balloonAutoPan: false // ← отключаем перемещение карты при открытии балуна
  });

  let markersVisible = true;
  let markers = [];
  let clusterMarker = null;

  // Получаем центр всех локаций
  function getClusterCenter() {
    let avgLat = 0, avgLon = 0;
    locationsData.locations.forEach(loc => {
      avgLat += loc.coordinates.lat;
      avgLon += loc.coordinates.lon;
    });
    return [avgLat / locationsData.locations.length, avgLon / locationsData.locations.length];
  }

  // Функция для добавления отдельных меток
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
          iconCaption: (index + 1).toString()
        },
        {
          iconLayout: 'default#image',
          iconImageHref: image,
          iconImageSize: [40, 40],
          iconImageOffset: [-20, -40],
          openBalloonOnClick: false // отключаем открытие по клику
        }
      );

      placemark.userData = location;

      // События мыши на метке
      placemark.events.add('mouseenter', () => {
        openBalloonWithDelay(placemark, location);
      });

      placemark.events.add('mouseleave', () => {
        // Отменяем таймер открытия, если он ещё не сработал
        if (openTimer) {
          clearTimeout(openTimer);
          openTimer = null;
        }
        // Запускаем таймер закрытия
        scheduleCloseBalloon(placemark);
      });

      map.geoObjects.add(placemark);
      markers[index] = placemark;
    });

    markersVisible = true;
  }

  // Функция для показа кластер метки
  function showClusterMarker() {
    markers.forEach(marker => {
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

    clusterMarker = new ymaps.Placemark(
      center,
      {
        balloonContent: balloonContent,
        hintContent: `Локации (${count})`,
        iconCaption: count.toString()
      },
      {
        preset: "islands#blueCircleIcon",
        openBalloonOnClick: true
      }
    );

    map.geoObjects.add(clusterMarker);
    markersVisible = false;
  }

  // Обработчик изменения зума
  map.events.add('boundschange', () => {
    const zoom = map.getZoom();
    if (zoom < 14 && markersVisible) {
      showClusterMarker();
    } else if (zoom >= 14 && !markersVisible) {
      showIndividualMarkers();
    }
  });

  // Инициальная загрузка
  showIndividualMarkers();

  // Подгоняем карту под все локации
  if (locationsData.locations.length > 1) {
    const allCoords = locationsData.locations.map(loc =>
      [loc.coordinates.lat, loc.coordinates.lon]
    );
    const bounds = ymaps.util.bounds.fromPoints(allCoords);
    map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 50 });
  }

  // Обработка изменения размера окна
  const mapContainer = document.getElementById('map');
  const resizeObserver = new ResizeObserver(() => {
    if (locationsData.locations.length > 1) {
      const allCoords = locationsData.locations.map(loc =>
        [loc.coordinates.lat, loc.coordinates.lon]
      );
      const bounds = ymaps.util.bounds.fromPoints(allCoords);
      map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 50 });
    }
    map.container.fitToViewport();
  });
  resizeObserver.observe(mapContainer);

  // Очистка при закрытии балуна
  map.events.add('balloonclose', () => {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    currentBalloonPlacemark = null;

    // Удаляем обработчики с балуна
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