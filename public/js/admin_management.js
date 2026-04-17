// 1. โหลดรายชื่อแอดมินทั้งหมดมาแสดง
async function loadAdmins() {
    try {
        const res = await fetch('/admin/list');
        const admins = await res.json();
        const list = document.getElementById('admin-list');

        if (admins.length === 0) {
            list.innerHTML = '<div class="bg-white rounded-lg p-8 text-center text-gray-500 font-bold shadow-md">ยังไม่มีข้อมูลแอดมิน</div>';
            return;
        }

        // เช็กว่าแอดมินที่ล็อกอินอยู่คือใคร จะได้ไม่ให้เผลอกดลบตัวเอง
        const currentLoginUser = localStorage.getItem('adminUsername');

        list.innerHTML = admins.map(admin => {
            // ถ้าเป็นตัวเองที่ล็อกอินอยู่ จะซ่อนปุ่มลบ
            const deleteBtn = (admin.username === currentLoginUser) 
                ? `<span class="text-gray-400 font-bold text-sm bg-gray-100 px-4 py-2 rounded-lg">คุณ (ลบตัวเองไม่ได้)</span>`
                : `<button onclick="deleteAdmin('${admin.username}')" class="btn bg-red-100 hover:bg-red-200 text-red-600 border-none rounded-xl px-6">ลบสิทธิ์</button>`;

            return `
            <div class="bg-white rounded-lg p-5 flex items-center justify-between shadow-md transition hover:shadow-lg border-l-4 border-orange-500">
                <div class="flex items-center gap-5">
                    <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-2xl">👤</div>
                    <div>
                        <h3 class="text-xl font-black text-gray-800">${admin.username}</h3>
                        <p class="text-sm text-gray-500 font-bold">Role: ${admin.role || 'Admin'}</p>
                    </div>
                </div>
                ${deleteBtn}
            </div>
        `}).join('');

    } catch (error) {
        console.error("Error loading admins:", error);
    }
}

// 2. ฟังก์ชันเพิ่มแอดมินใหม่
async function addAdmin() {
    const username = document.getElementById('new-admin-username').value;
    const password = document.getElementById('new-admin-password').value;

    if (!username || !password) {
        Swal.fire('แจ้งเตือน', 'กรุณากรอก Username และ Password ให้ครบ', 'warning');
        return;
    }

    try {
        // ใช้ API /admin/register ที่เรามีอยู่แล้วใน app.js
        const res = await fetch('/admin/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (res.ok) {
            Swal.fire({
                icon: 'success',
                title: 'สำเร็จ!',
                text: `เพิ่มแอดมิน ${username} เรียบร้อย!`,
                showConfirmButton: false,
                timer: 1500
            });
            document.getElementById('new-admin-username').value = '';
            document.getElementById('new-admin-password').value = '';
            loadAdmins(); // โหลดข้อมูลใหม่มาแสดง
        } else {
            const data = await res.json();
            Swal.fire('ผิดพลาด', data.error || 'Username นี้อาจมีอยู่ในระบบแล้ว', 'error');
        }
    } catch (err) {
        Swal.fire('Error', 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้', 'error');
    }
}

// 3. ฟังก์ชันลบแอดมิน
function deleteAdmin(username) {
    Swal.fire({
        title: 'ยืนยันการลบ',
        text: `คุณต้องการลบสิทธิ์แอดมินของ ${username} ใช่หรือไม่?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'ใช่, ลบเลย',
        cancelButtonText: 'ยกเลิก',
        customClass: {
            confirmButton: 'btn bg-red-500 hover:bg-red-600 text-white border-none mx-2',
            cancelButton: 'btn btn-ghost mx-2'
        },
        buttonsStyling: false
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const res = await fetch(`/admin/${username}`, {
                    method: 'DELETE'
                });

                if (res.ok) {
                    Swal.fire({ icon: 'success', title: 'ลบสำเร็จ', showConfirmButton: false, timer: 1000 });
                    loadAdmins();
                } else {
                    Swal.fire('ผิดพลาด', 'ไม่สามารถลบแอดมินได้', 'error');
                }
            } catch (err) {
                Swal.fire('Error', 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้', 'error');
            }
        }
    });
}

// โหลดข้อมูลทันทีเมื่อเปิดหน้า
document.addEventListener('DOMContentLoaded', loadAdmins);