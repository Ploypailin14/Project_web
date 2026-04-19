document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logout-btn');
    const adminNameDisplay = document.getElementById('admin-name');

    // 1. แสดงชื่อแอดมินจาก LocalStorage
    const savedName = localStorage.getItem('adminUsername');
    if (adminNameDisplay && savedName) {
        adminNameDisplay.textContent = savedName.toUpperCase();
    }

    // 2. ระบบ Logout แบบสวยงาม (แก้ปุ่มล่องหนแล้ว!)
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            Swal.fire({
                title: 'Confirm Logout?',
                text: "คุณต้องการออกจากระบบใช่หรือไม่?",
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Yes, Logout',
                cancelButtonText: 'Cancel',
                
                // 💡 ท่าไม้ตาย: บังคับสีปุ่มด้วย Tailwind ป้องกันอาการปุ่มล่องหน
                customClass: {
                    confirmButton: 'bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg mx-2 border-none',
                    cancelButton: 'bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg mx-2 border-none',
                    popup: 'rounded-[2rem]' // ขอบหน้าต่างมนๆ สวยๆ
                },
                buttonsStyling: false // ปิดสไตล์เดิมของ SweetAlert2 ทิ้งไปเลย
                
            }).then((result) => {
                if (result.isConfirmed) {
                    localStorage.removeItem('adminUsername');
                    window.location.href = '/admin/page/login'; 
                }
            });
        });
    }
});