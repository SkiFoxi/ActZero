// ========== ГЛОБАЛЬНЫЕ НАСТРОЙКИ ==========
const DEFAULT_MARKER_IMAGE = '/video/Ai_image.png';

let currentClusterer = null;
let preloadedMarkerData = new Map(); // key = location.id, value = { originalUrl, blueUrl }
let mapInstance = null;
let originalFilterTop = null;
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
      description: 'Оживлённое место',
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
      // image можно не указывать — будет использован DEFAULT_MARKER_IMAGE
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
      images: ['/video/kaisa_1.png', '/video/Ai_image.png', 'https://via.placeholder.com/300x200?text=Additional'],
    },
    {
      id: 'loc_2',
      name: 'Локация 2',
      address: 'ул. Тверская, д. 5, Тамбов',
      coordinates: { lat: 52.7212, lon: 41.4529 },
      region: 'Тамбов',
      city: 'Тамбов',
      description: 'Оживлённое место',
      business_types_suitable: ['shop', 'cafe'],
      traffic_score: 7.0,
      competition_density: 4.1,
      demographics: {
        age_group: '18-35',
        average_income: 80000,
        interests: ['shopping', 'food'],
        population_density: 7000,
      },
      score: 0.88,
      images: ['/video/kaisa_1.png', '/video/Ai_image.png', 'https://via.placeholder.com/300x200?text=Additional'],
    },
    {
      id: 'loc_2',
      name: 'Локация 2',
      address: 'ул. Тверская, д. 5, Тамбов',
      coordinates: { lat: 52.7212, lon: 41.6529 },
      region: 'Тамбов',
      city: 'Тамбов',
      description: 'Оживлённое место',
      business_types_suitable: ['shop', 'cafe'],
      traffic_score: 2.0,
      competition_density: 4.1,
      demographics: {
        age_group: '18-35',
        average_income: 80000,
        interests: ['shopping', 'food'],
        population_density: 7000,
      },
      score: 0.3,
      images: [],
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
        iconImg.src = DEFAULT_MARKER_IMAGE;
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


  const humanSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#000000" viewBox="0 0 256 256"><path d="M160,40a32,32,0,1,0-32,32A32,32,0,0,0,160,40ZM128,56a16,16,0,1,1,16-16A16,16,0,0,1,128,56Zm90.34,78.05L173.17,82.83a32,32,0,0,0-24-10.83H106.83a32,32,0,0,0-24,10.83L37.66,134.05a20,20,0,0,0,28.13,28.43l16.3-13.08L65.55,212.28A20,20,0,0,0,102,228.8l26-44.87,26,44.87a20,20,0,0,0,36.41-16.52L173.91,149.4l16.3,13.08a20,20,0,0,0,28.13-28.43Zm-11.51,16.77a4,4,0,0,1-5.66,0c-.21-.2-.42-.4-.65-.58L165,121.76A8,8,0,0,0,152.26,130L175.14,217a7.72,7.72,0,0,0,.48,1.35,4,4,0,1,1-7.25,3.38,6.25,6.25,0,0,0-.33-.63L134.92,164a8,8,0,0,0-13.84,0L88,221.05a6.25,6.25,0,0,0-.33.63,4,4,0,0,1-2.26,2.07,4,4,0,0,1-5-5.45,7.72,7.72,0,0,0,.48-1.35L103.74,130A8,8,0,0,0,91,121.76L55.48,150.24c-.23.18-.44.38-.65.58a4,4,0,1,1-5.66-5.65c.12-.12.23-.24.34-.37L94.83,93.41a16,16,0,0,1,12-5.41h42.34a16,16,0,0,1,12,5.41l45.32,51.39c.11.13.22.25.34.37A4,4,0,0,1,206.83,150.82Z"></path></svg>
  `;

  const moneySvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#000000" viewBox="0 0 256 256"><path d="M184,89.57V84c0-25.08-37.83-44-88-44S8,58.92,8,84v40c0,20.89,26.25,37.49,64,42.46V172c0,25.08,37.83,44,88,44s88-18.92,88-44V132C248,111.3,222.58,94.68,184,89.57ZM232,132c0,13.22-30.79,28-72,28-3.73,0-7.43-.13-11.08-.37C170.49,151.77,184,139,184,124V105.74C213.87,110.19,232,122.27,232,132ZM72,150.25V126.46A183.74,183.74,0,0,0,96,128a183.74,183.74,0,0,0,24-1.54v23.79A163,163,0,0,1,96,152,163,163,0,0,1,72,150.25Zm96-40.32V124c0,8.39-12.41,17.4-32,22.87V123.5C148.91,120.37,159.84,115.71,168,109.93ZM96,56c41.21,0,72,14.78,72,28s-30.79,28-72,28S24,97.22,24,84,54.79,56,96,56ZM24,124V109.93c8.16,5.78,19.09,10.44,32,13.57v23.37C36.41,141.4,24,132.39,24,124Zm64,48v-4.17c2.63.1,5.29.17,8,.17,3.88,0,7.67-.13,11.39-.35A121.92,121.92,0,0,0,120,171.41v23.46C100.41,189.4,88,180.39,88,172Zm48,26.25V174.4a179.48,179.48,0,0,0,24,1.6,183.74,183.74,0,0,0,24-1.54v23.79a165.45,165.45,0,0,1-48,0Zm64-3.38V171.5c12.91-3.13,23.84-7.79,32-13.57V172C232,180.39,219.59,189.4,200,194.87Z"></path></svg>
  `;

  const userthreeSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#000000" viewBox="0 0 256 256"><path d="M244.8,150.4a8,8,0,0,1-11.2-1.6A51.6,51.6,0,0,0,192,128a8,8,0,0,1-7.37-4.89,8,8,0,0,1,0-6.22A8,8,0,0,1,192,112a24,24,0,1,0-23.24-30,8,8,0,1,1-15.5-4A40,40,0,1,1,219,117.51a67.94,67.94,0,0,1,27.43,21.68A8,8,0,0,1,244.8,150.4ZM190.92,212a8,8,0,1,1-13.84,8,57,57,0,0,0-98.16,0,8,8,0,1,1-13.84-8,72.06,72.06,0,0,1,33.74-29.92,48,48,0,1,1,58.36,0A72.06,72.06,0,0,1,190.92,212ZM128,176a32,32,0,1,0-32-32A32,32,0,0,0,128,176ZM72,120a8,8,0,0,0-8-8A24,24,0,1,1,87.24,82a8,8,0,1,0,15.5-4A40,40,0,1,0,37,117.51,67.94,67.94,0,0,0,9.6,139.19a8,8,0,1,0,12.8,9.61A51.6,51.6,0,0,1,64,128,8,8,0,0,0,72,120Z"></path></svg>
  `;

  const starSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#000000" viewBox="0 0 256 256"><path d="M239.18,97.26A16.38,16.38,0,0,0,224.92,86l-59-4.76L143.14,26.15a16.36,16.36,0,0,0-30.27,0L90.11,81.23,31.08,86a16.46,16.46,0,0,0-9.37,28.86l45,38.83L53,211.75a16.38,16.38,0,0,0,24.5,17.82L128,198.49l50.53,31.08A16.4,16.4,0,0,0,203,211.75l-13.76-58.07,45-38.83A16.43,16.43,0,0,0,239.18,97.26Zm-15.34,5.47-48.7,42a8,8,0,0,0-2.56,7.91l14.88,62.8a.37.37,0,0,1-.17.48c-.18.14-.23.11-.38,0l-54.72-33.65a8,8,0,0,0-8.38,0L69.09,215.94c-.15.09-.19.12-.38,0a.37.37,0,0,1-.17-.48l14.88-62.8a8,8,0,0,0-2.56-7.91l-48.7-42c-.12-.1-.23-.19-.13-.5s.18-.27.33-.29l63.92-5.16A8,8,0,0,0,103,91.86l24.62-59.61c.08-.17.11-.25.35-.25s.27.08.35.25L153,91.86a8,8,0,0,0,6.75,4.92l63.92,5.16c.15,0,.24,0,.33.29S224,102.63,223.84,102.73Z"></path></svg>
  `;

  const mapSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#000000" viewBox="0 0 256 256"><path d="M200,224H150.54A266.56,266.56,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25a88,88,0,0,0-176,0c0,31.4,14.51,64.68,42,96.25A266.56,266.56,0,0,0,105.46,224H56a8,8,0,0,0,0,16H200a8,8,0,0,0,0-16ZM56,104a72,72,0,0,1,144,0c0,57.23-55.47,105-72,118C111.47,209,56,161.23,56,104Zm112,0a40,40,0,1,0-40,40A40,40,0,0,0,168,104Zm-64,0a24,24,0,1,1,24,24A24,24,0,0,1,104,104Z"></path></svg>
  `;

  return `
    <div class="modern-balloon">
      <div class="carousel-container">
        ${slideHtml}
        ${navHtml}
      </div>
      <div class="balloon-info">
        <b>${location.name}</b>
        <div class="address">${mapSvg}${location.address}</div>
        <div class="description">${location.description}</div>
        <div class="business-types">
          ${location.business_types_suitable
            .map(
              (type) =>
                `<span class="business-type">${
                  type === 'cafe' ? 'Кафе' : type === 'restaurant' ? 'Ресторан' : type === 'shop' ? 'Магазин' : type
                }</span>`
            )
            .join('')}
        </div>
        <div class="info-row">
          <div class="rating">Рейтинг: ${location.score}${starSvg}</div>
          <div class="score-badge">${location.score >= 0.9 ? 'Высокий рейтинг' : location.score >= 0.7 ? 'Хороший рейтинг' : 'Средний рейтинг'}</div>
        </div>
        <div class="info-row">
          <div class="traffic-score">Трафик: ${location.traffic_score}/10</div>
          <div class="competition-density">Конкуренция: ${location.competition_density}</div>
        </div>
        <div class="demographics">
          <span class="demographics-item">${humanSvg} ${location.demographics.age_group}</span>
          <span class="demographics-item">${moneySvg} ${incomeFormatted} ₽</span>
          <span class="demographics-item">${userthreeSvg} ${location.demographics.population_density} чел/км²</span>
        </div>
        <button 
          class="panorama-btn" 
          onclick="showPanorama(${location.coordinates.lat}, ${location.coordinates.lon}, '${location.name}', '${location.address}')"
          style="margin-top: 12px; width: 100%; padding: 8px; background: #1e40af; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; font-size: 14px;"
        >
          Посмотреть панораму
        </button>
      </div>
    </div>
  `;
}

// ========== ФУНКЦИЯ ИНИЦИАЛИЗАЦИИ КАРУСЕЛИ ==========
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
  }, 300);
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
// ========== ФИЛЬТРАЦИЯ МЕТОК ==========
function rebuildClusterer(filteredLocations) {
  if (!mapInstance) return;
  if (currentClusterer) {
    mapInstance.geoObjects.remove(currentClusterer);
  }
  if (!filteredLocations.length) {
    currentClusterer = null;
    return;
  }

  const placemarks = [];
  filteredLocations.forEach(location => {
    const markerInfo = preloadedMarkerData.get(location.id);
    if (!markerInfo) return;
    const coords = [location.coordinates.lat, location.coordinates.lon];
    const normalSize = [40, 40];
    const normalOffset = [-20, -40];
    const placemark = new ymaps.Placemark(
      coords,
      { hintContent: location.name, iconCaption: '' },
      {
        iconLayout: 'default#image',
        iconImageHref: markerInfo.originalUrl,
        iconImageSize: normalSize,
        iconImageOffset: normalOffset,
        openBalloonOnClick: false,
        hideIconOnBalloonOpen: false,
        balloonOffset: [-100, -27],
      }
    );
    placemark.userData = location;
    placemark._blueImage = markerInfo.blueUrl;

    placemark.events.add('mouseenter', () => {
      placemark.options.set({ iconImageHref: markerInfo.blueUrl });
      openBalloonWithDelay(placemark, location);
    });
    placemark.events.add('mouseleave', () => {
      placemark.options.set({ iconImageHref: markerInfo.originalUrl });
      if (openTimer) clearTimeout(openTimer);
      scheduleCloseBalloon(placemark);
    });
    placemarks.push(placemark);
  });

  const clusterer = new ymaps.Clusterer({
    gridSize: 100,
    preset: 'islands#blueClusterIcons',
    clusterDisableClickZoom: false,
    clusterOpenBalloonOnClick: false,
    minClusterSize: 2,
  });
  clusterer.add(placemarks);
  mapInstance.geoObjects.add(clusterer);
  currentClusterer = clusterer;

  // Обновить границы по отфильтрованным точкам
  if (filteredLocations.length > 0) {
    const coordsArray = filteredLocations.map(loc => [loc.coordinates.lat, loc.coordinates.lon]);
    const bounds = ymaps.util.bounds.fromPoints(coordsArray);
    mapInstance.setBounds(bounds, { checkZoomRange: true, zoomMargin: 50 });
  }
}

// ========== ПАНЕЛЬ ФИЛЬТРОВ ==========
function setupFilterPanel() {
  const container = document.createElement('div');
  container.className = 'filter-selector-container';

  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'filter-selector-toggle';
  toggleBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#000000" viewBox="0 0 256 256"><path d="M200,136a8,8,0,0,1-8,8H64a8,8,0,0,1,0-16H192A8,8,0,0,1,200,136Zm32-56H24a8,8,0,0,0,0,16H232a8,8,0,0,0,0-16Zm-80,96H104a8,8,0,0,0,0,16h48a8,8,0,0,0,0-16Z"></path></svg> Фильтры';
  toggleBtn.title = 'Фильтры';

  const panel = document.createElement('div');
  panel.className = 'filter-selector-panel';
  panel.style.display = 'none';

  // Элементы фильтров
  const citySelect = document.createElement('select');
  citySelect.className = 'filter-select';
  const typeSelect = document.createElement('select');
  typeSelect.className = 'filter-select';
  const ratingMinInput = document.createElement('input');
  ratingMinInput.type = 'number';
  ratingMinInput.placeholder = 'Рейтинг от';
  ratingMinInput.step = 0.1;
  ratingMinInput.min = 0;
  ratingMinInput.max = 1;
  ratingMinInput.value = 0;
  const ratingMaxInput = document.createElement('input');
  ratingMaxInput.type = 'number';
  ratingMaxInput.placeholder = 'Рейтинг до';
  ratingMaxInput.step = 0.1;
  ratingMaxInput.min = 0;
  ratingMaxInput.max = 1;
  ratingMaxInput.value = 1;

  const applyBtn = document.createElement('button');
  applyBtn.textContent = 'Применить';
  applyBtn.className = 'filter-apply-btn';
  const resetBtn = document.createElement('button');
  resetBtn.textContent = 'Сбросить';
  resetBtn.className = 'filter-reset-btn';

  const resultsCountSpan = document.createElement('span');
  resultsCountSpan.className = 'filter-results-count';

  // Заполнение селектов уникальными значениями
  const citiesSet = new Set();
  const typesSet = new Set();
  locationsData.locations.forEach(loc => {
    if (loc.city) citiesSet.add(loc.city);
    loc.business_types_suitable.forEach(t => typesSet.add(t));
  });
  const cities = Array.from(citiesSet).sort();
  const types = Array.from(typesSet).sort();

  citySelect.innerHTML = '<option value="">Все города</option>' + cities.map(c => `<option value="${c}">${c}</option>`).join('');
  typeSelect.innerHTML = '<option value="">Все типы</option>' + types.map(t => `<option value="${t}">${t === 'cafe' ? 'Кафе' : t === 'restaurant' ? 'Ресторан' : t === 'shop' ? 'Магазин' : t}</option>`).join('');

  function applyFilters() {
    const selectedCity = citySelect.value;
    const selectedType = typeSelect.value;
    const minRating = parseFloat(ratingMinInput.value);
    const maxRating = parseFloat(ratingMaxInput.value);

    const filtered = locationsData.locations.filter(loc => {
      if (selectedCity && loc.city !== selectedCity) return false;
      if (selectedType && !loc.business_types_suitable.includes(selectedType)) return false;
      const score = loc.score;
      if (score < minRating || score > maxRating) return false;
      return true;
    });

    resultsCountSpan.textContent = `Найдено: ${filtered.length}`;
    rebuildClusterer(filtered);
    panel.style.display = 'none';
  }

  function resetFilters() {
    citySelect.value = '';
    typeSelect.value = '';
    ratingMinInput.value = 0;
    ratingMaxInput.value = 1;
    applyFilters();
  }

  applyBtn.addEventListener('click', applyFilters);
  resetBtn.addEventListener('click', resetFilters);

  // Сборка панели
  const filterTitle = document.createElement('div');
  filterTitle.className = 'filter-title';
  filterTitle.textContent = 'Фильтры';
  panel.appendChild(filterTitle);
  panel.appendChild(citySelect);
  panel.appendChild(typeSelect);
  const ratingRow = document.createElement('div');
  ratingRow.className = 'rating-row';
  ratingRow.appendChild(ratingMinInput);
  ratingRow.appendChild(document.createTextNode(' — '));
  ratingRow.appendChild(ratingMaxInput);
  panel.appendChild(ratingRow);
  const btnRow = document.createElement('div');
  btnRow.className = 'filter-buttons';
  btnRow.appendChild(applyBtn);
  btnRow.appendChild(resetBtn);
  panel.appendChild(btnRow);
  panel.appendChild(resultsCountSpan);

  container.appendChild(toggleBtn);
  container.appendChild(panel);
  document.body.appendChild(container);

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isVisible = panel.style.display === 'flex';
    panel.style.display = isVisible ? 'none' : 'flex';
    if (!isVisible) {
      // обновим счётчик при открытии
      const selectedCity = citySelect.value;
      const selectedType = typeSelect.value;
      const minRating = parseFloat(ratingMinInput.value);
      const maxRating = parseFloat(ratingMaxInput.value);
      const count = locationsData.locations.filter(loc => {
        if (selectedCity && loc.city !== selectedCity) return false;
        if (selectedType && !loc.business_types_suitable.includes(selectedType)) return false;
        const score = loc.score;
        if (score < minRating || score > maxRating) return false;
        return true;
      }).length;
      resultsCountSpan.textContent = `Найдено: ${count}`;
    }
  });

  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      panel.style.display = 'none';
    }
  });
    // Сохраняем исходное вертикальное положение фильтра
  if (originalFilterTop === null) {
    const filterContainer = document.querySelector('.filter-selector-container');
    if (filterContainer) {
      const computedTop = parseInt(getComputedStyle(filterContainer).top);
      originalFilterTop = isNaN(computedTop) ? 160 : computedTop;
      filterContainer.style.top = originalFilterTop + 'px';
    }
  }
  resultsCountSpan.textContent = `Найдено: ${locationsData.locations.length}`;
}
// ========== МЕНЮ ВЫБОРА ГОРОДА С ПОИСКОМ ==========
function setupCitySelector(map) {
  // Контейнер меню
  const selectorContainer = document.createElement('div');
  selectorContainer.className = 'city-selector-container';

  // Кнопка-переключатель
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'city-selector-toggle';
  toggleBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#000000" viewBox="0 0 256 256"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,16a87.5,87.5,0,0,1,48,14.28V74L153.83,99.74,122.36,104l-.31-.22L102.38,90.92A16,16,0,0,0,79.87,95.1L58.93,126.4a16,16,0,0,0-2.7,8.81L56,171.44l-3.27,2.15A88,88,0,0,1,128,40ZM62.29,186.47l2.52-1.65A16,16,0,0,0,72,171.53l.21-36.23L93.17,104a3.62,3.62,0,0,0,.32.22l19.67,12.87a15.94,15.94,0,0,0,11.35,2.77L156,115.59a16,16,0,0,0,10-5.41l22.17-25.76A16,16,0,0,0,192,74V67.67A87.87,87.87,0,0,1,211.77,155l-16.14-14.76a16,16,0,0,0-16.93-3l-30.46,12.65a16.08,16.08,0,0,0-9.68,12.45l-2.39,16.19a16,16,0,0,0,11.77,17.81L169.4,202l2.36,2.37A87.88,87.88,0,0,1,62.29,186.47ZM185,195l-4.3-4.31a16,16,0,0,0-7.26-4.18L152,180.85l2.39-16.19L184.84,152,205,170.48A88.43,88.43,0,0,1,185,195Z"></path></svg> Города';
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
      if (typeof ymaps.suggest === 'function') {
        try {
          const suggestResult = await ymaps.suggest(query);
          if (Array.isArray(suggestResult)) {
            items = suggestResult.map(item => ({
              displayName: item.displayName || item.value,
              value: item.value
            }));
          }
        } catch (err) {
          console.warn('ymaps.suggest недоступен, используем геокодер', err);
        }
      }

      if (items.length === 0) {
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

    // Смещение фильтра
    const filterContainer = document.querySelector('.filter-selector-container');
    if (filterContainer) {
      if (!isVisible) {
        // Открываем панель города → сдвигаем фильтр вниз
        const panelHeight = panel.offsetHeight;
        let filterTop = parseInt(filterContainer.style.top);
        if (isNaN(filterTop)) filterTop = 160;
        if (originalFilterTop === null) originalFilterTop = filterTop;
        filterContainer.style.top = (filterTop + panelHeight + 10) + 'px';
      } else {
        // Закрываем панель города → возвращаем фильтр на место
        if (originalFilterTop !== null) {
          filterContainer.style.top = originalFilterTop + 'px';
        }
      }
    }

    if (!isVisible) {
      searchInput.focus();
      renderHistory();
      suggestionsContainer.style.display = 'none';
    }
  });

  // Закрытие при клике вне меню
  document.addEventListener('click', (e) => {
    if (!selectorContainer.contains(e.target)) {
      if (panel.style.display === 'flex') {
        panel.style.display = 'none';
        // Возвращаем фильтр на место
        const filterContainer = document.querySelector('.filter-selector-container');
        if (filterContainer && originalFilterTop !== null) {
          filterContainer.style.top = originalFilterTop + 'px';
        }
      }
    }
  });

  // Инициализация
  renderHistory();
}

// ========== ИНИЦИАЛИЗАЦИЯ КАРТЫ С КЛАСТЕРИЗАЦИЕЙ ==========
function initMap() {
  const firstLocation = locationsData.locations[0];
  const center = firstLocation ? [firstLocation.coordinates.lat, firstLocation.coordinates.lon] : [55.7558, 37.6173];

  const map = new ymaps.Map('map', {
    center: center,
    zoom: 12,
    controls: ['zoomControl', 'fullscreenControl'],
    balloonAutoPan: false,
  });
  mapInstance = map;
  window.map = map;

  // Сохраняем карту глобально для использования в других функциях
  window.map = map;

  // Создаем кластеризатор с увеличенным gridSize для более раннего слияния
  const clusterer = new ymaps.Clusterer({
    gridSize: 100,               // увеличенный размер сетки → кластеры появляются раньше
    preset: 'islands#blueClusterIcons',
    clusterDisableClickZoom: false,
    clusterOpenBalloonOnClick: false,
    minClusterSize: 2,
  });

  // Подготавливаем данные для маркеров: загружаем изображения и создаём синие версии
  const markerData = [];
  const loadPromises = locationsData.locations.map(location => {
    return new Promise((resolve) => {
      const originalUrl = (location.image && location.image.trim() !== '') ? location.image : DEFAULT_MARKER_IMAGE;
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          data[i] = data[i+2];
          data[i+2] = 150;
        }
        ctx.putImageData(imageData, 0, 0);
        const blueUrl = canvas.toDataURL();
        preloadedMarkerData.set(location.id, { originalUrl, blueUrl });
        resolve();
      };
      img.onerror = () => {
        console.warn('Не удалось загрузить иконку', originalUrl);
        preloadedMarkerData.set(location.id, { originalUrl, blueUrl: originalUrl });
        resolve();
      };
      img.src = originalUrl;
    });
  });

  Promise.all(loadPromises).then(() => {
    rebuildClusterer(locationsData.locations);
  });

  // После загрузки всех изображений создаём маркеры и добавляем в кластеризатор
  Promise.all(loadPromises).then(() => {
    const placemarks = [];

    markerData.forEach((data, index) => {
      const location = data.location;
      const originalImage = data.originalUrl;
      const blueImage = data.blueUrl;

      const coords = [location.coordinates.lat, location.coordinates.lon];
      const normalSize = [40, 40];
      const normalOffset = [-20, -40];

      const placemark = new ymaps.Placemark(
        coords,
        {
          hintContent: location.name,
          iconCaption: (index + 1).toString(),
        },
        {
          iconLayout: 'default#image',
          iconImageHref: originalImage,
          iconImageSize: normalSize,
          iconImageOffset: normalOffset,
          openBalloonOnClick: false,
          hideIconOnBalloonOpen: false,
          balloonOffset: [-100, -27],
        }
      );

      placemark.userData = location;
      placemark._blueImage = blueImage;

      placemark.events.add('mouseenter', () => {
        // Меняем иконку на синюю
        placemark.options.set({ iconImageHref: blueImage });
        openBalloonWithDelay(placemark, location);
      });

      placemark.events.add('mouseleave', () => {
        // Возвращаем оригинальную иконку
        placemark.options.set({ iconImageHref: originalImage });
        if (openTimer) {
          clearTimeout(openTimer);
          openTimer = null;
        }
        scheduleCloseBalloon(placemark);
      });

      placemarks.push(placemark);
    });

    // Добавляем все маркеры в кластеризатор
    clusterer.add(placemarks);
    // Добавляем кластеризатор на карту
    map.geoObjects.add(clusterer);
  });

  // Устанавливаем границы карты по всем точкам
  if (locationsData.locations.length > 1) {
    const allCoords = locationsData.locations.map((loc) => [loc.coordinates.lat, loc.coordinates.lon]);
    const bounds = ymaps.util.bounds.fromPoints(allCoords);
    map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 50 });
  }

  // ResizeObserver для корректного отображения карты при изменении размеров
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

  // Закрытие балуна при клике на карту
  map.events.add('click', () => {
    if (currentBalloonPlacemark && currentBalloonPlacemark.balloon.isOpen()) {
      currentBalloonPlacemark.balloon.close();
    }
  });

  // Очистка таймеров и обработчиков при закрытии балуна
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
  setupFilterPanel();
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