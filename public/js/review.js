document.addEventListener('DOMContentLoaded', () => {
    const backBtn = document.getElementById('back-btn');

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = '/admin/page/welcome'; 
        });
    }

    const reviewsContainer = document.getElementById('reviews-container');

    function getStars(rating) {
        const fullStar = '<span class="text-yellow-400">★</span>';
        const emptyStar = '<span class="text-gray-300">★</span>';
        return fullStar.repeat(rating) + emptyStar.repeat(5 - rating);
    }

    function renderReviews(reviews) {
        if (!reviewsContainer) return;
        reviewsContainer.innerHTML = ''; 
        
        if (reviews.length === 0) {
            reviewsContainer.innerHTML = '<p class="text-center text-gray-500 mt-10">ยังไม่มีรีวิวจากลูกค้าครับ</p>';
            return;
        }

        reviews.forEach(review => {
            const reviewCard = document.createElement('div');
            reviewCard.className = 'bg-gray-50 border border-gray-200 rounded-lg p-5 shadow-sm transition-shadow hover:shadow-md';
            
            // ใช้ชื่อ "Table X" แทนถ้าไม่มีชื่อลูกค้า
            const displayName = review.tableNo ? `Table ${review.tableNo}` : "Anonymous";
            const dateTxt = review.createdAt ? new Date(review.createdAt).toLocaleDateString('th-TH') : "ไม่ระบุวันที่";

            reviewCard.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-[#f39c12] text-white rounded-full flex items-center justify-center font-bold">
                            ${displayName.charAt(0)} 
                        </div>
                        <div>
                            <h3 class="text-lg font-bold text-black m-0">${displayName}</h3>
                            <div class="text-sm -mt-1">${getStars(review.rating)}</div>
                        </div>
                    </div>
                    <span class="text-xs text-gray-400 font-medium">${dateTxt}</span>
                </div>
                <p class="text-gray-700 text-sm mt-3 ml-13">${review.comment || 'ไม่มีข้อความ'}</p>
                <div class="mt-4 flex gap-2 justify-end">
                    <button class="btn btn-xs btn-outline border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white hover:border-blue-500">Reply</button>
                    <button class="btn btn-xs btn-outline border-red-500 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500">Hide</button>
                </div>
            `;
            reviewsContainer.appendChild(reviewCard);
        });
    }

    // 💡 ดึงข้อมูลรีวิวของจริงผ่าน API ตัวเดียวกับที่ Cook ใช้
    async function fetchRealReviews() {
        try {
            const res = await fetch('/api/get_reviews.php');
            const data = await res.json();
            if(data.success) {
                renderReviews(data.reviews);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
            reviewsContainer.innerHTML = '<p class="text-center text-red-500 mt-10">เกิดข้อผิดพลาดในการโหลดรีวิว</p>';
        }
    }

    fetchRealReviews();
});