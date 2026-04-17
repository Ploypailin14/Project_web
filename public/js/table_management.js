document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('table-list-body');
    const addBtn = document.getElementById('add-table-btn');
    const saveEditBtn = document.getElementById('save-edit-btn');

    // 1. Load All Tables (API 15)
    async function loadTables() {
        try {
            const res = await fetch('/admin/tables');
            const data = await res.json();
            tableBody.innerHTML = data.map(t => `
                <tr class="hover:bg-gray-50 border-b">
                    <td>${t.table_id}</td>
                    <td class="font-bold text-lg">${t.table_number}</td>
                    <td>
                        <span class="badge ${t.status === 'available' ? 'badge-success' : 'badge-error'} text-white border-none">
                            ${t.status}
                        </span>
                    </td>
                    <td class="flex gap-2">
                        <button onclick="openEditModal(${t.table_id}, ${t.table_number}, '${t.status}')" class="btn btn-sm btn-info text-white">Edit</button>
                        <button onclick="deleteTable(${t.table_id})" class="btn btn-sm btn-error text-white">Delete</button>
                    </td>
                </tr>
            `).join('');
        } catch (err) {
            console.error("Fetch Error:", err);
        }
    }

    // 2. Add Table (API 16)
    addBtn.addEventListener('click', async () => {
        const table_number = document.getElementById('new-table-no').value;
        if (!table_number) return alert("Please enter a table number");

        const res = await fetch('/admin/table', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ table_number })
        });
        if (res.ok) {
            document.getElementById('new-table-no').value = '';
            loadTables();
        }
    });

    // 3. Open Edit Modal
    window.openEditModal = (id, num, status) => {
        document.getElementById('edit-id').value = id;
        document.getElementById('edit-number').value = num;
        document.getElementById('edit-status').value = status;
        document.getElementById('edit_table_modal').showModal();
    };

    // 4. Save Edit (API 16.1)
    saveEditBtn.addEventListener('click', async () => {
        const id = document.getElementById('edit-id').value;
        const table_number = document.getElementById('edit-number').value;
        const status = document.getElementById('edit-status').value;

        const res = await fetch(`/admin/table/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ table_number, status })
        });

        if (res.ok) {
            document.getElementById('edit_table_modal').close();
            loadTables();
        }
    });

    // 5. Delete Table (API 17)
    window.deleteTable = async (id) => {
        if (!confirm("Are you sure you want to delete this table?")) return;
        const res = await fetch(`/admin/table/${id}`, { method: 'DELETE' });
        if (res.ok) loadTables();
    };

    loadTables();
});