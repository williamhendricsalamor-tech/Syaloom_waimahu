// pengumuman.js - Fetch and display news publicly (Vercel version)

document.addEventListener('DOMContentLoaded', async () => {
    const newsContainer = document.getElementById('newsContainer');
    const loadingIndicator = document.getElementById('loadingIndicator');

    try {
        const res = await fetch('/api/berita');
        const data = await res.json();

        loadingIndicator.style.display = 'none';

        if (data.status === 'success') {
            if (!data.data || data.data.length === 0) {
                newsContainer.innerHTML = '<div class="no-news" style="grid-column: 1 / -1;">Belum ada berita atau pengumuman saat ini.</div>';
                return;
            }

            data.data.forEach((item, index) => {
                const card = document.createElement('div');
                const delay = (index % 3) * 100;
                card.className = `news-card reveal delay-${delay}`;

                const dateStr = new Date(item.created_at).toLocaleDateString('id-ID', {
                    year: 'numeric', month: 'long', day: 'numeric'
                });

                let mediaHtml = '';
                if (item.media_url) {
                    if (item.media_type === 'image') {
                        mediaHtml = `<img src="${item.media_url}" alt="${item.title}" class="news-media">`;
                    } else if (item.media_type === 'video') {
                        mediaHtml = `<video src="${item.media_url}" controls class="news-media"></video>`;
                    }
                } else {
                    mediaHtml = `<div class="news-media" style="display:flex;align-items:center;justify-content:center;background:#e2e8f0;color:#94a3b8;"><i data-lucide="newspaper" style="width:48px;height:48px;"></i></div>`;
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

            // Re-initialize icons and reveal animations
            if (typeof lucide !== 'undefined') lucide.createIcons();

            const revealElements = document.querySelectorAll('.reveal');
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('active');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.15 });
            revealElements.forEach(el => observer.observe(el));

        } else {
            throw new Error(data.message || 'Gagal memuat data.');
        }
    } catch (error) {
        loadingIndicator.style.display = 'none';
        newsContainer.innerHTML = '<div class="no-news" style="grid-column: 1 / -1; color: #ef4444;">Gagal memuat pengumuman. Silakan coba lagi nanti.</div>';
    }
});
