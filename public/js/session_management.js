document.addEventListener('DOMContentLoaded', () => {
    const sessionBody = document.getElementById('session-list-body');
    const saveBtn = document.getElementById('save-session-btn');

    // 1. โหลดรายการเซสชันทั้งหมด
    async function loadSessions() {
        try {
            const res = await fetch('/admin/customer-sessions'); 
            const data = await res.json();
            
            if (data.length === 0) {
                sessionBody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-gray-500 font-bold">ยังไม่มีลูกค้าเข้าใช้บริการในขณะนี้</td></tr>`;
                return;
            }

            sessionBody.innerHTML = data.map(s => {
                // 💡 แยกสี Badge ให้ชัดเจน 3 สถานะ
                let statusBadgeClass = 'bg-gray-500 text-white'; // ค่าเริ่มต้นสีเทา
                if (s.status === 'active') {
                    statusBadgeClass = 'badge-success text-white';
                } else if (s.status === 'pending_payment') {
                    statusBadgeClass = 'bg-red-500 text-white';
                } else if (s.status === 'closed') {
                    statusBadgeClass = 'bg-gray-400 text-white';
                }

                // 💡 สังเกตการจัดเรียงบรรทัดนี้ใหม่ให้ถูกต้อง
                return `
                <tr class="hover:bg-gray-50 border-b transition-colors">
                    <td class="font-mono text-blue-600 font-bold text-lg">#${s.customer_id}</td>
                    <td>
                        <div class="badge badge-lg bg-orange-100 text-orange-700 font-black border-none px-4 py-3">
                            Table ${s.table_number || s.table_id} 
                        </div>
                    </td>
                    <td class="text-sm text-gray-600 font-bold">
                        ${new Date(s.login_time).toLocaleString('th-TH')}
                    </td>
                    <td>
                        <span class="badge ${statusBadgeClass} border-none font-bold py-3 px-3">
                            ${(s.status || 'N/A').toUpperCase()}
                        </span>
                    </td>
                    <td class="text-center">
                        <button onclick="openEditSession(${s.customer_id}, ${s.table_number || s.table_id}, '${s.status}')" 
                                class="btn btn-sm bg-zinc-800 hover:bg-black text-white border-none rounded-lg">
                            Edit / Move
                        </button>
                    </td>
                </tr>`;
            }).join(''); // 💡 เอา join ไว้หลังวงเล็บ map
            
        } catch (err) {
            console.error("Error loading sessions:", err);
            sessionBody.innerHTML = `<tr><td colspan="5" class="text-center text-red-500 font-bold py-8">ไม่สามารถโหลดข้อมูลได้ (เซิร์ฟเวอร์มีปัญหา)</td></tr>`;
        }
    }

    // 2. เปิด Modal พร้อมใส่ข้อมูลเดิม
    window.openEditSession = (custId, tableNumber, status) => {
        document.getElementById('edit-cust-id').value = custId;
        document.getElementById('edit-table-id').value = tableNumber; // โชว์เบอร์โต๊ะ
        document.getElementById('edit-session-status').value = status || 'active';
        document.getElementById('edit_session_modal').showModal();
    };

    // 3. บันทึกการแก้ไข (พร้อมแก้ปุ่มล่องหน)
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const custId = document.getElementById('edit-cust-id').value;
            const tableNumber = document.getElementById('edit-table-id').value;
            const status = document.getElementById('edit-session-status').value;

            // เปลี่ยนข้อความปุ่มตอนกำลังโหลด
            const btn = document.getElementById('save-session-btn');
            const oldText = btn.innerText;
            btn.innerText = "กำลังบันทึก...";
            btn.disabled = true;

            try {
                const res = await fetch(`/admin/customer-session/${custId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        table_id: tableNumber, // ส่งเบอร์โต๊ะที่พิมพ์ไป
                        status: status 
                    })
                });

                const data = await res.json(); // รอรับ error message จากหลังบ้าน

                if (res.ok) {
                    document.getElementById('edit_session_modal').close();
                    loadSessions(); 
                    
                    // 💡 แจ้งเตือนสำเร็จ (ปุ่มสีเขียวชัดเจน)
                    Swal.fire({
                        title: 'สำเร็จ!',
                        text: 'อัปเดตข้อมูลลูกค้าและสถานะโต๊ะเรียบร้อย',
                        icon: 'success',
                        confirmButtonText: 'ตกลง',
                        customClass: { 
                            confirmButton: 'bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg border-none',
                            popup: 'rounded-[2rem]' 
                        },
                        buttonsStyling: false
                    });
                } else {
                    // 💡 แจ้งเตือนย้ายโต๊ะไม่ได้ (ปุ่มสีแดง)
                    Swal.fire({
                        title: 'ผิดพลาด',
                        text: data.error || 'ไม่สามารถอัปเดตข้อมูลได้',
                        icon: 'error',
                        confirmButtonText: 'รับทราบ',
                        customClass: { 
                            confirmButton: 'bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg border-none',
                            popup: 'rounded-[2rem]'
                        },
                        buttonsStyling: false
                    });
                }
            } catch (err) {
                Swal.fire({
                    title: 'ข้อผิดพลาด',
                    text: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้',
                    icon: 'error',
                    confirmButtonText: 'ตกลง',
                    customClass: { 
                        confirmButton: 'bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg border-none',
                        popup: 'rounded-[2rem]'
                    },
                    buttonsStyling: false
                });
            } finally {
                btn.innerText = oldText;
                btn.disabled = false;
            }
        });
    }

    // เรียกทำงานเมื่อเปิดหน้า
    loadSessions();
});