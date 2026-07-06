// pengumuman.js - Fetch and display news publicly (Vercel version)

document.addEventListener('DOMContentLoaded', async () => {
    const skeletonGrid = document.getElementById('skeletonGrid');
    const newsContainer = document.getElementById('newsContainer');

    try {
        const res = await fetch('/api/berita');
        const data = await res.json();

        // Hide skeleton, show real content
        skeletonGrid.style.display = 'none';
        newsContainer.style.display = 'grid';

        if (data.status === 'success') {
            if (!data.data || data.data.length === 0) {
                newsContainer.innerHTML = `
                    <div class="empty-state">
                        <i data-lucide="bell-off" class="empty-state-icon"></i>
                        <h3>Belum Ada Pengumuman</h3>
                        <p>Informasi terbaru akan muncul di sini.</p>
                    </div>
                `;
                if (typeof lucide !== 'undefined') lucide.createIcons();
                return;
            }

            data.data.forEach((item, index) => {
                const delay = (index % 3) * 100;
                const card = document.createElement('div');
                card.className = `news-card reveal delay-${delay}`;

                const dateStr = new Date(item.created_at).toLocaleDateString('id-ID', {
                    year: 'numeric', month: 'long', day: 'numeric'
                });

                let mediaHtml = '';
                if (item.media_url) {
                    if (item.media_type === 'image') {
                        mediaHtml = `
                            <div class="news-media-wrap">
                                <img src="${item.media_url}" alt="${item.title}" loading="lazy">
                            </div>`;
                    } else if (item.media_type === 'video') {
                        mediaHtml = `
                            <div class="news-media-wrap">
                                <video src="${item.media_url}" controls></video>
                            </div>`;
                    }
                } else {
                    mediaHtml = `
                        <div class="news-media-wrap">
                            <div class="news-placeholder">
                                <i data-lucide="megaphone" style="width:48px;height:48px;"></i>
                            </div>
                        </div>`;
                }

                card.innerHTML = `
                    ${mediaHtml}
                    <div class="news-content">
                        <span class="news-tag">Pengumuman</span>
                        <h3 class="news-title">${item.title}</h3>
                        <p class="news-body">${item.content.replace(/\n/g, '<br>')}</p>
                        <span class="news-date">
                            <i data-lucide="calendar" style="width:14px;height:14px;"></i>
                            ${dateStr}
                        </span>
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
            }, { threshold: 0.1 });
            revealElements.forEach(el => observer.observe(el));

        } else {
            throw new Error(data.message || 'Gagal memuat data.');
        }
    } catch (error) {
        skeletonGrid.style.display = 'none';
        newsContainer.style.display = 'grid';
        newsContainer.innerHTML = `
            <div class="empty-state">
                <i data-lucide="wifi-off" class="empty-state-icon"></i>
                <h3>Gagal Memuat</h3>
                <p>Tidak dapat memuat pengumuman. Silakan coba lagi nanti.</p>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
});
