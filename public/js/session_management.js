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

                return `
                <tr class="hover:bg-gray-50 border-b transition-colors">
                    <td class="font-mono text-blue-600 font-bold text-lg">#${s.customer_id}</td>
                    <td>
                        <div class="badge badge-lg bg-orange-100 text-orange-700 font-black border-none px-4 py-3">
                            Table ${s.table_id}
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
                        <button onclick="openEditSession(${s.customer_id}, ${s.table_id}, '${s.status}')" 
                                class="btn btn-sm bg-zinc-800 hover:bg-black text-white border-none rounded-lg">
                            Edit / Move
                        </button>
                    </td>
                </tr>
            `}).join('');
        } catch (err) {
            console.error("Error loading sessions:", err);
            sessionBody.innerHTML = `<tr><td colspan="5" class="text-center text-red-500 font-bold py-8">ไม่สามารถโหลดข้อมูลได้ (เซิร์ฟเวอร์มีปัญหา)</td></tr>`;
        }
    }

    // 2. เปิด Modal พร้อมใส่ข้อมูลเดิม
    window.openEditSession = (custId, tableId, status) => {
        document.getElementById('edit-cust-id').value = custId;
        document.getElementById('edit-table-id').value = tableId;
        document.getElementById('edit-session-status').value = status || 'active';
        document.getElementById('edit_session_modal').showModal();
    };

    // 3. บันทึกการแก้ไข
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const custId = document.getElementById('edit-cust-id').value;
            const tableId = document.getElementById('edit-table-id').value;
            const status = document.getElementById('edit-session-status').value;

            try {
                const res = await fetch(`/admin/customer-session/${custId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        table_id: parseInt(tableId), 
                        status: status 
                    })
                });

                if (res.ok) {
                    document.getElementById('edit_session_modal').close();
                    loadSessions(); // โหลดข้อมูลใหม่หลังอัปเดต
                    
                    Swal.fire({
                        icon: 'success',
                        title: 'สำเร็จ!',
                        text: 'อัปเดตข้อมูลเซสชันเรียบร้อยแล้ว',
                        showConfirmButton: false,
                        timer: 1500
                    });
                } else {
                    const error = await res.json();
                    Swal.fire('ผิดพลาด', error.message || 'ไม่สามารถอัปเดตข้อมูลได้', 'error');
                }
            } catch (err) {
                Swal.fire('การเชื่อมต่อล้มเหลว', 'ไม่สามารถเชื่อมต่อ Server ได้', 'error');
            }
        });
    }

    // เรียกทำงานเมื่อเปิดหน้า
    loadSessions();
});