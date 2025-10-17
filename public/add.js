const api = (path, opts = {}) => fetch(`${window.API_BASE}${path}`, {
  headers: { 'Content-Type': 'application/json' },
  ...opts
}).then(r => {
  if (!r.ok) throw new Error('Request failed');
  return r.json();
});

const sectionForm = document.getElementById('section-form');
const sectionName = document.getElementById('section-name');
const sectionDesc = document.getElementById('section-desc');
const sectionsList = document.getElementById('sections-list');
const sectionSelect = document.getElementById('section-select');

const linkForm = document.getElementById('link-form');
const linkTitle = document.getElementById('link-title');
const linkUrl = document.getElementById('link-url');
const linkNote = document.getElementById('link-note');

async function loadSections() {
  const sections = await api('/api/sections');
  renderSections(sections);
  renderSectionOptions(sections);
}

function renderSectionOptions(sections) {
  sectionSelect.innerHTML = '<option value="">Select a section</option>' +
    sections.map(s => `<option value="${s._id}">${escapeHtml(s.name)}</option>`).join('');
}

async function renderSections(sections) {
  const html = await Promise.all(sections.map(async (s) => {
    const links = await api(`/api/sections/${s._id}/links`);
    const linksHtml = links.map(l => `
      <div class="link-item">
        <a href="${escapeAttribute(l.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(l.title)}</a>
        ${l.note ? `<div class="link-note">${escapeHtml(l.note)}</div>` : ''}
        <div class="link-actions">
          <button class="btn-danger btn-small delete-link-btn" data-link-id="${l._id}">Delete Link</button>
        </div>
      </div>
    `).join('');
    return `
      <div class="section">
        <div class="section-title">
          <h3>${escapeHtml(s.name)}</h3>
          <div class="section-actions">
            <button class="btn-danger btn-small delete-section-btn" data-section-id="${s._id}">Delete Section</button>
          </div>
        </div>
        ${s.description ? `<div class="section-desc">${escapeHtml(s.description)}</div>` : ''}
        ${linksHtml || '<div class="empty-state">No links yet.</div>'}
      </div>
    `;
  }));
  sectionsList.innerHTML = html.join('');
}

sectionForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = { name: sectionName.value.trim(), description: sectionDesc.value.trim() };
  if (!payload.name) return;
  await api('/api/sections', { method: 'POST', body: JSON.stringify(payload) });
  sectionName.value = '';
  sectionDesc.value = '';
  await loadSections();
});

linkForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const sectionId = sectionSelect.value;
  if (!sectionId) return;
  const payload = { title: linkTitle.value.trim(), url: linkUrl.value.trim(), note: linkNote.value.trim() };
  if (!payload.title || !payload.url) return;
  await api(`/api/sections/${sectionId}/links`, { method: 'POST', body: JSON.stringify(payload) });
  linkTitle.value = '';
  linkUrl.value = '';
  linkNote.value = '';
  await loadSections();
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttribute(str) {
  return escapeHtml(str).replace(/"/g, '&quot;');
}

// Delete functions
async function deleteSection(sectionId) {
  console.log('Delete section called with ID:', sectionId);
  if (!confirm('Are you sure you want to delete this section and all its links? This action cannot be undone.')) {
    return;
  }
  
  try {
    console.log('Sending DELETE request to:', `/api/sections/${sectionId}`);
    const response = await api(`/api/sections/${sectionId}`, { method: 'DELETE' });
    console.log('Delete section response:', response);
    showSuccess('Section deleted successfully!');
    await loadSections();
  } catch (error) {
    console.error('Delete section error:', error);
    alert('Failed to delete section. Please try again.');
  }
}

async function deleteLink(linkId) {
  console.log('Delete link called with ID:', linkId);
  if (!confirm('Are you sure you want to delete this link? This action cannot be undone.')) {
    return;
  }
  
  try {
    console.log('Sending DELETE request to:', `/api/links/${linkId}`);
    const response = await api(`/api/links/${linkId}`, { method: 'DELETE' });
    console.log('Delete link response:', response);
    showSuccess('Link deleted successfully!');
    await loadSections();
  } catch (error) {
    console.error('Delete link error:', error);
    alert('Failed to delete link. Please try again.');
  }
}

function showSuccess(message) {
  const successDiv = document.createElement('div');
  successDiv.className = 'success-message';
  successDiv.textContent = message;
  document.body.insertBefore(successDiv, document.body.firstChild);
  
  setTimeout(() => {
    successDiv.remove();
  }, 3000);
}

// Event delegation for delete buttons
sectionsList.addEventListener('click', async (e) => {
  if (e.target.classList.contains('delete-section-btn')) {
    const sectionId = e.target.getAttribute('data-section-id');
    console.log('Delete section clicked:', sectionId);
    await deleteSection(sectionId);
  } else if (e.target.classList.contains('delete-link-btn')) {
    const linkId = e.target.getAttribute('data-link-id');
    console.log('Delete link clicked:', linkId);
    await deleteLink(linkId);
  }
});

loadSections().catch(() => {
  sectionsList.innerHTML = '<div class="empty-state">Failed to load sections. Is the server running?</div>';
});
