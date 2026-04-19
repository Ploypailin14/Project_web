document.addEventListener('DOMContentLoaded', () => {
    loadHistory(); 
});

// 💡 ฟังก์ชันค้นหา
window.applyDateFilter = async function() {
    await loadHistory();
}

// 💡 ฟังก์ชันล้างค่า
window.clearDateFilter = function() {
    const startInput = document.getElementById('start-date');
    const endInput = document.getElementById('end-date');
    if (startInput) startInput.value = '';
    if (endInput) endInput.value = '';
    loadHistory();
}

async function loadHistory() {
    const start = document.getElementById('start-date')?.value || '';
    const end = document.getElementById('end-date')?.value || '';
    
    // 💡 ท่าไม้ตาย: พยายามหา ID ทุกชื่อที่เป็นไปได้
    const tbody = document.getElementById('history-table-body') || 
                  document.getElementById('order-list-body') || 
                  document.querySelector('tbody');

    if (!tbody) {
        console.error("❌ ยังหาตารางไม่เจอ! Pleum เช็คใน HTML อีกทีว่าใส่ id='history-table-body' ใน <tbody> หรือยัง");
        return;
    }

    try {
        const res = await fetch(`/admin/order-history?startDate=${start}&endDate=${end}`);
        const data = await res.json();

        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-12 text-gray-400 font-bold">ไม่พบข้อมูลออเดอร์ในช่วงเวลานี้ 🍽️</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(order => {
    // 💡 ปรับแต่งการแสดงผลเพื่อไม่ให้ขึ้นคำว่า null
    const displayOrderId = order.order_id ? `#${order.order_id}` : '<span class="text-gray-300">-</span>';
    const displayItems = order.items ? order.items : '<span class="text-gray-400 italic">ยังไม่มีการสั่งอาหาร</span>';
    
    // ตั้งสี Badge ตามสถานะ
    let badgeClass = "bg-gray-100 text-gray-500"; // กรณี NO ORDER
    if (order.status === 'served') badgeClass = "bg-blue-100 text-blue-600";
    if (order.status === 'pending' || order.status === 'cooking') badgeClass = "bg-yellow-100 text-yellow-600";

    return `
        <tr class="hover:bg-gray-50 border-b transition-colors text-black font-medium">
            <td class="font-bold text-orange-600">${displayOrderId}</td>
            <td class="text-gray-500">Cust #${order.customer_id}</td>
            <td class="text-sm">${new Date(order.order_time).toLocaleString('en-GB').replace(',', '')}</td>
            <td class="max-w-xs truncate">${displayItems}</td>
            <td>
                <span class="badge ${badgeClass} border-none font-bold">
                    ${(order.status || 'NO ORDER').toUpperCase()}
                </span>
            </td>
            <td class="text-center">
                <button onclick="deleteOrder(${order.order_id})" class="btn btn-ghost btn-xs text-red-500 hover:bg-red-50 font-bold" 
                    ${!order.order_id ? 'disabled title="ไม่มีออเดอร์ให้ลบ"' : ''}>
                    ลบประวัติ
                </div>
            </td>
        </tr>`;
}).join('');
        
        console.log("✅ โหลดข้อมูลประวัติสำเร็จ!");

    } catch (err) {
        console.error("Error loading history:", err);
    }
}

// ฟังก์ชันลบออเดอร์
window.deleteOrder = function(id) {
    Swal.fire({
        title: 'ยืนยันการลบ?',
        text: "ข้อมูลออเดอร์นี้จะหายไปถาวร",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'ลบทิ้ง',
        cancelButtonText: 'ยกเลิก',
        customClass: {
            confirmButton: 'bg-red-500 text-white font-bold py-2 px-6 rounded-lg mx-2 border-none',
            cancelButton: 'bg-gray-400 text-white font-bold py-2 px-6 rounded-lg mx-2 border-none'
        },
        buttonsStyling: false
    }).then(async (result) => {
        if (result.isConfirmed) {
            const res = await fetch(`/admin/order/${id}`, { method: 'DELETE' });
            if (res.ok) {
                Swal.fire({ icon: 'success', title: 'ลบเรียบร้อย!', showConfirmButton: false, timer: 1000 });
                loadHistory(); 
            }
        }
    });
};