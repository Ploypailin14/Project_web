document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logout-btn');
    const adminNameDisplay = document.getElementById('admin-name');

    // 1. แสดงชื่อแอดมินจาก LocalStorage
    const savedName = localStorage.getItem('adminUsername');
    if (adminNameDisplay && savedName) {
        adminNameDisplay.textContent = savedName.toUpperCase();
    }

    // 2. ระบบ Logout แบบสวยงาม
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            Swal.fire({
                title: 'Confirm Logout?',
                text: "คุณต้องการออกจากระบบใช่หรือไม่?",
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#9ca3af',
                confirmButtonText: 'Yes, Logout',
                cancelButtonText: 'Cancel'
            }).then((result) => {
                if (result.isConfirmed) {
                    localStorage.removeItem('adminUsername');
                    window.location.href = '/admin/page/login'; 
                }
            });
        });
    }
});