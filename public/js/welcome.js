document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logout-btn');
    const adminNameDisplay = document.getElementById('admin-name');
    const adminRoleDisplay = document.getElementById('admin-role');

    // 💡 ดึงชื่อแอดมินที่ล็อกอินเข้ามาจาก LocalStorage
    const savedName = localStorage.getItem('adminUsername');
    if (adminNameDisplay && savedName) {
        adminNameDisplay.textContent = savedName.toUpperCase();
    }
    if (adminRoleDisplay) {
        adminRoleDisplay.textContent = "Head Restaurant Manager";
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            const confirmLogout = confirm('Are you sure you want to logout?');
            if (confirmLogout) {
                localStorage.removeItem('adminUsername');
                window.location.href = '/admin/page/login'; 
            }
        });
    }
    // ปุ่มอื่นๆ ไม่ต้องเขียน JS ดักแล้ว เพราะใน HTML ใส่ onclick="window.location.href='...'" ไว้แล้วครับ ทำงานได้เลย
});