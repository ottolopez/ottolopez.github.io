document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        if (body.classList.contains('dark-mode')) {
            localStorage.setItem('theme', 'dark');
            themeToggle.textContent = '☀️';
        } else {
            localStorage.setItem('theme', 'light');
            themeToggle.textContent = '🌙';
        }
    });

    // Check for saved theme preference
    if (localStorage.getItem('theme') === 'dark') {
        body.classList.add('dark-mode');
        themeToggle.textContent = '☀️';
    } else {
        body.classList.remove('dark-mode');
        themeToggle.textContent = '🌙';
    }

    // Accordion for resources page
    const levels = document.querySelectorAll('.level');
    levels.forEach(level => {
        const title = level.querySelector('.level-title');
        title.addEventListener('click', () => {
            level.classList.toggle('active');
        });
    });

    // Search functionality for resources page
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', () => {
            const filter = searchInput.value.toLowerCase();
            const resources = document.querySelectorAll('.level .resources li');
            resources.forEach(resource => {
                const text = resource.textContent.toLowerCase();
                if (text.includes(filter)) {
                    resource.style.display = '';
                } else {
                    resource.style.display = 'none';
                }
            });
        });
    }
});
