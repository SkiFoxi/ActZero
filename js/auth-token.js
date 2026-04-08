// Проверка токена — редирект если не авторизован
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '/index.html';
}

async function loadUserData() {
    try {
        const response = await fetch('http://localhost:8081/me', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/index.html';
            return;
        }

        const data = await response.json();

        // Сайдбар
        const sidebarName = document.getElementById('sidebar-name');
        const sidebarEmail = document.getElementById('sidebar-email');
        if (sidebarName) sidebarName.textContent = data.username;
        if (sidebarEmail) sidebarEmail.textContent = data.username;

        // Приветствие
        const subtitle = document.getElementById('page-subtitle');
        if (subtitle) subtitle.textContent = `Добро пожаловать, ${data.username} 👋`;

    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
}

window.logout = function() {
    localStorage.removeItem('token');
    window.location.href = '/index.html';
};

loadUserData();