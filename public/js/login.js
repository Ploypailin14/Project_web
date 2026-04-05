document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    const goToRegisterBtn = document.getElementById('go-to-register');
    const goToLoginBtn = document.getElementById('go-to-login');

    if (goToRegisterBtn && goToLoginBtn) {
        goToRegisterBtn.addEventListener('click', () => {
            loginSection.classList.add('hidden');
            registerSection.classList.remove('hidden');
        });
        goToLoginBtn.addEventListener('click', () => {
            registerSection.classList.add('hidden');
            loginSection.classList.remove('hidden');
        });
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            const usernameInput = document.getElementById('login-username').value;
            const passwordInput = document.getElementById('login-password').value;

            try {
                // 💡 ยิง API ไปหาหลังบ้านที่ถูกต้อง
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
                    alert('Login successful!');
                    // เก็บชื่อแอดมินไว้แสดงผลหน้า Welcome
                    localStorage.setItem('adminUsername', data.username);
                    // เปลี่ยนหน้าไปที่ Welcome
                    window.location.href = '/admin/page/welcome'; 
                } else {
                    const errorMsg = await response.text();
                    alert('Login failed: ' + errorMsg);
                    document.getElementById('login-password').value = ''; 
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Cannot connect to the server.');
            }
        });
    }
});