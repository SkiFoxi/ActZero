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

        // Определяем отображаемое имя — full_name если есть, иначе username
        const displayName = data.full_name || data.username;
        const displayInitials = displayName
            .split(' ')
            .map(w => w[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

        // Сайдбар — имя
        const sidebarName = document.getElementById('sidebar-name');
        if (sidebarName) sidebarName.textContent = displayName;

        // Сайдбар — email (username)
        const sidebarEmail = document.getElementById('sidebar-email');
        if (sidebarEmail) sidebarEmail.textContent = data.username;

        // Аватар — инициалы
        const sidebarAvatar = document.getElementById('sidebar-avatar');
        if (sidebarAvatar) sidebarAvatar.textContent = displayInitials;

        // Аватар в профиле
        const profileAvatar = document.getElementById('profile-avatar');
        if (profileAvatar) profileAvatar.textContent = displayInitials;

        // Профиль — имя и email
        const profileName = document.getElementById('profile-name');
        if (profileName) profileName.textContent = displayName;
        const profileEmail = document.getElementById('profile-email');
        if (profileEmail) profileEmail.textContent = data.username;

        // Приветствие в топбаре
        const subtitle = document.getElementById('page-subtitle');
        if (subtitle) {
            const firstName = displayName.split(' ')[0];
            subtitle.textContent = `Добро пожаловать, ${firstName} 👋`;
        }

        // Подписка
        if (data.subscription_plan) {
            const planEl = document.getElementById('subscription-plan');
            if (planEl) planEl.textContent = data.subscription_plan === 'pro' ? 'Pro' : 'Free';
        }

    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
}

window.logout = function() {
    localStorage.removeItem('token');
    window.location.href = '/index.html';
};

loadUserData();