document.addEventListener('DOMContentLoaded', () => {
    loadOrderHistory();
});

async function loadOrderHistory() {
    const tbody = document.getElementById('history-body');
    try {
        const res = await fetch('/admin/orders');
        const data = await res.json();

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-gray-500 font-bold text-lg">ยังไม่มีประวัติการสั่งอาหาร</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(order => {
            // ทำสี Badge สถานะให้ดูง่ายๆ
            let statusBadge = 'bg-gray-200 text-gray-700';
            let statusText = (order.status || 'N/A').toUpperCase();
            
            if(statusText === 'PENDING') statusBadge = 'bg-red-100 text-red-600';
            if(statusText === 'COOKING') statusBadge = 'bg-yellow-100 text-yellow-600';
            if(statusText === 'SERVED') statusBadge = 'bg-blue-100 text-blue-600';
            if(statusText === 'COMPLETED' || statusText === 'CLOSED') statusBadge = 'bg-green-100 text-green-600';

            return `
            <tr class="hover:bg-gray-50 border-b transition-colors">
                <td class="font-black text-orange-600 text-lg">#${order.order_id}</td>
                <td class="font-bold text-gray-600">Cust #${order.customer_id}</td>
                <td class="text-sm font-bold text-gray-500">${new Date(order.order_time).toLocaleString('th-TH')}</td>
                <td class="max-w-xs text-sm font-medium text-gray-700">
                    ${order.items || '-'}
                </td>
                <td>
                    <span class="badge ${statusBadge} font-bold border-none px-3 py-3">
                        ${statusText}
                    </span>
                </td>
            </tr>
            `;
        }).join('');
    } catch (err) {
        console.error("Error loading history:", err);
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-red-500 font-bold py-8">ดึงข้อมูลไม่สำเร็จ (เซิร์ฟเวอร์มีปัญหา)</td></tr>`;
    }
}