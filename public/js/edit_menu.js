document.addEventListener('DOMContentLoaded', () => {
    // ดึง ID จาก URL (เช่น ?id=2) เพื่อเช็คว่าเป็นโหมดแก้ไข หรือ โหมดสร้างใหม่
    const urlParams = new URLSearchParams(window.location.search);
    const menuId = urlParams.get('id');
    let selectedFile = null;
    let selectedCategory = "Main Course"; // ค่าเริ่มต้นเป็น Main Course

    const fileUpload = document.getElementById('file-upload');
    const previewImage = document.getElementById('preview-image');
    const categoryButtons = document.querySelectorAll('.category-btn');
    const saveBtn = document.getElementById('save-change-btn');

    // 1. ถ้านี่คือโหมด "แก้ไข" (มี ID) ให้ไปดึงข้อมูลเดิมมาแสดง
    if (menuId) {
        fetch('/admin/menus-list')
            .then(res => res.json())
            .then(data => {
                const currentItem = data.find(m => m.menu_id == menuId);
                if(currentItem) {
                    document.getElementById('menu-name').value = currentItem.name;
                    document.getElementById('menu-price').value = currentItem.price;
                    
                    // โชว์รูปเก่าถ้าระบบมีรูป
                    if (currentItem.image && currentItem.image.trim() !== '') {
                        previewImage.src = currentItem.image;
                    }

                    // อัปเดตสีปุ่มหมวดหมู่ให้ตรงกับข้อมูลใน Database
                    if (currentItem.category) {
                        selectedCategory = currentItem.category;
                        categoryButtons.forEach(btn => {
                            if (btn.getAttribute('data-category') === selectedCategory) {
                                btn.className = "category-btn btn btn-sm bg-zinc-800 text-white hover:bg-black border-none";
                            } else {
                                btn.className = "category-btn btn btn-sm btn-ghost bg-gray-100 hover:bg-gray-200";
                            }
                        });
                    }
                }
            })
            .catch(err => console.error("Error loading menu details:", err));
    }

    // 2. ระบบพรีวิวรูปภาพเวลาแอดมินอัปโหลด
    if (fileUpload) {
        fileUpload.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                selectedFile = file;
                previewImage.src = URL.createObjectURL(file);
            }
        });
    }

    // 3. ระบบคลิกสลับสีปุ่มหมวดหมู่
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            selectedCategory = this.getAttribute('data-category');
            
            // รีเซ็ตปุ่มอื่นให้เป็นสีเทา
            categoryButtons.forEach(btn => btn.className = "category-btn btn btn-sm btn-ghost bg-gray-100 hover:bg-gray-200");
            // เปลี่ยนปุ่มที่โดนคลิกเป็นสีดำ
            this.className = "category-btn btn btn-sm bg-zinc-800 text-white hover:bg-black border-none";
        });
    });

    // 4. ระบบบันทึกข้อมูล
    if (saveBtn) {
        saveBtn.addEventListener('click', async function() {
            const menuName = document.getElementById('menu-name').value;
            const menuPrice = document.getElementById('menu-price').value;

            if (!menuName || !menuPrice) {
                Swal.fire('ข้อมูลไม่ครบ', 'กรุณากรอกชื่อและราคาอาหาร', 'warning');
                return;
            }

            const formData = new FormData();
            formData.append('name', menuName);
            formData.append('price', menuPrice);
            formData.append('category', selectedCategory); 
            
            if (selectedFile) {
                formData.append('imageFile', selectedFile);
            }

            try {
                let res;
                if (menuId) {
                    res = await fetch(`/admin/menu/${menuId}`, {
                        method: 'PUT',
                        body: formData 
                    });
                } else {
                    res = await fetch('/admin/menu', {
                        method: 'POST',
                        body: formData 
                    });
                }

                if (res.ok) {
                    Swal.fire({
                        icon: 'success',
                        title: 'สำเร็จ!',
                        text: menuId ? 'อัปเดตเมนูเรียบร้อย' : 'เพิ่มเมนูใหม่พร้อมรูปภาพเรียบร้อย',
                        showConfirmButton: false,
                        timer: 1500
                    }).then(() => {
                        window.location.href = '/admin/page/menu';
                    });
                } else {
                    const errorData = await res.json();
                    Swal.fire('ผิดพลาด', errorData.error || 'เซิร์ฟเวอร์ไม่ตอบสนอง หรือรูปแบบข้อมูลผิด', 'error');
                }
            } catch (error) {
                console.error(error);
                Swal.fire('เชื่อมต่อล้มเหลว', 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้', 'error');
            }
        });
    }
});