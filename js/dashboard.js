// dashboard.js - التبويبات والرسم البياني
document.addEventListener('DOMContentLoaded', function() {
    // التبديل بين التبويبات
    const navItems = document.querySelectorAll('.nav-item');
    const tabs = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const tabId = this.dataset.tab;
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            tabs.forEach(tab => tab.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
        });
    });

    // رسم بياني للتجارب (Chart.js)
    const ctx = document.getElementById('expChart')?.getContext('2d');
    if (ctx) {
        // البيانات تأتي من PHP مضمنة
        const labels = <?php echo json_encode($exp_names); ?>;
        const data = <?php echo json_encode($chart_data); ?>;
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'عدد الدخول (آخر 7 أيام)',
                    data: data,
                    backgroundColor: 'rgba(0,137,174,0.3)',
                    borderColor: '#0089ae',
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'top' }
                }
            }
        });
    }
});