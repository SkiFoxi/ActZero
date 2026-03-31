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

  // Если уже открыт другой балун, закрываем его
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

        // Обработчики для удержания балуна при наведении
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

  let markersVisible = true;
  let markers = [];
  let clusterMarker = null;

  function getClusterCenter() {
    let avgLat = 0,
      avgLon = 0;
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
          balloonOffset: [-100, -27], // центрирование над меткой, смещение вверх
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

    clusterMarker = new ymaps.Placemark(
      center,
      {
        balloonContent: balloonContent,
        hintContent: `Локации (${count})`,
        iconCaption: count.toString(),
      },
      {
        preset: 'islands#blueCircleIcon',
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