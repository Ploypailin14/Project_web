document.addEventListener('DOMContentLoaded', () => {
    loadToday(); // เปิดหน้ามาครั้งแรก ให้โหลดของ "วันนี้" เป็นค่าเริ่มต้น
});

// ฟังก์ชันดูยอด "All Time"
function loadAllTime() {
    document.getElementById('start-date').value = '';
    document.getElementById('end-date').value = '';
    document.getElementById('current-filter-title').innerText = '🌟 แสดงข้อมูล: All Time (ยอดรวมตั้งแต่เปิดร้าน)';
    
    loadDashboardStats('', '', 'all');
    loadTopMenus('', '', 'all');
}

// ฟังก์ชันดูยอด "วันนี้"
function loadToday() {
    document.getElementById('start-date').value = '';
    document.getElementById('end-date').value = '';
    document.getElementById('current-filter-title').innerText = '📅 แสดงข้อมูล: วันนี้ (Today)';
    
    loadDashboardStats('', '', 'today');
    loadTopMenus('', '', 'today');
}

// ฟังก์ชันกด "ค้นหา" แบบเลือกวันที่
function applyDateFilter() {
    const start = document.getElementById('start-date').value;
    const end = document.getElementById('end-date').value;

    if (!start || !end) {
        Swal.fire('แจ้งเตือน', 'กรุณาเลือกวันที่เริ่มต้นและสิ้นสุดให้ครบ', 'warning');
        return;
    }

    document.getElementById('current-filter-title').innerText = `🔍 แสดงข้อมูล: ${start} ถึง ${end}`;
    loadDashboardStats(start, end, 'custom');
    loadTopMenus(start, end, 'custom');
}

// โหลดตัวเลขสถิติ (อัปเดตรับพารามิเตอร์ filter)
async function loadDashboardStats(startDate = '', endDate = '', filter = 'today') {
    try {
        let url = `/admin/dashboard?filter=${filter}`;
        if (startDate && endDate) url += `&startDate=${startDate}&endDate=${endDate}`;

        const res = await fetch(url);
        const data = await res.json();

        document.getElementById('customer-count').innerText = data.customer_count || 0;
        document.getElementById('revenue-amount').innerText = (data.total_revenue || 0).toLocaleString() + ' ฿';
        document.getElementById('rating-score').innerText = parseFloat(data.avg_rating || 0).toFixed(1);
    } catch (error) {
        console.error("Error loading stats:", error);
    }
}

// โหลด Top 3 (อัปเดตรับพารามิเตอร์ filter)
async function loadTopMenus(startDate = '', endDate = '', filter = 'today') {
    try {
        let url = `/admin/top-menus?filter=${filter}`;
        if (startDate && endDate) url += `&startDate=${startDate}&endDate=${endDate}`;

        const res = await fetch(url);
        const menus = await res.json();
        const container = document.getElementById('top-menu-container');

        if (menus.length === 0) {
            container.innerHTML = '<div class="col-span-1 md:col-span-3 text-center text-gray-500 font-bold text-xl py-12 bg-white/90 rounded-3xl shadow-lg">ไม่มีข้อมูลการสั่งอาหารในช่วงเวลานี้ 🍽️</div>';
            return;
        }

        const badges = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500'];

        container.innerHTML = menus.map((menu, index) => {
            const validImageUrl = (menu.image && menu.image.trim() !== '') 
                ? menu.image 
                : 'https://placehold.co/400x300/ffedd5/ea580c?text=No+Image';

            return `
            <div class="bg-white rounded-2xl overflow-hidden shadow-2xl relative flex flex-col transform transition hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                <div class="absolute top-3 left-3 ${badges[index] || 'bg-gray-500'} text-white text-xs font-black px-3 py-1 rounded-full shadow-md z-10">
                    #${index + 1} Best Seller
                </div>
                <img src="${validImageUrl}" class="w-full h-48 object-cover border-b border-gray-100">
                <div class="text-center text-black font-black text-xl py-4 pb-1">${menu.name}</div>
                <div class="text-center text-orange-600 text-sm pb-5 font-bold bg-orange-50/50 mx-4 mb-4 rounded-xl pt-2">ยอดขาย ${menu.total_sold} จาน</div>
            </div>
            `;
        }).join('');

    } catch (error) {
        console.error("Error loading top menus:", error);
    }
}