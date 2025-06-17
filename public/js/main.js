// Main JavaScript file for Bloggy

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Auto-hide alerts after 5 seconds
    const alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
    alerts.forEach(alert => {
        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 5000);
    });

    // Confirm delete actions
    const deleteButtons = document.querySelectorAll('[data-confirm]');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const message = this.getAttribute('data-confirm') || 'Are you sure?';
            if (!confirm(message)) {
                e.preventDefault();
            }
        });
    });

    // Handle image preview on file input
    const imageInputs = document.querySelectorAll('input[type="file"][accept*="image"]');
    imageInputs.forEach(input => {
        input.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    // Find or create preview element
                    let preview = input.parentElement.querySelector('.image-preview');
                    if (!preview) {
                        preview = document.createElement('div');
                        preview.className = 'image-preview mt-2';
                        input.parentElement.appendChild(preview);
                    }
                    preview.innerHTML = `<img src="${e.target.result}" style="max-width: 200px; max-height: 200px;" class="img-thumbnail">`;
                };
                reader.readAsDataURL(file);
            }
        });
    });

    // Handle tag input
    const tagInputs = document.querySelectorAll('input[name="tags"], input[name="metaKeywords"]');
    tagInputs.forEach(input => {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const value = this.value.trim();
                if (value && !value.endsWith(',')) {
                    this.value = value + ', ';
                }
            }
        });
    });

    // Character counter for textareas with maxlength
    const textareas = document.querySelectorAll('textarea[maxlength]');
    textareas.forEach(textarea => {
        const maxLength = parseInt(textarea.getAttribute('maxlength'));
        const counter = document.createElement('div');
        counter.className = 'form-text text-end';
        textarea.parentElement.appendChild(counter);

        function updateCounter() {
            const remaining = maxLength - textarea.value.length;
            counter.textContent = `${remaining} characters remaining`;
            counter.classList.toggle('text-danger', remaining < 20);
        }

        textarea.addEventListener('input', updateCounter);
        updateCounter();
    });

    // Smooth scroll to anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Copy to clipboard functionality
    const copyButtons = document.querySelectorAll('[data-copy]');
    copyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const text = this.getAttribute('data-copy');
            navigator.clipboard.writeText(text).then(() => {
                const originalText = this.innerHTML;
                this.innerHTML = '<i class="bi bi-check"></i> Copied!';
                setTimeout(() => {
                    this.innerHTML = originalText;
                }, 2000);
            });
        });
    });

    // Search functionality enhancement
    const searchForm = document.querySelector('form[action="/search"]');
    if (searchForm) {
        const searchInput = searchForm.querySelector('input[name="q"]');
        
        // Add search suggestions (would need API endpoint)
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            const query = this.value.trim();
            
            if (query.length >= 2) {
                searchTimeout = setTimeout(() => {
                    // Implement search suggestions here
                    console.log('Search for:', query);
                }, 300);
            }
        });
    }

    // Lazy loading for images
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const image = entry.target;
                    image.src = image.dataset.src;
                    image.classList.remove('lazy');
                    imageObserver.unobserve(image);
                }
            });
        });

        const lazyImages = document.querySelectorAll('img.lazy');
        lazyImages.forEach(img => imageObserver.observe(img));
    }

    // Handle article version comparison (if needed)
    const versionSelect = document.querySelector('#versionSelect');
    if (versionSelect) {
        versionSelect.addEventListener('change', function() {
            const version = this.value;
            if (version) {
                // Load version content via API
                fetch(`/api/article/version/${version}`)
                    .then(res => res.json())
                    .then(data => {
                        // Update content display
                        console.log('Version data:', data);
                    });
            }
        });
    }
});

// Global error handler
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
});

// Handle back button for AJAX content
window.addEventListener('popstate', function(e) {
    if (e.state && e.state.page) {
        // Reload content based on state
        console.log('Navigate to:', e.state.page);
    }
});
