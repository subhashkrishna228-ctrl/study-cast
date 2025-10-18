
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
            // Not a JSON error, throw the raw text.
            throw new Error(text);
        }
    });
});

const showCreateFormBtn = document.getElementById('show-create-form-btn');
const showSearchFormBtn = document.getElementById('show-search-form-btn');

const createCollegeContainer = document.getElementById('create-college-container');
const searchCollegeContainer = document.getElementById('search-college-container');

const collegeForm = document.getElementById('college-form');
const collegeName = document.getElementById('college-name');
const collegePassword = document.getElementById('college-password');

const searchForm = document.getElementById('search-form');
const searchName = document.getElementById('search-name');
const searchResults = document.getElementById('search-results');

showCreateFormBtn.addEventListener('click', () => {
    createCollegeContainer.style.display = 'block';
    searchCollegeContainer.style.display = 'none';
});

showSearchFormBtn.addEventListener('click', () => {
    createCollegeContainer.style.display = 'none';
    searchCollegeContainer.style.display = 'block';
});

collegeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = { 
        name: collegeName.value.trim(),
        password: collegePassword.value.trim()
    };
    if (!payload.name || !payload.password) return;

    try {
        const newCollege = await api('/api/colleges', { method: 'POST', body: JSON.stringify(payload) });
        collegeName.value = '';
        collegePassword.value = '';
        alert('College created successfully! Joining...');
        // Automatically join the college you just created
        joinCollege(newCollege.id, payload.password);
    } catch (error) {
        console.error('Create college error:', error);
        alert(`Failed to create college: ${error.message}`);
    }
});

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
            <button class="btn-primary join-college-btn" data-college-id="${c.id}">Join</button>
            <div class="join-password-container" data-college-id="${c.id}" style="display: none; margin-top: 10px;">
                <input type="password" class="college-join-password" placeholder="Enter password" required>
                <button class="btn-primary confirm-join-btn">Confirm Join</button>
            </div>
        </div>
    `).join('');
    searchResults.innerHTML = html;
}

searchResults.addEventListener('click', async (e) => {
    // Handle showing the password field
    if (e.target.classList.contains('join-college-btn')) {
        e.preventDefault();
        const collegeItem = e.target.closest('.college-item');
        
        // Hide all other open password forms and show their join buttons
        document.querySelectorAll('.join-password-container').forEach(container => {
            container.style.display = 'none';
        });
        document.querySelectorAll('.join-college-btn').forEach(btn => {
            btn.style.display = 'inline-block';
        });

        // Show the password form for the clicked college
        const passwordContainer = collegeItem.querySelector('.join-password-container');
        passwordContainer.style.display = 'block';
        e.target.style.display = 'none'; // Hide the 'Join' button
    }

    // Handle the join confirmation
    if (e.target.classList.contains('confirm-join-btn')) {
        e.preventDefault();
        const passwordContainer = e.target.closest('.join-password-container');
        const collegeId = passwordContainer.getAttribute('data-college-id');
        const passwordInput = passwordContainer.querySelector('.college-join-password');
        const password = passwordInput.value.trim();

        if (password) {
            joinCollege(collegeId, password);
        } else {
            alert('Password is required.');
        }
    }
});

async function joinCollege(collegeId, password) {
    try {
        const result = await api(`/api/colleges/${collegeId}/join`, { 
            method: 'POST',
            body: JSON.stringify({ password })
        });

        if (result.isAdmin) {
            localStorage.setItem(`college-admin-${collegeId}`, 'true');
        }

        // Redirect to the notes page for this college
        window.location.href = `/college/${collegeId}`;
    } catch (error) {
        console.error('Join college error:', error);
        alert(`Failed to join college: ${error.message}`);
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
