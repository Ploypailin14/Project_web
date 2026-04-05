document.addEventListener('DOMContentLoaded', () => {
    loadDashboardStats(); // โหลดตัวเลขสถิติด้านบน
    loadTopMenus();       // โหลดรูปภาพ 3 เมนูขายดี
});

// 1. ฟังก์ชันดึงตัวเลขสถิติ (ลูกค้า, รายได้, ดาว)
async function loadDashboardStats() {
    try {
        const res = await fetch('/admin/dashboard');
        const data = await res.json();

        // เอาตัวเลขไปหยอดใส่ใน HTML
        document.getElementById('customer-count').innerText = data.customer_count || 0;
        document.getElementById('revenue-amount').innerText = (data.today_revenue || 0).toLocaleString() + ' ฿';
        document.getElementById('rating-score').innerText = parseFloat(data.avg_rating || 0).toFixed(1);
    } catch (error) {
        console.error("Error loading stats:", error);
    }
}

// 2. ฟังก์ชันดึงรูป Top 3 เมนูขายดีมาแสดง
async function loadTopMenus() {
    try {
        const res = await fetch('/admin/top-menus');
        const menus = await res.json();
        const container = document.getElementById('top-menu-container');

        // ถ้ายังไม่มีใครสั่งอาหารเลย ให้ขึ้นข้อความนี้แทน
        if (menus.length === 0) {
            container.innerHTML = '<div class="col-span-1 md:col-span-3 text-center text-white font-bold text-xl py-8">ยังไม่มีข้อมูลการสั่งอาหารในระบบครับ</div>';
            return;
        }

        // สีของป้าย Best Seller (อันดับ 1 แดง, 2 ส้ม, 3 เหลือง)
        const badges = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500'];

        // วนลูปสร้างกล่องเมนูตามจำนวนที่ Database ส่งมาให้
        container.innerHTML = menus.map((menu, index) => {
            // เช็คว่าเมนูนี้มีรูปไหม ถ้าไม่มีให้ใช้รูปกล่องส้มๆ
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