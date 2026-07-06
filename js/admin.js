// admin.js - Frontend logic for admin panel (Vercel version)

document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('loginSection');
    const dashboardSection = document.getElementById('dashboardSection');
    const loginForm = document.getElementById('loginForm');
    const newsForm = document.getElementById('newsForm');
    const newsList = document.getElementById('newsList');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginAlert = document.getElementById('loginAlert');
    const dashAlert = document.getElementById('dashAlert');

    function getToken() {
        return localStorage.getItem('admin_token');
    }

    function saveToken(token) {
        localStorage.setItem('admin_token', token);
    }

    function clearToken() {
        localStorage.removeItem('admin_token');
    }

    function showLoginAlert(msg, type = 'error') {
        loginAlert.textContent = msg;
        loginAlert.className = `alert alert-${type}`;
        loginAlert.style.display = 'block';
        setTimeout(() => loginAlert.style.display = 'none', 4000);
    }

    function showDashAlert(msg, type = 'success') {
        dashAlert.textContent = msg;
        dashAlert.className = `alert alert-${type}`;
        dashAlert.style.display = 'block';
        setTimeout(() => dashAlert.style.display = 'none', 4000);
    }

    function showDashboard() {
        loginSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        loadNews();
    }

    function showLogin() {
        loginSection.style.display = 'block';
        dashboardSection.style.display = 'none';
    }

    // Check Authentication on load
    async function checkAuth() {
        const token = getToken();
        if (!token) return showLogin();

        try {
            const res = await fetch('/api/auth', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                showDashboard();
            } else {
                clearToken();
                showLogin();
            }
        } catch {
            showLogin();
        }
    }

    // Handle Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (data.status === 'success') {
                saveToken(data.token);
                showDashboard();
            } else {
                showLoginAlert(data.message);
            }
        } catch {
            showLoginAlert('Terjadi kesalahan. Coba lagi.');
        }
    });

    // Handle Logout
    logoutBtn.addEventListener('click', () => {
        clearToken();
        showLogin();
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    });

    // Load News List for Admin
    async function loadNews() {
        newsList.innerHTML = '<p>Memuat berita...</p>';
        try {
            const res = await fetch('/api/berita');
            const data = await res.json();

            newsList.innerHTML = '';
            if (!data.data || data.data.length === 0) {
                newsList.innerHTML = '<p>Belum ada berita.</p>';
                return;
            }

            data.data.forEach(item => {
                const div = document.createElement('div');
                div.className = 'news-item';
                const dateStr = new Date(item.created_at).toLocaleDateString('id-ID', {
                    year: 'numeric', month: 'long', day: 'numeric'
                });
                div.innerHTML = `
                    <div class="news-item-details">
                        <h4>${item.title}</h4>
                        <p>${dateStr} ${item.media_type ? '• Ada ' + (item.media_type === 'image' ? 'Gambar' : 'Video') : ''}</p>
                    </div>
                    <button class="btn-danger" onclick="deleteNews(${item.id})">Hapus</button>
                `;
                newsList.appendChild(div);
            });
        } catch {
            newsList.innerHTML = '<p style="color:red;">Gagal memuat berita.</p>';
        }
    }

    // Handle Delete
    window.deleteNews = async function(id) {
        if (!confirm('Apakah Anda yakin ingin menghapus berita ini?')) return;
        try {
            const res = await fetch('/api/berita', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({ id })
            });
            const data = await res.json();
            if (data.status === 'success') {
                showDashAlert('Berita berhasil dihapus.');
                loadNews();
            } else {
                showDashAlert(data.message, 'error');
            }
        } catch {
            showDashAlert('Terjadi kesalahan saat menghapus.', 'error');
        }
    };

    // Handle Upload Berita
    newsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('title').value;
        const content = document.getElementById('content').value;
        const media = document.getElementById('media').files[0];

        const submitBtn = document.getElementById('submitNewsBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Mengupload...';

        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        if (media) formData.append('media', media);

        try {
            const res = await fetch('/api/berita', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${getToken()}` },
                body: formData
            });
            const data = await res.json();

            if (data.status === 'success') {
                showDashAlert('Berita berhasil ditambahkan!');
                newsForm.reset();
                loadNews();
            } else {
                showDashAlert(data.message, 'error');
            }
        } catch {
            showDashAlert('Terjadi kesalahan saat upload.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Upload Berita';
        }
    });

    checkAuth();
});
