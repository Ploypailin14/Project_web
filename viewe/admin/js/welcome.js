document.addEventListener('DOMContentLoaded', () => {

    // ดึง Elements ปุ่มต่างๆ มาจาก HTML
    const logoutBtn = document.getElementById('logout-btn');
    const menuManagementBtn = document.getElementById('menu-management-btn');
    const dashboardBtn = document.getElementById('dashboard-btn');
    const reviewBtn = document.getElementById('review-btn');
    
    // ดึงส่วนแสดงผลชื่อแอดมิน
    const adminNameDisplay = document.getElementById('admin-name');
    const adminRoleDisplay = document.getElementById('admin-role');

    // จำลองการดึงข้อมูลแอดมิน (สามารถปรับเปลี่ยนได้ตามระบบ Backend จริง)
    adminNameDisplay.textContent = "Chef Gordon";
    adminRoleDisplay.textContent = "Head Restaurant Manager";

    // ฟังก์ชันเมื่อกดปุ่ม Logout
    logoutBtn.addEventListener('click', () => {
        const confirmLogout = confirm('Are you sure you want to logout?');
        
        if (confirmLogout) {
            // เมื่อกดยืนยัน ให้พากลับไปหน้า Login
            window.location.href = 'login.html'; 
        }
    });

    // ฟังก์ชันเมื่อกดปุ่ม Menu Management
    menuManagementBtn.addEventListener('click', () => {
        // window.location.href = 'menu-management.html'; 
        alert('Navigating to Menu Management page...'); 
    });

    // ฟังก์ชันเมื่อกดปุ่ม Dashboard
    dashboardBtn.addEventListener('click', () => {
        // รีเฟรชหน้าปัจจุบัน
        window.location.reload(); 
    });

    // ฟังก์ชันเมื่อกดปุ่ม Review
    reviewBtn.addEventListener('click', () => {
        // window.location.href = 'review.html'; 
        alert('Navigating to Review page...');
    });

});