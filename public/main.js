

let api;
let isAdmin = false;

function initializeApi() {
    api = (path, opts = {}) => fetch(`${window.API_BASE}${path}`, {
        headers: { 
            'Content-Type': 'application/json',
        },
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
}


const collegeId = window.COLLEGE_ID;
const collegeNameHeader = document.getElementById('college-name-header');
const userRoleBadge = document.getElementById('user-role-badge');

const showSectionFormBtn = document.getElementById('show-section-form-btn');
const sectionCreationCard = document.getElementById('section-creation-card');
const linkCreationCard = document.getElementById('link-creation-card');

const sectionForm = document.getElementById('section-form');
const sectionName = document.getElementById('section-name');
const sectionDesc = document.getElementById('section-desc');
const sectionsList = document.getElementById('sections-list');
const sectionSelect = document.getElementById('section-select');

const linkForm = document.getElementById('link-form');
const linkTitle = document.getElementById('link-title');
const linkUrl = document.getElementById('link-url');
const linkNote = document.getElementById('link-note');


async function init() {
    if (!collegeId) {
        window.location.href = '/college.html';
        return;
    }
    try {
        initializeApi();
        isAdmin = localStorage.getItem(`college-admin-${collegeId}`) === 'true';
        collegeNameHeader.textContent = `🚀 Drive Sections for College #${collegeId}`;
        if (isAdmin) {
            userRoleBadge.textContent = 'Admin';
            userRoleBadge.style.display = 'inline-block';
            showSectionFormBtn.style.display = 'block';
        }
        await loadSections();
        setupEventListeners();
    } catch (e) {
        console.error('Initialization error:', e);
        document.body.innerHTML = '<h1>Error loading college data</h1>';
    }
}

function setupEventListeners() {
    if (isAdmin) {
        showSectionFormBtn.addEventListener('click', () => {
            sectionCreationCard.style.display = sectionCreationCard.style.display === 'none' ? 'block' : 'none';
        });

        sectionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = { 
                name: sectionName.value.trim(), 
                description: sectionDesc.value.trim(),
            };
            if (!payload.name) return;
            try {
                await api(`/api/colleges/${collegeId}/sections`, { method: 'POST', body: JSON.stringify(payload) });
                sectionName.value = '';
                sectionDesc.value = '';
                showSuccess('Section created!');
                await loadSections();
                sectionCreationCard.style.display = 'none';
            } catch (error) {
                console.error('Create section error:', error);
                alert(`Failed to create section: ${error.message}`);
            }
        });

        linkForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const sectionId = sectionSelect.value;
            if (!sectionId) return;
            const payload = { 
                title: linkTitle.value.trim(), 
                url: linkUrl.value.trim(), 
                note: linkNote.value.trim() 
            };
            if (!payload.title || !payload.url) return;
            try {
                await api(`/api/sections/${sectionId}/links`, { method: 'POST', body: JSON.stringify(payload) });
                linkTitle.value = '';
                linkUrl.value = '';
                linkNote.value = '';
                sectionSelect.value = '';
                showSuccess('Link added!');
                await loadSections();
                linkCreationCard.style.display = 'none';
            } catch (error) {
                console.error('Add link error:', error);
                alert(`Failed to add link: ${error.message}`);
            }
        });

        sectionsList.addEventListener('click', async (e) => {
            if (e.target.classList.contains('delete-section-btn')) {
                const sectionId = e.target.getAttribute('data-section-id');
                await deleteSection(sectionId);
            } else if (e.target.classList.contains('delete-link-btn')) {
                const linkId = e.target.getAttribute('data-link-id');
                await deleteLink(linkId);
            } else if (e.target.classList.contains('add-link-btn')) {
                const sectionId = e.target.getAttribute('data-section-id');
                sectionSelect.value = sectionId;
                linkCreationCard.style.display = 'block';
                linkTitle.focus();
            }
        });
    }
}

async function loadSections() {
  try {
    const sections = await api(`/api/colleges/${collegeId}/sections`);
    renderSections(sections);
    if (isAdmin) {
        renderSectionOptions(sections);
    }
  } catch (error) {
    sectionsList.innerHTML = '<div class="empty-state">Could not load sections.</div>';
    console.error('Error loading sections:', error);
  }
}

function renderSectionOptions(sections) {
  if (!sections || sections.length === 0) {
    sectionSelect.innerHTML = '<option value="">No sections yet. Create one first!</option>';
    linkCreationCard.style.display = 'none';
    return;
  }
  linkCreationCard.style.display = 'block';
  sectionSelect.innerHTML = '<option value="">Select a section</option>' +
    sections.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('');
}

async function renderSections(sections) {
  if (!sections || sections.length === 0) {
    sectionsList.innerHTML = '<div class="empty-state">No sections yet. Add one above to get started!</div>';
    return;
  }
  const html = await Promise.all(sections.map(async (s) => {
    const links = await api(`/api/sections/${s.id}/links`);
    return renderSection(s, links);
  }));
  sectionsList.innerHTML = html.join('');
}

function renderSection(section, links) {
    const linksHtml = links && links.length > 0 ? links.map(l => `
      <div class="link-item">
        <a href="${escapeHtml(l.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(l.title)}</a>
        ${l.note ? `<div class="link-note">${escapeHtml(l.note)}</div>` : ''}
        ${isAdmin ? `<div class="link-actions"><button class="btn-danger btn-small delete-link-btn" data-link-id="${l.id}">Delete</button></div>` : ''}
      </div>
    `).join('') : '<div class="empty-state small">No links in this section yet.</div>';

    return `
      <div class="section" id="section-${section.id}">
        <div class="section-title">
          <h3>${escapeHtml(section.name)}</h3>
          ${isAdmin ? `
          <div class="section-title-actions">
            <button class="btn-primary btn-small add-link-btn" data-section-id="${section.id}">Add Link</button>
            <button class="btn-danger btn-small delete-section-btn" data-section-id="${section.id}">Delete Section</button>
          </div>
          ` : ''}
        </div>
        ${section.description ? `<div class="section-desc">${escapeHtml(section.description)}</div>` : ''}
        <div class="links-container">${linksHtml}</div>
      </div>
    `;
}

async function deleteSection(sectionId) {
    if (!isAdmin || !confirm('Are you sure you want to delete this section and all its links? This is irreversible.')) return;
    try {
        await api(`/api/sections/${sectionId}`, { method: 'DELETE' });
        showSuccess('Section deleted.');
        await loadSections();
    } catch (error) {
        console.error('Delete section error:', error);
        alert(`Failed to delete section: ${error.message}`);
    }
}

async function deleteLink(linkId) {
    if (!isAdmin || !confirm('Are you sure you want to delete this link?')) return;
    try {
        await api(`/api/links/${linkId}`, { method: 'DELETE' });
        showSuccess('Link deleted.');
        await loadSections();
    } catch (error) {
        console.error('Delete link error:', error);
        alert(`Failed to delete link: ${error.message}`);
    }
}

function showSuccess(message) {
    const el = document.createElement('div');
    el.className = 'toast-message';
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => {
        el.remove();
    }, 3000);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

init();
