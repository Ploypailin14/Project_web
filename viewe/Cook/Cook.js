const API_BASE_URL = ''; 

// 💡 1. ระบบเช็คสถานะการล็อกอินอัตโนมัติ
document.addEventListener('DOMContentLoaded', () => {
    const cookToken = localStorage.getItem('cookToken');
    
    if (cookToken) {
        // ถ้ามี Token อยู่แล้ว ให้ซ่อนหน้า Login และโชว์ Navbar + ไปหน้า Orders เลย
        document.getElementById('login-page').style.display = 'none';
        document.getElementById('main-nav').style.display = 'flex';
        showPage('orders');
    } else {
        // ถ้ายังไม่มี ให้โชว์หน้า Login แบบ flex (กันโดน CSS ซ่อน)
        const loginPage = document.getElementById('login-page');
        loginPage.style.display = 'flex';
        loginPage.classList.remove('hidden');
        loginPage.style.opacity = "1";
    }
});

// 💡 2. ระบบเปลี่ยนหน้าต่าง (แก้ปัญหาจอล่องหนเด็ดขาด!)
function showPage(pageId) {
    // ซ่อนทุกหน้าให้หมดแบบเด็ดขาด (บังคับ style.display)
    document.querySelectorAll('.page').forEach(p => {
        p.classList.add('hidden');
        p.style.display = 'none'; 
    });
    
    document.querySelectorAll('.nav-links a').forEach(a => {
        a.classList.remove('text-orange-500', 'border-orange-500');
        a.classList.add('text-gray-400', 'border-transparent');
    });
    
    // โชว์หน้าเป้าหมายแบบบังคับ
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.remove('hidden');
        // ถ้าเป็นหน้า login ให้จัดแบบ flex, หน้าอื่นจัดแบบ block
        targetPage.style.display = (pageId === 'login-page') ? 'flex' : 'block';
    }
    
    const navItem = document.getElementById('nav-' + pageId);
    if (navItem) {
        navItem.classList.remove('text-gray-400', 'border-transparent');
        navItem.classList.add('text-orange-500', 'border-orange-500');
    }

    if(pageId === 'orders') fetchActiveOrders();
    if(pageId === 'dashboard') fetchDashboard();
    if(pageId === 'reviews') fetchReviews();
}

function toggleAuth(mode) {
    const isLogin = mode === 'login';
    const btnLogin = document.getElementById('btn-login');
    const btnSignup = document.getElementById('btn-signup');

    if(isLogin) {
        btnLogin.className = "flex-1 pb-3 font-bold text-white border-b-2 border-orange-500 transition-all";
        btnSignup.className = "flex-1 pb-3 font-bold text-gray-400 border-b-2 border-transparent transition-all hover:text-gray-200";
    } else {
        btnSignup.className = "flex-1 pb-3 font-bold text-white border-b-2 border-orange-500 transition-all";
        btnLogin.className = "flex-1 pb-3 font-bold text-gray-400 border-b-2 border-transparent transition-all hover:text-gray-200";
    }

    document.getElementById('confirm-pw-group').classList.toggle('hidden', isLogin);
    document.getElementById('submit-btn').innerText = isLogin ? 'Log in' : 'Sign Up';
}

function logout() {
    Swal.fire({
        title: 'ออกจากระบบ',
        text: 'คุณต้องการออกจากระบบใช่หรือไม่?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'ใช่, ออกจากระบบ',
        cancelButtonText: 'ยกเลิก',
        customClass: {
            confirmButton: 'bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg mx-2',
            cancelButton: 'bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg mx-2'
        },
        buttonsStyling: false
    }).then((result) => {
        if (result.isConfirmed) {
            document.getElementById('main-nav').style.display = 'none';
            document.querySelectorAll('.page').forEach(p => {
                p.classList.add('hidden');
                p.style.display = 'none';
            });
            document.getElementById('cook-id-input').value = '';
            document.getElementById('password-input').value = '';
            
            const loginPage = document.getElementById('login-page');
            loginPage.style.display = 'flex';
            loginPage.classList.remove('hidden');
            loginPage.style.opacity = "1";
            
            localStorage.removeItem('cookToken'); 
        }
    });
}

// ==========================================
// 3. ระบบยืนยันตัวตน
// ==========================================
async function handleAuth() {
    const cookId = document.getElementById('cook-id-input').value;
    const password = document.getElementById('password-input').value;
    const btn = document.getElementById('submit-btn');

    const fireAlert = (title, text, icon, btnColor) => {
        return Swal.fire({
            title: title, text: text, icon: icon, confirmButtonText: 'ตกลง',
            customClass: { confirmButton: `${btnColor} text-white font-bold py-2 px-6 rounded-lg` },
            buttonsStyling: false
        });
    };

    if (!cookId || !password) return fireAlert('แจ้งเตือน', 'กรุณากรอกข้อมูลให้ครบถ้วน', 'warning', 'bg-orange-500 hover:bg-orange-600');

    const parsedCookId = parseInt(cookId);

    if (btn.innerText === 'Log in') {
        document.getElementById('login-page').style.opacity = "0.6";
        try {
            const res = await fetch(`${API_BASE_URL}/cook/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ cook_id: parsedCookId, password: password })
            });
            const result = await res.json();
            
            if (res.status === 200 && result.token) {
                localStorage.setItem('cookToken', result.token); 
                document.getElementById('login-page').style.display = 'none';
                document.getElementById('main-nav').style.display = 'flex';
                showPage('orders');
            } else {
                fireAlert('เข้าสู่ระบบล้มเหลว', result.message || 'รหัสผ่านไม่ถูกต้อง', 'error', 'bg-red-500 hover:bg-red-600');
                document.getElementById('login-page').style.opacity = "1";
            }
        } catch (e) {
            console.error(e);
            fireAlert('ข้อผิดพลาด', 'เซิร์ฟเวอร์ไม่ตอบสนอง', 'error', 'bg-red-500 hover:bg-red-600');
            document.getElementById('login-page').style.opacity = "1";
        }
    } else {
        const confirmPw = document.getElementById('confirm-password-input').value;
        if(password !== confirmPw) return fireAlert('แจ้งเตือน', 'รหัสผ่านไม่ตรงกัน', 'warning', 'bg-orange-500 hover:bg-orange-600');

        try {
            const res = await fetch(`${API_BASE_URL}/cook/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cook_id: parsedCookId, password: password })
            });
            const result = await res.json();
            if(res.status === 200) {
                fireAlert('สำเร็จ!', 'ลงทะเบียนตั้งรหัสผ่านเรียบร้อยแล้ว', 'success', 'bg-green-500 hover:bg-green-600');
                toggleAuth('login');
            } else {
                fireAlert('ผิดพลาด', result.message || "ลงทะเบียนไม่สำเร็จ", 'error', 'bg-red-500 hover:bg-red-600');
            }
        } catch (e) { 
            console.error(e); 
            fireAlert('ข้อผิดพลาด', 'เซิร์ฟเวอร์ไม่ตอบสนอง', 'error', 'bg-red-500 hover:bg-red-600');
        }
    }
}

// ==========================================
// 4. ระบบดึงข้อมูลออเดอร์เข้าครัว
// ==========================================
async function fetchActiveOrders() {
    try {
        const res = await fetch(`${API_BASE_URL}/cook/orders`);
        const orders = await res.json();
        
        // 💡 เพิ่มระบบดักจับ Error กรณี Backend ฐานข้อมูลมีปัญหา
        if (!res.ok || !Array.isArray(orders)) {
            console.error("Backend Error:", orders);
            document.getElementById('orders-container').innerHTML = '<div class="col-span-full text-center text-red-500 text-xl font-bold bg-white/90 p-10 rounded-3xl backdrop-blur-sm">⚠️ ระบบมีปัญหา: ไม่สามารถดึงข้อมูลออเดอร์ได้ (เช็ค API หรือ Database)</div>';
            return;
        }
        
        renderOrders(orders);
    } catch (e) { 
        console.error("Fetch Orders Error:", e); 
    }
}

function renderOrders(orders) {
    const container = document.getElementById('orders-container');
    
    if (!orders || orders.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center text-white text-2xl font-bold bg-white/10 p-10 rounded-3xl backdrop-blur-sm border border-white/20">🎉 ตอนนี้ไม่มีออเดอร์ค้างอยู่ครับ เยี่ยมมาก!</div>';
        return;
    }
    
    container.innerHTML = '';
    orders.forEach(order => {
        let config = {};
        if (order.status === 'pending') {
            config = { badgeBg: 'bg-red-100 text-red-600', badgeTxt: 'NEW ORDER', btnClass: 'bg-orange-500 hover:bg-orange-600 text-white', txt: 'Start Cooking', next: 'cooking' };
        } else if (order.status === 'cooking') {
            config = { badgeBg: 'bg-yellow-100 text-yellow-600', badgeTxt: 'COOKING', btnClass: 'bg-green-500 hover:bg-green-600 text-white', txt: 'Ready to Serve', next: 'served' };
        } else {
            return; 
        }

        const tableShow = order.table_no ? order.table_no : "?";

        container.innerHTML += `
            <div class="bg-white rounded-3xl shadow-2xl p-6 flex flex-col border border-gray-100 transform transition hover:-translate-y-1">
                <div class="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                    <span class="text-2xl font-black text-zinc-800">Table #${tableShow}</span>
                    <span class="badge ${config.badgeBg} font-bold px-4 py-3 border-none">${config.badgeTxt}</span>
                </div>
                
                <div class="flex-1 space-y-3 mb-6">
                    ${(order.items || []).map(i => `
                        <div class="flex flex-col bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <div class="flex justify-between items-center">
                                <span class="font-bold text-lg text-zinc-800">${i.name}</span>
                                <span class="text-orange-500 font-black text-xl">x${i.qty}</span>
                            </div>
                            ${i.note ? `<span class="text-sm text-red-500 font-semibold mt-1">📝 Note: ${i.note}</span>` : ''}
                        </div>
                    `).join('')}
                </div>
                
                <button class="btn w-full ${config.btnClass} border-none rounded-xl text-lg font-bold shadow-md transition-transform active:scale-95" 
                    onclick="updateOrderStatusDB(${order.order_id}, '${config.next}')">
                    ${config.txt}
                </button>
            </div>`;
    });
}

// ==========================================
// 5. ระบบอัปเดตออเดอร์
// ==========================================
async function updateOrderStatusDB(orderId, newStatus) {
    const btn = event.target;
    const oldText = btn.innerText;
    btn.innerText = "Processing...";
    btn.disabled = true;

    try {
        const cookToken = localStorage.getItem('cookToken');
        let currentCookId = null;
        if(cookToken) {
            const payload = JSON.parse(atob(cookToken.split('.')[1]));
            currentCookId = payload.cook_id;
        }

        const res = await fetch(`${API_BASE_URL}/cook/order/${orderId}`, {
            method: 'PUT', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus, cook_id: currentCookId })
        });
        
        if (res.status === 200) {
            fetchActiveOrders(); 
        } else {
            Swal.fire({title: 'ผิดพลาด', text: 'ไม่สามารถอัปเดตสถานะได้', icon: 'error', confirmButtonText: 'ตกลง', customClass: { confirmButton: 'bg-red-500 text-white font-bold py-2 px-6 rounded-lg' }, buttonsStyling: false});
            btn.innerText = oldText;
            btn.disabled = false;
        }
    } catch (e) { 
        Swal.fire({title: 'ข้อผิดพลาด', text: 'เซิร์ฟเวอร์ไม่ตอบสนอง', icon: 'error', confirmButtonText: 'ตกลง', customClass: { confirmButton: 'bg-red-500 text-white font-bold py-2 px-6 rounded-lg' }, buttonsStyling: false});
        btn.innerText = oldText;
        btn.disabled = false;
    }
}

// ==========================================
// 6. ระบบแดชบอร์ด & รีวิว
// ==========================================
async function fetchDashboard() {
    try {
        const res = await fetch(`${API_BASE_URL}/cook/dashboard`);
        const result = await res.json();
        
        if (res.status === 200) {
            document.getElementById('today-served-count').innerText = result.served_count || 0;
            
            const tbody = document.getElementById('leaderboard-body');
            tbody.innerHTML = ''; 
            
            if (result.top_menus && result.top_menus.length > 0) {
                result.top_menus.forEach((item, index) => {
                    let icon = index === 0 ? '👑 ' : '';
                    let rowClass = index === 0 ? 'font-bold bg-orange-50 border-b border-gray-200 text-zinc-900' : 'bg-white border-b border-gray-200 text-zinc-800 hover:bg-gray-50';
                    
                    tbody.innerHTML += `
                        <tr class="${rowClass} transition-colors">
                            <td class="py-4 pl-6">${icon}${index + 1}</td>
                            <td class="py-4">${item.menu_name}</td>
                            <td class="font-bold text-orange-600 py-4 pr-6">${item.cnt} จาน</td>
                        </tr>`;
                });
            } else {
                tbody.innerHTML = `<tr><td colspan="3" class="text-center text-gray-500 py-6">ยังไม่มีข้อมูลออเดอร์ในวันนี้</td></tr>`;
            }
        }
    } catch (e) { console.error("Dashboard Error:", e); }
}

async function fetchReviews() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/get_reviews.php`);
        const result = await res.json();
        
        if (result.success) {
            const sum = result.summary;
            document.getElementById('avg-score-text').innerText = `(${sum.average} / 5.0)`;
            document.getElementById('avg-stars-display').innerText = '★'.repeat(Math.round(sum.average)) + '☆'.repeat(5 - Math.round(sum.average));

            const reviewsContainer = document.getElementById('reviews-list-container');
            reviewsContainer.innerHTML = ''; 
            
            if (result.reviews && result.reviews.length > 0) {
                result.reviews.forEach(review => {
                    const dateTxt = review.createdAt ? new Date(review.createdAt).toLocaleString('th-TH') : '';
                    reviewsContainer.innerHTML += `
                        <div class="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 transform transition hover:-translate-y-1">
                            <div class="flex justify-between items-start mb-3">
                                <div class="text-2xl text-yellow-400 font-bold tracking-widest">
                                    ${'★'.repeat(review.rating)}<span class="text-gray-300">${'★'.repeat(5 - review.rating)}</span>
                                </div>
                                <div class="text-sm text-gray-500 font-medium">${dateTxt}</div>
                            </div>
                            <p class="text-zinc-800 text-lg mb-4">"${review.comment || 'ไม่มีข้อความ'}"</p>
                            ${review.tableNo ? `<div class="text-sm font-bold text-orange-500 bg-orange-100 inline-block px-3 py-1 rounded-lg">โต๊ะ: ${review.tableNo}</div>` : ''}
                        </div>
                    `;
                });
            } else {
                reviewsContainer.innerHTML = '<div class="text-center text-white text-xl bg-black/20 p-8 rounded-2xl">ยังไม่มีลูกค้ารีวิวเข้ามาครับ</div>';
            }
        }
    } catch (e) { console.error("Reviews Error:", e); }
}

setInterval(() => {
    if (!document.getElementById('orders').classList.contains('hidden')) fetchActiveOrders();
}, 15000);