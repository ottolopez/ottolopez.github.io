document.addEventListener('DOMContentLoaded', () => {
    const levels = document.querySelectorAll('.level');

    levels.forEach(level => {
        const title = level.querySelector('h2');
        title.addEventListener('click', () => {
            // Close all other levels
            levels.forEach(otherLevel => {
                if (otherLevel !== level) {
                    otherLevel.classList.remove('active');
                }
            });
            // Toggle the clicked level
            level.classList.toggle('active');
        });
    });

    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        if (body.classList.contains('dark-mode')) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.removeItem('theme');
        }
    });

    // Check for saved theme preference
    if (localStorage.getItem('theme') === 'dark') {
        body.classList.add('dark-mode');
    }

    // Select and display a random featured resource
    const resources = document.querySelectorAll('.resources a');
    const featuredResourceContent = document.getElementById('featured-resource-content');
    if (resources.length > 0) {
        const randomIndex = Math.floor(Math.random() * resources.length);
        const randomResource = resources[randomIndex].cloneNode(true);
        featuredResourceContent.appendChild(randomResource);
    }
});
