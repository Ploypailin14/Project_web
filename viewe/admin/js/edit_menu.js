document.addEventListener('DOMContentLoaded', () => {
    const saveBtn = document.getElementById('save-change-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            alert('Menu updated successfully!');
            window.location.href = 'menu_management.html';
        });
    }
});