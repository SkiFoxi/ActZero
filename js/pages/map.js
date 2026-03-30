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
      "score": 0.95
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
      "score": 0.88
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

  // Перебираем локации и добавляем метки по одной
  locationsData.locations.forEach(location => {
    const coords = [location.coordinates.lat, location.coordinates.lon];

    // Формируем содержимое балуна
    const balloonContent = `
      <div style="max-width: 280px;">
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

    // Создаём метку
    const placemark = new ymaps.Placemark(
      coords,
      {
        balloonContent: balloonContent,
        hintContent: location.name,
        iconCaption: (locationsData.locations.indexOf(location) + 1).toString()
      },
      {
        preset: "islands#blueCircleIcon"
      }
    );

    // Добавляем метку на карту
    map.geoObjects.add(placemark);
  });

  // Если меток несколько, подгоняем карту так, чтобы показать все
  if (locationsData.locations.length > 1) {
    const bounds = map.geoObjects.getBounds();
    if (bounds) {
      map.setBounds(bounds, {
        checkZoomRange: true,
        zoomMargin: 50
      });
    }
  }

  // Обработка изменения размера окна
  const mapContainer = document.getElementById('map');
  const resizeObserver = new ResizeObserver(() => {
    if (locationsData.locations.length > 1) {
      const bounds = map.geoObjects.getBounds();
      if (bounds) {
        map.setBounds(bounds, {
          checkZoomRange: true,
          zoomMargin: 50
        });
      }
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
