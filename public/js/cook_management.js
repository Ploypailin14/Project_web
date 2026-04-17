// โหลดรายชื่อ Cook จากฐานข้อมูล
async function loadCooks() {
    try {
        const res = await fetch('/admin/cooks');
        const cooks = await res.json();
        const list = document.getElementById('cook-list');

        if (cooks.length === 0) {
            list.innerHTML = '<div class="bg-white rounded-lg p-8 text-center text-gray-500 font-bold shadow-md">ยังไม่มีพ่อครัวในระบบ</div>';
            return;
        }

        list.innerHTML = cooks.map(cook => {
            const isActive = (cook.status === 'active');

            let statusBadge = '';
            if (isActive) {
                statusBadge = '<span class="badge badge-success text-white font-bold py-3">กำลังเข้ากะ (Active)</span>';
            } else {
                statusBadge = '<span class="badge badge-error text-white font-bold py-3">ไม่ได้เข้างาน (Inactive)</span>';
            }

            const btnText = isActive ? 'Disable (เลิกงาน)' : 'Active (เข้างาน)';
            const btnColor = isActive ? 'bg-pink-200 hover:bg-pink-300' : 'bg-green-200 hover:bg-green-300';
            const targetStatus = isActive ? 'inactive' : 'active';

            return `
            <div class="bg-white rounded-lg p-5 flex items-center justify-between shadow-md transition hover:shadow-lg">
                <div class="flex items-center gap-5">
                    <div class="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-3xl">👨‍🍳</div>
                    <div>
                        <h3 class="text-2xl font-black text-gray-800">ID: ${cook.cook_id}</h3>
                        <div class="mt-2">${statusBadge}</div>
                    </div>
                </div>
                <button onclick="toggleCookStatus('${cook.cook_id}', '${targetStatus}')" 
                    class="btn ${btnColor} border-none text-black rounded-xl px-6">
                    ${btnText}
                </button>
            </div>
        `}).join('');

    } catch (error) {
        console.error("Error loading cooks:", error);
    }
}

// แอดมินกดปุ่ม Gen Cook ID ทิ้งไว้ในระบบ
async function generateCook() {
    const cookId = document.getElementById('new-cook-id').value;

    if (!cookId) {
        Swal.fire({
            title: 'แจ้งเตือน',
            text: 'กรุณากรอก Cook ID',
            icon: 'warning',
            customClass: { confirmButton: 'btn bg-[#7066e0] hover:bg-[#5e54c9] text-white border-none px-6' },
            buttonsStyling: false
        });
        return;
    }

    try {
        const res = await fetch('/admin/cook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cook_id: cookId })
        });

        const data = await res.json();

        if (res.ok) {
            Swal.fire({
                title: 'สำเร็จ!',
                text: `สร้างไอดี ${cookId} เรียบร้อย!`,
                icon: 'success',
                customClass: { confirmButton: 'btn bg-green-500 hover:bg-green-600 text-white border-none px-6' },
                buttonsStyling: false
            });
            document.getElementById('new-cook-id').value = '';
            loadCooks();
        } else {
            Swal.fire({
                title: 'ผิดพลาด',
                text: data.error || 'ไม่สามารถสร้าง ID ได้',
                icon: 'error',
                customClass: { confirmButton: 'btn bg-red-500 hover:bg-red-600 text-white border-none px-6' },
                buttonsStyling: false
            });
        }
    } catch (err) {
        Swal.fire({
            title: 'Error',
            text: 'เซิร์ฟเวอร์มีปัญหา',
            icon: 'error',
            customClass: { confirmButton: 'btn bg-gray-500 text-white border-none px-6' },
            buttonsStyling: false
        });
    }
}

// กดปุ่มเปลี่ยนสถานะ Disable / Active
function toggleCookStatus(cookId, newStatus) {
    const actionText = newStatus === 'active' ? 'ให้พ่อครัวเข้าทำงาน' : 'ให้พ่อครัวเลิกงาน';
    const confirmBtnClass = newStatus === 'active'
        ? 'btn bg-green-500 hover:bg-green-600 text-white border-none mx-2'
        : 'btn bg-pink-500 hover:bg-pink-600 text-white border-none mx-2';

    Swal.fire({
        title: 'ยืนยัน',
        text: `ต้องการ${actionText} ใช่หรือไม่?`,
        icon: 'question',
        showCancelButton: true,
        customClass: {
            confirmButton: confirmBtnClass,
            cancelButton: 'btn btn-ghost mx-2'
        },
        buttonsStyling: false,
        confirmButtonText: 'ใช่, ตกลง',
        cancelButtonText: 'ยกเลิก'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const res = await fetch(`/admin/cook/${cookId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus })
                });

                if (res.ok) {
                    Swal.fire({
                        icon: 'success',
                        title: 'อัปเดตสถานะสำเร็จ',
                        showConfirmButton: false,
                        timer: 1000
                    });
                    loadCooks();
                } else {
                    const errorData = await res.json();
                    Swal.fire('ผิดพลาด', errorData.error || 'ไม่สามารถอัปเดตได้', 'error');
                }
            } catch (err) {
                console.error(err);
                Swal.fire('เชื่อมต่อล้มเหลว', 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้', 'error');
            }
        }
    });
}

// โหลดข้อมูลตอนเปิดหน้าเว็บครั้งแรก
document.addEventListener('DOMContentLoaded', () => {
    loadCooks();
});