document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const menuId = urlParams.get('id');

    let selectedCategory = 'Main Course'; 
    let existingStatus = 'available'; 

    // 1. ระบบพรีวิวรูปภาพ
    const imageInput = document.getElementById('imageFile');
    const previewImg = document.getElementById('preview-img');
    const previewText = document.getElementById('preview-text');

    imageInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImg.src = e.target.result;
                previewImg.classList.remove('hidden');
                previewText.classList.add('hidden');
            }
            reader.readAsDataURL(file);
        }
    });

    // 2. ระบบเปลี่ยนสีปุ่มหมวดหมู่
    const catBtns = document.querySelectorAll('.cat-btn');
    catBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // ล้างสีปุ่มอื่น
            catBtns.forEach(b => {
                b.classList.remove('bg-zinc-800', 'text-white');
                b.classList.add('bg-gray-100', 'text-gray-700');
            });
            // ไฮไลต์ปุ่มที่กด
            e.target.classList.remove('bg-gray-100', 'text-gray-700');
            e.target.classList.add('bg-zinc-800', 'text-white');
            
            selectedCategory = e.target.getAttribute('data-cat');
        });
    });

    // 3. โหลดข้อมูลเดิม (ถ้าเป็นการแก้ไข)
    if (menuId) {
        try {
            const res = await fetch(`/admin/menu/${menuId}`);
            if (res.ok) {
                const menu = await res.json();
                
                // 💡 นำข้อมูลมาใส่ในช่อง
                document.getElementById('menuName').value = menu.name;
                document.getElementById('menuPrice').value = menu.price;
                document.getElementById('menuDesc').value = menu.description || ''; // ใส่รายละเอียด
                
                existingStatus = menu.status || 'available';

                // เซ็ตปุ่มหมวดหมู่
                if (menu.category) {
                    catBtns.forEach(b => {
                        if (b.getAttribute('data-cat') === menu.category) {
                            b.click(); 
                        }
                    });
                }

                // เอารูปเดิมมาโชว์
                if (menu.image && menu.image.trim() !== '') {
                    previewImg.src = menu.image;
                    previewImg.classList.remove('hidden');
                    previewText.classList.add('hidden');
                }
            }
        } catch (err) {
            Swal.fire('ผิดพลาด', 'ไม่สามารถโหลดข้อมูลเมนูได้', 'error');
        }
    }

    // 4. บันทึกข้อมูล
    document.getElementById('saveBtn').addEventListener('click', async () => {
        const name = document.getElementById('menuName').value;
        const price = document.getElementById('menuPrice').value;
        const description = document.getElementById('menuDesc').value; // 💡 ดึงค่ารายละเอียดมา

        if (!name || !price) {
            Swal.fire('แจ้งเตือน', 'กรุณากรอกชื่อเมนูและราคาให้ครบถ้วน', 'warning');
            return;
        }

        // แพ็กข้อมูลทั้งหมดรวมถึงรูปภาพและรายละเอียด
        const formData = new FormData();
        formData.append('name', name);
        formData.append('price', price);
        formData.append('description', description); // 💡 ส่งรายละเอียดไปด้วย
        formData.append('category', selectedCategory);
        formData.append('status', existingStatus);

        if (imageInput.files[0]) {
            formData.append('imageFile', imageInput.files[0]);
        }

        const method = menuId ? 'PUT' : 'POST';
        const url = menuId ? `/admin/menu/${menuId}` : '/admin/menu';

        try {
            const res = await fetch(url, {
                method: method,
                body: formData 
            });

            if (res.ok) {
                Swal.fire({
                    icon: 'success', 
                    title: 'บันทึกสำเร็จ!', 
                    text: 'ระบบได้ทำการอัปเดตข้อมูลเมนูแล้ว',
                    showConfirmButton: false, 
                    timer: 1500
                }).then(() => {
                    window.location.href = '/admin/page/menu'; 
                });
            } else {
                Swal.fire('ผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้', 'error');
            }
        } catch (err) {
            Swal.fire('การเชื่อมต่อล้มเหลว', 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้', 'error');
        }
    });
});