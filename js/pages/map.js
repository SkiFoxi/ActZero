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
      "image": "/video/Ai_image.png",   // <-- добавлено // Изображение для метки
      "balloon_image": "/video/kaisa_1.png"  // Изображение для внутреннего описания метки
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
      "image": "/video/Ai_image.png",   // <-- добавлено // Изображение для метки
      "balloon_image": "/video/kaisa_1.png"  // Изображение для внутреннего описания метки
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

// ========== MAP INITIALIZATION ==========
function initMap() {
  const firstLocation = locationsData.locations[0];
  const center = firstLocation
    ? [firstLocation.coordinates.lat, firstLocation.coordinates.lon]
    : [55.7558, 37.6173];

  // Создаём карту
  const map = new ymaps.Map("map", {
    center: center,
    zoom: 12,
    controls: ["zoomControl", "fullscreenControl"]
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
  // Удаляем кластер метку если есть
  if (clusterMarker) {
    map.geoObjects.remove(clusterMarker);
    clusterMarker = null;
  }

  // Добавляем отдельные метки
  locationsData.locations.forEach((location, index) => {
    if (markers[index]) return; // Уже добавлена

    const coords = [location.coordinates.lat, location.coordinates.lon];

    const balloonContent = `
      <div style="max-width: 280px;">
        ${location.balloon_image ? `<img src="${location.balloon_image}" style="width:100%; max-height:120px; object-fit:cover; border-radius:8px; margin-bottom:8px;">` : ''}
        <b>${location.name}</b><br>
        <strong>Адрес:</strong> ${location.address}<br>
        <strong>Описание:</strong> ${location.description}<br>
        <strong>Подходит для:</strong> ${location.business_types_suitable.join(', ')}<br>
        <strong>Трафик:</strong> ${location.traffic_score}/10<br>
        <strong>Конкуренция:</strong> ${location.competition_density}<br>
        <strong>Возрастная группа:</strong> ${location.demographics.age_group}<br>
        <strong>Средний доход:</strong> ${location.demographics.average_income} ₽<br>
        <strong>Рейтинг:</strong> ${location.score}
      </div>
    `;

    // Путь к изображению: если указано, берём его, иначе дефолтное
    const image = location.image ? location.image : '/video/Ai_image.png';          // Изображение для метки 

    const placemark = new ymaps.Placemark(
      coords,
      {
        balloonContent: balloonContent,
        hintContent: location.name,
        iconCaption: (index + 1).toString()
      },
      {
        // Используем макет "изображение"
        iconLayout: 'default#image',
        iconImageHref: image,
        // Размер иконки (ширина, высота) – подберите под свои изображения
        iconImageSize: [40, 40],
        // Смещение, чтобы остриё иконки указывало на координату
        iconImageOffset: [-20, -40]
      }
    );

    map.geoObjects.add(placemark);
    markers[index] = placemark;
  });

  markersVisible = true;
}

  // Функция для показа кластер метки
  function showClusterMarker() {
    // Удаляем отдельные метки
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
        preset: "islands#blueCircleIcon"
      }
    );

    map.geoObjects.add(clusterMarker);
    markersVisible = false;
  }

  // Обработчик изменения зума
  map.events.add('boundschange', () => {
    const zoom = map.getZoom();

    if (zoom < 14 && markersVisible) {
      // Уменьшение зума - показываем кластер
      showClusterMarker();
    } else if (zoom >= 14 && !markersVisible) {
      // Увеличение зума - показываем отдельные метки
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
