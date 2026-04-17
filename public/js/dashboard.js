document.addEventListener('DOMContentLoaded', () => {
    loadDashboardStats(); // โหลดตัวเลขสถิติด้านบน (ค่าเริ่มต้น)
    loadTopMenus();       // โหลดรูปภาพ 3 เมนูขายดี
});

// 1. ฟังก์ชันดึงตัวเลขสถิติ (รองรับการส่งวันที่ startDate, endDate)
async function loadDashboardStats(startDate = '', endDate = '') {
    try {
        let url = '/admin/dashboard';
        
        if (startDate && endDate) {
            url += `?startDate=${startDate}&endDate=${endDate}`;
        }

        const res = await fetch(url);
        const data = await res.json();

        document.getElementById('customer-count').innerText = data.customer_count || 0;
        document.getElementById('revenue-amount').innerText = (data.total_revenue || 0).toLocaleString() + ' ฿';
        document.getElementById('rating-score').innerText = parseFloat(data.avg_rating || 0).toFixed(1);
    } catch (error) {
        console.error("Error loading stats:", error);
    }
}

// 💡 ฟังก์ชันเวลากดปุ่ม "ค้นหา"
function applyDateFilter() {
    const start = document.getElementById('start-date').value;
    const end = document.getElementById('end-date').value;

    if (!start || !end) {
        alert('กรุณาเลือกวันที่ให้ครบทั้งสองช่องนะครับ!');
        return;
    }

    // โหลดข้อมูลใหม่ตามวันที่ๆ เลือก
    loadDashboardStats(start, end);
}

// 💡 ฟังก์ชันเวลากดปุ่ม "ล้างค่า"
function clearDateFilter() {
    document.getElementById('start-date').value = '';
    document.getElementById('end-date').value = '';
    
    // โหลดข้อมูลแบบปกติ (วันนี้)
    loadDashboardStats(); 
}

// 2. ฟังก์ชันดึงรูป Top 3 เมนูขายดีมาแสดง
async function loadTopMenus() {
    try {
        const res = await fetch('/admin/top-menus');
        const menus = await res.json();
        const container = document.getElementById('top-menu-container');

        if (menus.length === 0) {
            container.innerHTML = '<div class="col-span-1 md:col-span-3 text-center text-white font-bold text-xl py-8">ยังไม่มีข้อมูลการสั่งอาหารในระบบครับ</div>';
            return;
        }

        const badges = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500'];

        container.innerHTML = menus.map((menu, index) => {
            const validImageUrl = (menu.image && menu.image.trim() !== '') 
                ? menu.image 
                : 'https://placehold.co/400x300/ffedd5/ea580c?text=No+Image';

            return `
            <div class="bg-white rounded-2xl overflow-hidden shadow-2xl relative flex flex-col transform transition hover:scale-105">
                <div class="absolute top-3 left-3 ${badges[index] || 'bg-gray-500'} text-white text-xs font-black px-3 py-1 rounded-full shadow-md z-10">
                    #${index + 1} Best Seller
                </div>
                <img src="${validImageUrl}" class="w-full h-48 object-cover">
                <div class="text-center text-black font-bold text-xl py-4 pb-1">${menu.name}</div>
                <div class="text-center text-gray-500 text-sm pb-4 font-bold">ยอดขายทั้งหมด ${menu.total_sold} จาน</div>
            </div>
            `;
        }).join('');

    } catch (error) {
        console.error("Error loading top menus:", error);
    }
}