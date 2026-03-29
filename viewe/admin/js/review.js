document.addEventListener('DOMContentLoaded', () => {

    // --- ระบบปุ่มย้อนกลับ (Back Navigation) ---
    const backBtn = document.getElementById('back-btn');

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            // พากลับไปหน้าหลักของ Admin
            window.location.href = 'dashboard.html'; 
        });
    }

    // --- ระบบดึงและแสดงผลข้อมูลรีวิว ---
    const reviewsContainer = document.getElementById('reviews-container');

    // จำลองข้อมูลรีวิวจาก Database (ในอนาคตใช้ fetch ดึงจาก Backend แทน)
    const mockReviews = [
        { 
            id: 1, 
            customerName: "Somsak Jaidee", 
            rating: 5, 
            date: "2024-03-30", 
            comment: "ผัดไทยอร่อยมากครับ เส้นเหนียวนุ่ม กุ้งตัวใหญ่สดมาก ไว้จะพาครอบครัวมากินอีกแน่นอน!" 
        },
        { 
            id: 2, 
            customerName: "Jane Smith", 
            rating: 4, 
            date: "2024-03-29", 
            comment: "อาหารรสชาติดีค่ะ แต่ช่วงเย็นคนเยอะ รอคิวแอบนานนิดนึง โดยรวมประทับใจค่ะ" 
        },
        { 
            id: 3, 
            customerName: "Gordon R.", 
            rating: 5, 
            date: "2024-03-28", 
            comment: "The best Thai Tea I've ever had in this town. Highly recommended!" 
        },
        { 
            id: 4, 
            customerName: "สมหมาย ขายเก่ง", 
            rating: 3, 
            date: "2024-03-25", 
            comment: "ข้าวผัดแฉะไปนิดนึงครับ แต่อย่างอื่นโอเค" 
        }
    ];

    // ฟังก์ชันสำหรับวาดดาวตามคะแนน
    function getStars(rating) {
        const fullStar = '<span class="text-yellow-400">★</span>';
        const emptyStar = '<span class="text-gray-300">★</span>';
        return fullStar.repeat(rating) + emptyStar.repeat(5 - rating);
    }

    // ฟังก์ชันสำหรับนำข้อมูลมาสร้างเป็นกล่องรีวิวบนหน้าเว็บ
    function renderReviews(reviews) {
        if (!reviewsContainer) return;
        
        reviewsContainer.innerHTML = ''; // ล้างข้อมูลเก่าก่อน
        
        reviews.forEach(review => {
            const reviewCard = document.createElement('div');
            // ตกแต่งกล่องรีวิวด้วย Tailwind CSS
            reviewCard.className = 'bg-gray-50 border border-gray-200 rounded-lg p-5 shadow-sm transition-shadow hover:shadow-md';
            
            reviewCard.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-bold">
                            ${review.customerName.charAt(0)} </div>
                        <div>
                            <h3 class="text-lg font-bold text-black m-0">${review.customerName}</h3>
                            <div class="text-sm -mt-1">${getStars(review.rating)}</div>
                        </div>
                    </div>
                    <span class="text-xs text-gray-400 font-medium">${review.date}</span>
                </div>
                <p class="text-gray-700 text-sm mt-3 ml-13">${review.comment}</p>
                <div class="mt-4 flex gap-2 justify-end">
                    <button class="btn btn-xs btn-outline border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white hover:border-blue-500">Reply</button>
                    <button class="btn btn-xs btn-outline border-red-500 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500">Hide</button>
                </div>
            `;
            reviewsContainer.appendChild(reviewCard);
        });
    }

    // สั่งให้ทำงานวาดรีวิวทันทีที่เปิดหน้า
    renderReviews(mockReviews);

});