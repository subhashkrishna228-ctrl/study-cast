
document.addEventListener('DOMContentLoaded', () => {
    const sectionsDisplay = document.getElementById('sections-display');
    const collegeNameTitle = document.getElementById('college-name-title');
    const searchForm = document.getElementById('search-form');
    const searchName = document.getElementById('search-name');
    const searchResults = document.getElementById('search-results');
    const sectionFilterContainer = document.getElementById('section-filter-container');
    const sectionSelect = document.getElementById('section-select');
    const passwordPromptContainer = document.getElementById('password-prompt-container');
    const passwordForm = document.getElementById('password-form');
    const collegeViewPassword = document.getElementById('college-view-password');
    const searchContainer = document.querySelector('.search-container');

    const urlParams = new URLSearchParams(window.location.search);
    const collegeId = urlParams.get('collegeId');

    if (collegeId) {
        searchContainer.style.display = 'none';
        passwordPromptContainer.style.display = 'block';
        loadCollegeName(collegeId);
    } else {
        searchContainer.style.display = 'block';
        sectionsDisplay.style.display = 'none';
        passwordPromptContainer.style.display = 'none';
    }

    async function loadCollegeName(collegeId) {
        try {
            const college = await api(`/api/colleges`, { id: collegeId });
            collegeNameTitle.textContent = college.name;
        } catch (error) {
            console.error('Error loading college name:', error);
            collegeNameTitle.textContent = 'College';
        }
    }

    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = collegeViewPassword.value.trim();
        if (!password) {
            alert('Password is required.');
            return;
        }

        try {
            await api(`/api/colleges/${collegeId}/view`, null, 'POST', { password });
            passwordPromptContainer.style.display = 'none';
            loadCollegeSections(collegeId);
        } catch (error) {
            console.error('Authentication error:', error);
            alert(`Authentication failed: ${error.message}`);
        }
    });

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = searchName.value.trim();
        if (!name) return;

        try {
            const colleges = await api(`/api/colleges`, { name });
            renderSearchResults(colleges);
        } catch (error) {
            console.error('Search error:', error);
            searchResults.innerHTML = '<div class="empty-state">Failed to search for colleges.</div>';
        }
    });

    function renderSearchResults(colleges) {
        if (!colleges || colleges.length === 0) {
            searchResults.innerHTML = '<div class="empty-state">No colleges found.</div>';
            return;
        }

        const html = colleges.map(c => `
            <a href="/view?collegeId=${c.id}" class="college-link">${escapeHtml(c.name)}</a>
        `).join('');
        searchResults.innerHTML = html;
    }

    async function loadCollegeSections(collegeId) {
        try {
            sectionsDisplay.style.display = 'block';
            sectionFilterContainer.style.display = 'block';

            const sections = await api(`/api/colleges/${collegeId}/sections`);
            renderSections(sections, sectionsDisplay);
            renderSectionDropdown(sections, sectionSelect);
        } catch (error) {
            console.error('Error loading college data:', error);
            sectionsDisplay.innerHTML = `<div class="empty-state">Failed to get data: ${error.message}</div>`;
            sectionFilterContainer.style.display = 'none';
        }
    }

    function renderSectionDropdown(sections, selectElement) {
        if (sections.length === 0) {
            selectElement.style.display = 'none';
            return;
        }

        selectElement.innerHTML = '<option value="all">All Sections</option>'; // Reset and add default

        sections.forEach(section => {
            const option = document.createElement('option');
            option.value = section.id;
            option.textContent = section.name;
            selectElement.appendChild(option);
        });

        selectElement.addEventListener('change', (e) => {
            const selectedSectionId = e.target.value;
            const sectionCards = sectionsDisplay.querySelectorAll('.section-card');
            
            sectionCards.forEach(card => {
                if (selectedSectionId === 'all' || card.dataset.sectionId === selectedSectionId) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }

    function renderSections(sections, container) {
        if (sections.length === 0) {
            container.innerHTML = '<div class="empty-state">No sections here yet.</div>';
            return;
        }

        const sectionsHtml = sections.map(section => `
            <div class="section-card" data-section-id="${section.id}">
                <h3>${escapeHtml(section.name)}</h3>
                <p>${escapeHtml(section.description)}</p>
                <div class="links-container" id="links-for-${section.id}"></div>
            </div>
        `).join('');

        container.innerHTML = sectionsHtml;

        sections.forEach(section => {
            loadLinks(section.id);
        });
    }

    async function loadLinks(sectionId) {
        const linksContainer = document.getElementById(`links-for-${sectionId}`);
        try {
            const links = await api(`/api/sections/${sectionId}/links`);
            if (links.length > 0) {
                linksContainer.innerHTML = links.map(link => `
                    <div class="link-item">
                        <a href="${escapeHtml(link.url)}" target="_blank">${escapeHtml(link.title)}</a>
                        ${link.note ? `<p class="link-note">${escapeHtml(link.note)}</p>` : ''}
                    </div>
                `).join('');
            } else {
                linksContainer.innerHTML = '<p class="no-links">No links in this section yet.</p>';
            }
        } catch (error) {
            console.error(`Error loading links for section ${sectionId}:`, error);
            linksContainer.innerHTML = '<p class="no-links">Could not load links.</p>';
        }
    }

    function escapeHtml(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    async function api(path, query = null, method = 'GET', body = null) {
        const url = new URL(`${window.API_BASE}${path}`);
        if (query) {
            Object.keys(query).forEach(key => url.searchParams.append(key, query[key]));
        }

        const options = { method, headers: { 'Content-Type': 'application/json' } };
        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);
        if (!response.ok) {
            const errorBody = await response.text();
            let errorMessage;
            try {
                errorMessage = JSON.parse(errorBody).error || 'An unknown error occurred.';
            } catch (e) {
                errorMessage = errorBody || 'An unknown error occurred.';
            }
            throw new Error(errorMessage);
        }

        const text = await response.text();
        return text ? JSON.parse(text) : {};
    }
});
