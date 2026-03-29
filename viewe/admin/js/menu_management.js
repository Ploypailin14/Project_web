document.addEventListener('DOMContentLoaded', () => {
    const backBtn = document.getElementById('back-to-admin');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = 'dashboard.html'; 
        });
    }
});