// main.js
document.addEventListener('DOMContentLoaded', function() {
    
    // تأثيرات على الحقول
    const inputs = document.querySelectorAll('.input-group input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'scale(1.02)';
        });
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'scale(1)';
        });
    });
    
    // تأثيرات الأزرار
    const buttons = document.querySelectorAll('.btn-primary');
    buttons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            if (this.classList.contains('no-loading')) return;
            const originalText = this.innerHTML;
            this.innerHTML = '<span class="spinner"></span> جاري التحقق...';
            setTimeout(() => {
                this.innerHTML = originalText;
            }, 2000);
        });
    });
    
});