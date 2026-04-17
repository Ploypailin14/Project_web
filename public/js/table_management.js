document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('table-list-body');
    const addBtn = document.getElementById('add-table-btn');
    const saveEditBtn = document.getElementById('save-edit-btn');

    // 1. Load All Tables
    async function loadTables() {
        try {
            const res = await fetch('/admin/tables');
            const data = await res.json();

            if (data.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="4" class="text-center py-8 text-gray-500 font-bold">ไม่มีข้อมูลโต๊ะในระบบ</td></tr>`;
                return;
            }

            tableBody.innerHTML = data.map(t => `
                <tr class="hover:bg-gray-50 border-b transition-colors">
                    <td class="text-gray-500">${t.table_id}</td>
                    <td>
                        <div class="badge badge-lg bg-orange-100 text-orange-700 font-black border-none px-4 py-3">
                            Table ${t.table_number}
                        </div>
                    </td>
                    <td>
                        <span class="badge ${t.status === 'available' ? 'badge-success' : 'bg-red-500'} text-white border-none py-3 px-3 font-bold">
                            ${t.status.toUpperCase()}
                        </span>
                    </td>
                    <td class="flex gap-2">
                        <button onclick="openEditModal(${t.table_id}, ${t.table_number}, '${t.status}')" class="btn btn-sm bg-zinc-800 hover:bg-black text-white border-none">Edit</button>
                        <button onclick="deleteTable(${t.table_id})" class="btn btn-sm bg-red-100 hover:bg-red-200 text-red-600 border-none">Delete</button>
                    </td>
                </tr>
            `).join('');
        } catch (err) {
            console.error("Fetch Error:", err);
            tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-red-500 font-bold py-8">ไม่สามารถโหลดข้อมูลได้</td></tr>`;
        }
    }

    // 2. Add Table
    addBtn.addEventListener('click', async () => {
        const table_number = document.getElementById('new-table-no').value;
        
        if (!table_number) {
            Swal.fire('แจ้งเตือน', 'Please enter a table number', 'warning');
            return;
        }

        try {
            const res = await fetch('/admin/table', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ table_number })
            });

            if (res.ok) {
                Swal.fire({ icon: 'success', title: 'Success', text: 'เพิ่มโต๊ะสำเร็จ!', showConfirmButton: false, timer: 1000 });
                document.getElementById('new-table-no').value = '';
                loadTables();
            } else {
                const error = await res.json();
                Swal.fire('ผิดพลาด', error.message || 'ไม่สามารถเพิ่มโต๊ะได้', 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์', 'error');
        }
    });

    // 3. Open Edit Modal
    window.openEditModal = (id, num, status) => {
        document.getElementById('edit-id').value = id;
        document.getElementById('edit-number').value = num;
        document.getElementById('edit-status').value = status;
        document.getElementById('edit_table_modal').showModal();
    };

    // 4. Save Edit
    saveEditBtn.addEventListener('click', async () => {
        const id = document.getElementById('edit-id').value;
        const table_number = document.getElementById('edit-number').value;
        const status = document.getElementById('edit-status').value;

        try {
            const res = await fetch(`/admin/table/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ table_number, status })
            });

            if (res.ok) {
                document.getElementById('edit_table_modal').close();
                Swal.fire({ icon: 'success', title: 'Updated!', showConfirmButton: false, timer: 1000 });
                loadTables();
            } else {
                const error = await res.json();
                Swal.fire('ผิดพลาด', error.message || 'แก้ไขข้อมูลไม่ได้', 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์', 'error');
        }
    });

    // 5. Delete Table
    window.deleteTable = (id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "คุณต้องการลบโต๊ะนี้ใช่หรือไม่?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#9ca3af',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await fetch(`/admin/table/${id}`, { method: 'DELETE' });
                    if (res.ok) {
                        Swal.fire({ icon: 'success', title: 'Deleted!', showConfirmButton: false, timer: 1000 });
                        loadTables();
                    } else {
                        Swal.fire('Error', 'ลบข้อมูลไม่สำเร็จ', 'error');
                    }
                } catch (error) {
                    Swal.fire('Error', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์', 'error');
                }
            }
        });
    };

    loadTables();
});