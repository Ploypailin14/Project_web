document.addEventListener('DOMContentLoaded', () => {
    loadReviews();
});

async function loadReviews() {
    const container = document.getElementById('reviews-container');
    try {
        const res = await fetch('/admin/reviews');
        const data = await res.json();

        if (data.length === 0) {
            container.innerHTML = `<p class="text-center text-gray-500 font-bold mt-10">ยังไม่มีรีวิวจากลูกค้า</p>`;
            return;
        }

        container.innerHTML = data.map(review => {
            const dateStr = new Date(review.review_time).toLocaleString('th-TH');
            
            // จัดการแสดงผลดาว (สีเหลือง/สีเทา)
            let stars = '';
            for(let i = 1; i <= 5; i++) {
                stars += `<span class="${i <= review.rating ? 'text-yellow-400' : 'text-gray-200'} text-lg">★</span>`;
            }

            // เช็คว่ารีวิวถูกซ่อนไหม ถ้าซ่อนให้ใส่คลาสเบลอ
            const isHidden = review.is_hidden === 1 || review.is_hidden === true;
            
            // ถ้าถูกซ่อน จะใส่เอฟเฟกต์เบลอ (blur-sm), ลดความทึบ (opacity-50) และกันลากคลุมข้อความ (select-none)
            const commentStyle = isHidden ? 'blur-sm opacity-40 select-none bg-gray-100' : 'bg-white';
            
            // ข้อความแจ้งเตือนเล็กๆ ว่าโดนซ่อนอยู่
            const hiddenAlert = isHidden ? `<span class="text-xs text-red-500 font-bold ml-2">(รีวิวนี้ถูกซ่อน)</span>` : '';

            // จัดการปุ่ม Show/Hide
            const toggleBtn = isHidden
                ? `<button onclick="toggleHide(${review.review_id}, 0)" class="btn btn-sm bg-green-400 hover:bg-green-500 text-white border-none px-6">Show</button>`
                : `<button onclick="toggleHide(${review.review_id}, 1)" class="btn btn-sm bg-yellow-400 hover:bg-yellow-500 text-white border-none px-6">Hide</button>`;

            return `
            <div class="bg-gray-50 rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-3">
                <div class="flex justify-between items-start">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-xl shadow-inner">C</div>
                        <div>
                            <h3 class="font-bold text-gray-800">Anonymous Customer ${hiddenAlert}</h3>
                            <div class="flex gap-1">${stars}</div>
                        </div>
                    </div>
                    <span class="text-xs text-gray-400 font-bold">${dateStr}</span>
                </div>
                
                <div class="p-4 rounded-xl border border-gray-100 transition-all duration-300 ${commentStyle}">
                    <p class="text-gray-600 italic font-medium">"${review.comment || 'ไม่มีข้อความความประทับใจ'}"</p>
                </div>

                <div class="flex justify-end gap-2 mt-2">
                    ${toggleBtn}
                    <button onclick="deleteReview(${review.review_id})" class="btn btn-sm bg-red-500 hover:bg-red-600 text-white border-none px-6">Delete</button>
                </div>
            </div>
            `;
        }).join('');
    } catch (err) {
        console.error(err);
        container.innerHTML = `<p class="text-center text-red-500 font-bold mt-10">โหลดข้อมูลไม่สำเร็จ (เซิร์ฟเวอร์มีปัญหา)</p>`;
    }
}

window.toggleHide = async function(id, is_hidden) {
    try {
        const res = await fetch(`/admin/review/${id}/hide`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_hidden })
        });
        if (res.ok) {
            loadReviews(); 
        }
    } catch (err) {
        Swal.fire('ผิดพลาด', 'ไม่สามารถเปลี่ยนสถานะได้', 'error');
    }
}

window.deleteReview = function(id) {
    Swal.fire({
        title: 'ยืนยันการลบ?',
        text: "หากลบแล้วจะไม่สามารถกู้คืนรีวิวนี้ได้!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'ใช่, ลบทิ้งเลย!',
        cancelButtonText: 'ยกเลิก',
        
        // 💡 พระเอกขี่ม้าขาว: บังคับสีปุ่มแก้ปัญหาปุ่มล่องหน
        customClass: {
            confirmButton: 'bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg mx-2 border-none',
            cancelButton: 'bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg mx-2 border-none',
            popup: 'rounded-[2rem]'
        },
        buttonsStyling: false // ปิดสไตล์เดิมทิ้ง
        
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const res = await fetch(`/admin/review/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    Swal.fire({
                        title: 'ลบสำเร็จ!',
                        icon: 'success',
                        showConfirmButton: false,
                        timer: 1500,
                        customClass: { popup: 'rounded-[2rem]' }
                    });
                    loadReviews();
                }
            } catch (err) {
                Swal.fire('ผิดพลาด', 'ไม่สามารถลบรีวิวได้', 'error');
            }
        }
    });
}