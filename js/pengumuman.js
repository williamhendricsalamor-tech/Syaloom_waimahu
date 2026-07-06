// pengumuman.js - Logic to fetch and display news publicly

document.addEventListener('DOMContentLoaded', async () => {
    const newsContainer = document.getElementById('newsContainer');
    const loadingIndicator = document.getElementById('loadingIndicator');

    try {
        const res = await fetch('api/berita.php');
        const data = await res.json();
        
        loadingIndicator.style.display = 'none';

        if (data.status === 'success') {
            if (data.data.length === 0) {
                newsContainer.innerHTML = '<div class="no-news" style="grid-column: 1 / -1;">Belum ada berita atau pengumuman saat ini.</div>';
                return;
            }

            data.data.forEach((item, index) => {
                const card = document.createElement('div');
                card.className = `news-card reveal delay-${(index % 3) * 100}`;
                
                const dateStr = new Date(item.created_at).toLocaleDateString('id-ID', {
                    year: 'numeric', month: 'long', day: 'numeric'
                });

                let mediaHtml = '';
                if (item.media_path) {
                    if (item.media_type === 'image') {
                        mediaHtml = `<img src="${item.media_path}" alt="${item.title}" class="news-media">`;
                    } else if (item.media_type === 'video') {
                        mediaHtml = `<video src="${item.media_path}" controls class="news-media"></video>`;
                    }
                } else {
                    // Placeholder if no media
                    mediaHtml = `<div class="news-media" style="display:flex; align-items:center; justify-content:center; background:#e2e8f0; color:#94a3b8;"><i data-lucide="newspaper" style="width:48px;height:48px;"></i></div>`;
                }

                card.innerHTML = `
                    ${mediaHtml}
                    <div class="news-content">
                        <span class="news-date">${dateStr}</span>
                        <h3 class="news-title">${item.title}</h3>
                        <p class="news-body">${item.content.replace(/\n/g, '<br>')}</p>
                    </div>
                `;
                newsContainer.appendChild(card);
            });
            
            // re-initialize icons inside newly added HTML
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

            // re-initialize observer for reveal animations if necessary
            if (typeof observer !== 'undefined') {
                document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
            }
        } else {
            throw new Error('Gagal memuat data');
        }
    } catch (error) {
        loadingIndicator.style.display = 'none';
        newsContainer.innerHTML = '<div class="no-news" style="grid-column: 1 / -1; color: red;">Gagal memuat pengumuman. Silakan coba lagi nanti.</div>';
    }
});
