
document.addEventListener('DOMContentLoaded', () => {
  const lightModeBtn = document.getElementById('light-mode-btn');
  const darkModeBtn = document.getElementById('dark-mode-btn');
  const body = document.body;

  const applyTheme = (theme) => {
    if (theme === 'dark') {
      body.classList.add('dark-mode');
      body.classList.remove('light-mode');
    } else {
      body.classList.add('light-mode');
      body.classList.remove('dark-mode');
    }
  };

  lightModeBtn.addEventListener('click', () => {
    localStorage.setItem('theme', 'light');
    applyTheme('light');
  });

  darkModeBtn.addEventListener('click', () => {
    localStorage.setItem('theme', 'dark');
    applyTheme('dark');
  });

  // Apply the saved theme on page load
  const savedTheme = localStorage.getItem('theme') || 'light'; // Default to light
  applyTheme(savedTheme);
});
