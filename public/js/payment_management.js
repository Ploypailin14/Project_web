document.addEventListener('DOMContentLoaded', () => {
    loadUnpaidBills();
});

async function loadUnpaidBills() {
    const tbody = document.getElementById('payment-body');
    try {
        const res = await fetch('/admin/unpaid-bills');
        const data = await res.json();

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-gray-500 font-bold text-lg">ไม่มีโต๊ะที่ค้างชำระเงินในขณะนี้</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(bill => {
            let statusBadge = bill.session_status === 'pending_payment' 
                ? '<span class="badge bg-red-100 text-red-600 font-bold border-none">รอชำระเงิน</span>'
                : '<span class="badge bg-green-100 text-green-600 font-bold border-none">กำลังทาน</span>';

            // 💡 ถ้ายอดถูกแก้ ให้โชว์ยอดใหม่ ถ้ายังไม่แก้โชว์ยอดคำนวณ
            let finalTotal = bill.custom_total !== null ? bill.custom_total : bill.calculated_total;
            
            let actionBtn = `<button onclick="editAmount(${bill.order_id}, ${finalTotal}, ${bill.table_number})" class="btn btn-sm bg-zinc-800 hover:bg-black text-white border-none rounded-lg shadow-sm">✏️ แก้ไขยอดเงิน</button>`;
            
            if (bill.calculated_total === 0) actionBtn = `<span class="text-gray-400 text-sm font-bold">ยังไม่ได้สั่งอาหาร</span>`;

            return `
            <tr class="hover:bg-gray-50 border-b transition-colors">
                <td><div class="badge badge-lg bg-orange-100 text-orange-700 font-black border-none px-4 py-3">Table ${bill.table_number}</div></td>
                <td class="font-bold text-gray-600">Cust #${bill.customer_id}</td>
                <td>${statusBadge}</td>
                <td class="text-right font-black text-orange-600 text-xl">${Number(finalTotal).toLocaleString()} ฿</td>
                <td class="text-center">${actionBtn}</td>
            </tr>
            `;
        }).join('');
    } catch (err) {
        console.error("Error loading bills:", err);
    }
}

window.editAmount = function(orderId, currentTotal, tableNo) {
    Swal.fire({
        title: `แก้ไขยอดเงิน - โต๊ะ ${tableNo}`,
        text: `แก้ไขเพื่อให้หน้าจอลูกค้าเห็นยอดใหม่ (ไม่ต้องเช็คบิล)`,
        input: 'number',
        inputValue: currentTotal,
        inputAttributes: { min: 0 },
        showCancelButton: true,
        confirmButtonText: 'บันทึกยอดใหม่',
        cancelButtonText: 'ยกเลิก',
        customClass: {
            confirmButton: 'bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg mx-2',
            cancelButton: 'bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg mx-2',
            popup: 'rounded-[2rem]'
        },
        buttonsStyling: false
    }).then(async (result) => {
        if (result.isConfirmed) {
            const newAmount = result.value;
            try {
                const res = await fetch(`/admin/order/${orderId}/custom-total`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ custom_total: newAmount })
                });

                if (res.ok) {
                    Swal.fire({ icon: 'success', title: 'อัปเดตยอดเรียบร้อย!', text: `ลูกค้าจะเห็นยอดใหม่เป็น ${newAmount} ฿ ทันที`, showConfirmButton: false, timer: 1500, customClass: { popup: 'rounded-[2rem]' }});
                    loadUnpaidBills(); 
                }
            } catch (err) {
                Swal.fire('การเชื่อมต่อล้มเหลว', 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้', 'error');
            }
        }
    });
};