const api = (path, opts = {}) => fetch(`${window.API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts
}).then(r => {
    if (r.ok) {
        return r.text().then(text => text ? JSON.parse(text) : {});
    }
    return r.text().then(text => {
        try {
            const err = JSON.parse(text);
            throw new Error(err.error || text);
        } catch (e) {
            throw new Error(text);
        }
    });
});

const searchForm = document.getElementById('search-form');
const searchName = document.getElementById('search-name');
const searchResults = document.getElementById('search-results');
const collegeNotesContainer = document.getElementById('college-notes-container');
const collegeNameHeader = document.getElementById('college-name-header');
const sectionsList = document.getElementById('sections-list');

searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = searchName.value.trim();
    if (!name) return;

    try {
        const colleges = await api(`/api/colleges?name=${name}`);
        renderSearchResults(colleges);
    } catch (error) {
        console.error('Search college error:', error);
        searchResults.innerHTML = '<div class="empty-state">Failed to search for colleges.</div>';
    }
});

function renderSearchResults(colleges) {
    if (!colleges || colleges.length === 0) {
        searchResults.innerHTML = '<div class="empty-state">No colleges found.</div>';
        return;
    }

    const html = colleges.map(c => `
        <div class="college-item">
            <h3>${escapeHtml(c.name)}</h3>
            <button class="btn-primary select-college-btn" data-college-id="${c.id}" data-college-name="${escapeHtml(c.name)}">View Notes</button>
        </div>
    `).join('');
    searchResults.innerHTML = html;
}

searchResults.addEventListener('click', async (e) => {
    if (e.target.classList.contains('select-college-btn')) {
        const collegeId = e.target.getAttribute('data-college-id');
        const collegeName = e.target.getAttribute('data-college-name');

        collegeNameHeader.textContent = `Notes for ${collegeName}`;
        collegeNotesContainer.style.display = 'block';
        searchResults.innerHTML = ''; 
        
        fetchAndRenderSections(collegeId);
    }
});

async function fetchAndRenderSections(collegeId) {
    try {
        const sections = await api(`/api/colleges/${collegeId}/sections`);
        renderSections(sections);
    } catch (error) {
        console.error('Error fetching sections:', error);
        sectionsList.innerHTML = '<div class="empty-state">Could not load sections for this college.</div>';
    }
}

function renderSections(sections) {
    if (sections.length === 0) {
        sectionsList.innerHTML = '<div class="empty-state">No sections yet.</div>';
        return;
    }

    const sectionsHtml = sections.map(s => `
        <div class="section">
            <div class="section-header">
                <h3>${escapeHtml(s.name)}</h3>
            </div>
            <div class="links-list" id="links-for-${s.id}"></div>
        </div>
    `).join('');
    sectionsList.innerHTML = sectionsHtml;

    sections.forEach(s => fetchAndRenderLinks(s.id));
}

async function fetchAndRenderLinks(sectionId) {
    try {
        const links = await api(`/api/sections/${sectionId}/links`);
        const linksList = document.getElementById(`links-for-${sectionId}`);
        
        if (links.length === 0) {
            linksList.innerHTML = '<div class="empty-state small">No links in this section.</div>';
            return;
        }

        const linksHtml = links.map(l => `
            <div class="link-item">
                <a href="${escapeHtml(l.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(l.title)}</a>
                ${l.note ? `<div class="link-note">${escapeHtml(l.note)}</div>` : ''}
            </div>
        `).join('');
        linksList.innerHTML = linksHtml;
    } catch (error) {
        console.error(`Error fetching links for section ${sectionId}:`, error);
        const linksList = document.getElementById(`links-for-${sectionId}`);
        if (linksList) {
            linksList.innerHTML = '<div class="empty-state small">Could not load links.</div>';
        }
    }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

window.API_BASE = window.location.origin;
