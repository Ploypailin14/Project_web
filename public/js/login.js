document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            const usernameInput = document.getElementById('login-username').value;
            const passwordInput = document.getElementById('login-password').value;

            try {
                const response = await fetch('/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: usernameInput,
                        password: passwordInput
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    // เก็บชื่อแอดมินไว้แสดงผลหน้า Welcome
                    localStorage.setItem('adminUsername', data.username || usernameInput);
                    // เปลี่ยนหน้าไปที่ Welcome
                    window.location.href = '/admin/page/welcome'; 
                } else {
                    const errorMsg = await response.text();
                    alert('เข้าสู่ระบบล้มเหลว: ' + errorMsg);
                    document.getElementById('login-password').value = ''; 
                }
            } catch (error) {
                console.error('Error:', error);
                alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
            }
        });
    }
});