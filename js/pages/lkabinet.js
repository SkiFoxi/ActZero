const pages = {
    //dashboard: { title: 'Обзор', sub: 'Добро пожаловать, Иван 👋' },
    help: { title: 'Поддержка', sub: 'Помощь и контакты' },
};

function setPage(id) {
    document.querySelectorAll('[id^="page-"]').forEach(el => el.classList.add('hidden'));
    document.getElementById('page-' + id).classList.remove('hidden');
    document.getElementById('page-title').textContent = pages[id].title;
    document.getElementById('page-subtitle').textContent = pages[id].sub;
    document.querySelectorAll('.sidebar-link').forEach(link => link.classList.remove('active'));
    event.currentTarget.classList.add('active');
    closeSidebar();
}

function openSidebar() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('overlay').classList.add('open');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('open');
}