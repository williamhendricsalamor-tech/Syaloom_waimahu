// admin.js - Frontend logic for admin panel

document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('loginSection');
    const dashboardSection = document.getElementById('dashboardSection');
    const loginForm = document.getElementById('loginForm');
    const newsForm = document.getElementById('newsForm');
    const newsList = document.getElementById('newsList');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Alert elements
    const loginAlert = document.getElementById('loginAlert');
    const dashAlert = document.getElementById('dashAlert');

    function showLoginAlert(msg, type = 'error') {
        loginAlert.textContent = msg;
        loginAlert.className = `alert alert-${type}`;
        loginAlert.style.display = 'block';
        setTimeout(() => loginAlert.style.display = 'none', 3000);
    }

    function showDashAlert(msg, type = 'success') {
        dashAlert.textContent = msg;
        dashAlert.className = `alert alert-${type}`;
        dashAlert.style.display = 'block';
        setTimeout(() => dashAlert.style.display = 'none', 3000);
    }

    // Check Authentication
    async function checkAuth() {
        try {
            const res = await fetch('api/auth.php');
            const data = await res.json();
            if (res.ok && data.status === 'success') {
                loginSection.style.display = 'none';
                dashboardSection.style.display = 'block';
                loadNews();
            } else {
                loginSection.style.display = 'block';
                dashboardSection.style.display = 'none';
            }
        } catch (error) {
            loginSection.style.display = 'block';
            dashboardSection.style.display = 'none';
        }
    }

    // Handle Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        try {
            const res = await fetch('api/auth.php', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            
            if (data.status === 'success') {
                loginSection.style.display = 'none';
                dashboardSection.style.display = 'block';
                loadNews();
            } else {
                showLoginAlert(data.message);
            }
        } catch (error) {
            showLoginAlert('Terjadi kesalahan saat login.');
        }
    });

    // Handle Logout
    logoutBtn.addEventListener('click', async () => {
        try {
            await fetch('api/auth.php?action=logout');
            loginSection.style.display = 'block';
            dashboardSection.style.display = 'none';
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
        } catch (error) {
            console.error(error);
        }
    });

    // Load News
    async function loadNews() {
        try {
            const res = await fetch('api/berita.php');
            const data = await res.json();
            
            if (data.status === 'success') {
                newsList.innerHTML = '';
                if (data.data.length === 0) {
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
            }
        } catch (error) {
            newsList.innerHTML = '<p style="color:red;">Gagal memuat berita.</p>';
        }
    }

    // Handle Delete
    window.deleteNews = async function(id) {
        if (!confirm('Apakah Anda yakin ingin menghapus berita ini?')) return;

        try {
            const res = await fetch('api/berita.php', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            const data = await res.json();
            
            if (data.status === 'success') {
                showDashAlert('Berita berhasil dihapus.');
                loadNews();
            } else {
                showDashAlert(data.message, 'error');
            }
        } catch (error) {
            showDashAlert('Terjadi kesalahan saat menghapus.', 'error');
        }
    }

    // Handle Upload
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
        if (media) {
            formData.append('media', media);
        }

        try {
            const res = await fetch('api/berita.php', {
                method: 'POST',
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
        } catch (error) {
            showDashAlert('Terjadi kesalahan saat upload.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Upload Berita';
        }
    });

    // Initial check
    checkAuth();
});
