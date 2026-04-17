document.addEventListener('DOMContentLoaded', () => {
    const backBtn = document.getElementById('back-to-admin');
    
    // 1. จัดการปุ่มถอยหลัง (แก้พาธให้ถูกต้อง)
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = '/admin/page/welcome'; 
        });
    }

    // 2. โหลดรายการเมนู
    loadAdminMenu();
});

// ฟังก์ชันโหลดเมนู (ย้ายมาจากหน้า HTML)
async function loadAdminMenu() {
    try {
        const res = await fetch('/admin/menus-list');
        const items = await res.json();
        const list = document.getElementById('admin-menu-list');

        if (items.length === 0) {
            list.innerHTML = '<div class="bg-white rounded-lg p-8 text-center text-gray-500 font-bold shadow-md">ยังไม่มีเมนูอาหารในระบบ กรุณากดปุ่ม Add new menu</div>';
            return;
        }

        list.innerHTML = items.map(item => {
            const validImageUrl = (item.image && item.image.trim() !== '')
                ? item.image
                : 'https://placehold.co/200x200/ffedd5/ea580c?text=No+Image';

            const isAvailable = (item.status === 'available');
            const btnText = isAvailable ? 'Disable' : 'Enable';
            const btnColor = isAvailable ? 'bg-pink-200 hover:bg-pink-300' : 'bg-green-200 hover:bg-green-300';
            const targetStatus = isAvailable ? 'unavailable' : 'available'; 
            const titleColor = isAvailable ? 'text-black' : 'text-gray-400';

            return `
            <div class="bg-white rounded-lg p-4 flex items-center shadow-md transition hover:shadow-lg">
                <img src="${validImageUrl}" class="w-24 h-24 object-cover rounded-md mr-6 border border-gray-100 ${!isAvailable ? 'opacity-50 grayscale' : ''}">
                <div class="flex-1">
                    <h3 class="text-2xl font-bold ${titleColor}">${item.name} ${!isAvailable ? '<span class="text-sm text-red-500">(ปิดการขาย)</span>' : ''}</h3>
                    <p class="text-xl text-gray-600">${item.price}B</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="toggleDisable(${item.menu_id}, '${targetStatus}')" class="btn btn-sm ${btnColor} border-none text-black rounded-full px-6 transition-all">${btnText}</button>
                    <button onclick="goToEdit(${item.menu_id})" class="btn btn-sm bg-sky-200 hover:bg-sky-300 border-none text-black rounded-full px-6">Edit</button>
                </div>
            </div>
        `}).join('');

    } catch (error) {
        console.error("Error loading admin menus:", error);
    }
}

// ฟังก์ชันเปลี่ยนสถานะ (Disable / Enable)
window.toggleDisable = function(menuId, newStatus) {
    const actionText = newStatus === 'unavailable' ? 'ปิดการขาย' : 'เปิดการขายกลับมา';
    const confirmBtnColor = newStatus === 'unavailable' ? 'bg-red-500' : 'bg-green-500';
    
    Swal.fire({
        title: 'ยืนยันการดำเนินการ',
        text: `คุณต้องการ${actionText}ใช่หรือไม่?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: `ใช่, ${actionText}`,
        cancelButtonText: 'ยกเลิก',
        customClass: {
            confirmButton: `${confirmBtnColor} text-white px-6 py-2 rounded-lg mx-2 font-bold`,
            cancelButton: 'bg-gray-400 text-white px-6 py-2 rounded-lg mx-2 font-bold'
        },
        buttonsStyling: false 
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch(`/admin/menu/status/${menuId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus })
                });

                if (response.ok) {
                    loadAdminMenu(); // รีโหลดข้อมูลใหม่
                    Swal.fire({ icon: 'success', title: 'สำเร็จ', showConfirmButton: false, timer: 1000 });
                } else {
                    Swal.fire('ผิดพลาด', 'อัปเดตสถานะไม่สำเร็จ', 'error');
                }
            } catch (error) {
                console.error("Toggle error:", error);
            }
        }
    });
};

// ฟังก์ชันส่งไปหน้าแก้ไข
window.goToEdit = function(menuId) {
    window.location.href = `/admin/page/edit-menu?id=${menuId}`;
}