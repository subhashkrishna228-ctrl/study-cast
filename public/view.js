const api = (path, opts = {}) => fetch(`${window.API_BASE}${path}`, {
  headers: { 'Content-Type': 'application/json' },
  ...opts
}).then(r => {
  if (!r.ok) throw new Error('Request failed');
  return r.json();
});

const sectionsList = document.getElementById('sections-list');

async function loadSections() {
  const sections = await api('/api/sections');
  renderSections(sections);
}

async function renderSections(sections) {
  const html = await Promise.all(sections.map(async (s) => {
    const links = await api(`/api/sections/${s._id}/links`);
    const linksHtml = links.map(l => `
      <div class="link-item">
        <a href="${escapeAttribute(l.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(l.title)}</a>
        ${l.note ? `<div class="link-note">${escapeHtml(l.note)}</div>` : ''}
      </div>
    `).join('');
    return `
      <div class="section">
        <div class="section-title">
          <h3>${escapeHtml(s.name)}</h3>
        </div>
        ${s.description ? `<div class="section-desc">${escapeHtml(s.description)}</div>` : ''}
        ${linksHtml || '<div class="empty-state">No links yet.</div>'}
      </div>
    `;
  }));
  sectionsList.innerHTML = html.join('');
}

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

loadSections().catch(() => {
  sectionsList.innerHTML = '<div class="empty-state">Failed to load sections. Is the server running?</div>';
});
