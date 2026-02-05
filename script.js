document.addEventListener('DOMContentLoaded', function() {

    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    const galleryLinks = document.querySelectorAll('.gallery-item a, .gallery-link');
    
    if (galleryLinks.length > 0) {
        const overlay = document.createElement('div');
        overlay.className = 'lightbox-overlay';
        
        const img = document.createElement('img');
        img.className = 'lightbox-content';
        
        const closeBtn = document.createElement('div');
        closeBtn.className = 'lightbox-close';
        

        overlay.appendChild(img);
        overlay.appendChild(closeBtn);
        document.body.appendChild(overlay);

        const closeLightbox = () => {
            overlay.classList.remove('active');
            body.style.overflow = 'auto';
            setTimeout(() => { img.src = ''; }, 300);
        };
        galleryLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const imageSrc = this.getAttribute('href');
                img.src = imageSrc;
                overlay.classList.add('active');
                
            });
        });

        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                closeLightbox();
            }
        });

        closeBtn.addEventListener('click', closeLightbox);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeLightbox();
        });
    }

    const animateOnScroll = function() {
        const elements = document.querySelectorAll('.service-card, .gallery-item, .testimonial');
        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const screenPosition = window.innerHeight / 1.2;
            if (elementPosition < screenPosition) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        });
    };
    
    document.querySelectorAll('.service-card, .gallery-item, .testimonial').forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'all 0.6s ease';
    });
    
    window.addEventListener('scroll', animateOnScroll);
    animateOnScroll(); 
})
