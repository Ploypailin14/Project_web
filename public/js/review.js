document.addEventListener('DOMContentLoaded', () => {
    const reviewsContainer = document.getElementById('reviews-container');

    // 1. ฟังก์ชันสร้างดาว
    function getStars(rating) {
        const fullStar = '<span class="text-yellow-400 text-xl">★</span>';
        const emptyStar = '<span class="text-gray-300 text-xl">★</span>';
        return fullStar.repeat(rating) + emptyStar.repeat(Math.max(0, 5 - rating));
    }

    // 2. ฟังก์ชันเรนเดอร์รีวิว
    function renderReviews(reviews) {
        if (!reviewsContainer) return;
        reviewsContainer.innerHTML = ''; 
        
        if (reviews.length === 0) {
            reviewsContainer.innerHTML = '<div class="text-center text-gray-500 mt-10 font-bold">ยังไม่มีรีวิวจากลูกค้าในขณะนี้</div>';
            return;
        }

        reviews.forEach(review => {
            const reviewCard = document.createElement('div');
            // ถ้าถูกซ่อน (is_hidden = 1) ให้ทำสีจางลง
            const isHidden = review.is_hidden === 1;
            reviewCard.className = `border border-gray-200 rounded-xl p-5 shadow-sm transition-all ${isHidden ? 'bg-gray-200 opacity-60' : 'bg-gray-50'}`;
            
            const dateTxt = review.review_time ? new Date(review.review_time).toLocaleString('th-TH') : "ไม่ระบุวันที่";

            reviewCard.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center font-black text-xl shadow-inner">
                            ${(review.username || 'C').charAt(0).toUpperCase()} 
                        </div>
                        <div>
                            <h3 class="text-lg font-black text-gray-800 m-0">${review.username || 'Anonymous Customer'}</h3>
                            <div class="flex items-center gap-2">
                                ${getStars(review.rating)}
                            </div>
                        </div>
                    </div>
                    <span class="text-xs text-gray-400 font-bold">${dateTxt}</span>
                </div>
                <p class="text-gray-700 font-medium mt-3 ml-14 bg-white p-3 rounded-lg border border-gray-100 italic">
                    "${review.comment || 'ไม่มีข้อความความประทับใจ'}"
                </p>
                <div class="mt-4 flex gap-2 justify-end">
                    <button onclick="toggleHide(${review.review_id}, ${review.is_hidden})" class="btn btn-xs ${isHidden ? 'btn-success' : 'btn-warning'} text-white border-none px-4">
                        ${isHidden ? 'Show' : 'Hide'}
                    </button>
                    <button onclick="deleteReview(${review.review_id})" class="btn btn-xs bg-red-500 hover:bg-red-600 text-white border-none px-4">
                        Delete
                    </button>
                </div>
            `;
            reviewsContainer.appendChild(reviewCard);
        });
    }

    // 3. ดึงข้อมูลจาก API หลังบ้าน (Node.js)
    async function fetchReviews() {
        try {
            const res = await fetch('/admin/reviews');
            const data = await res.json();
            renderReviews(data);
        } catch (error) {
            console.error('Error fetching reviews:', error);
            reviewsContainer.innerHTML = '<p class="text-center text-red-500 mt-10 font-bold">ไม่สามารถเชื่อมต่อฐานข้อมูลได้</p>';
        }
    }

    // 4. ฟังก์ชันซ่อน/แสดงรีวิว
    window.toggleHide = async (id, currentStatus) => {
        try {
            const newStatus = currentStatus === 1 ? 0 : 1;
            const res = await fetch(`/admin/review/${id}/hide`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_hidden: newStatus })
            });
            if (res.ok) fetchReviews();
        } catch (err) { alert('Failed to update review status'); }
    };

    // 5. ฟังก์ชันลบรีวิวถาวร (แก้ไขปุ่มล่องหนและเปลี่ยนภาษา)
    window.deleteReview = (id) => {
        Swal.fire({
            title: 'ลบรีวิวนี้?',
            text: "ข้อมูลรีวิวจะถูกลบออกจากระบบถาวร",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ใช่, ลบเลย',
            cancelButtonText: 'ยกเลิก', // เปลี่ยนเป็น "ยกเลิก" เรียบร้อย
            // 💡 บังคับสีปุ่มเพื่อแก้ปัญหาปุ่มล่องหน
            customClass: {
                confirmButton: 'bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg mx-2',
                cancelButton: 'bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg mx-2'
            },
            buttonsStyling: false // ปิดสไตล์เดิมเพื่อใช้ Tailwind
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await fetch(`/admin/review/${id}`, { method: 'DELETE' });
                    if (res.ok) {
                        Swal.fire({
                            icon: 'success',
                            title: 'ลบสำเร็จ',
                            showConfirmButton: false,
                            timer: 1000
                        });
                        fetchReviews();
                    }
                } catch (err) {
                    console.error('Delete error:', err);
                }
            }
        });
    };

    fetchReviews();
});