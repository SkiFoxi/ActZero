// Проверка токена — редирект если не авторизован
/* const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '/index.html';
} */

async function loadUserData() {
    try {
        const response = await fetch('http://localhost:5076/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/index.html';
            return;
        }
        
        const user = await response.json();
        
        // Сайдбар
        const sidebarName = document.getElementById('sidebar-name');
        const sidebarEmail = document.getElementById('sidebar-email');
        if (sidebarName) sidebarName.textContent = user.name;
        if (sidebarEmail) sidebarEmail.textContent = user.email;

        // Приветствие вверху
        const subtitle = document.getElementById('page-subtitle');
        if (subtitle) subtitle.textContent = `Добро пожаловать, ${user.name} 👋`;

        // Профиль — заголовок
        const profileName = document.getElementById('profile-name');
        const profileEmail = document.getElementById('profile-email');
        if (profileName) profileName.textContent = user.name;
        if (profileEmail) profileEmail.textContent = user.email;

        // Профиль — поля ввода
        const inputName = document.getElementById('profile-input-name');
        const inputEmail = document.getElementById('profile-input-email');
        const inputPhone = document.getElementById('profile-input-phone');
        if (inputName) inputName.value = user.name;
        if (inputEmail) inputEmail.value = user.email;
        if (inputPhone) inputPhone.value = user.phone || '';

        // Баланс
        const balanceElements = document.querySelectorAll('.user-balance');
        balanceElements.forEach(el => {
            el.textContent = `${user.balance.toLocaleString('ru-RU')} ₽`;
        });

    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
}

window.logout = function() {
    localStorage.removeItem('token');
    window.location.href = '/index.html';
};

loadUserData();