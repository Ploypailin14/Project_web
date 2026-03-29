document.addEventListener('DOMContentLoaded', () => {

    // --- Part 1: Login / Register Toggle System ---
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    const goToRegisterBtn = document.getElementById('go-to-register');
    const goToLoginBtn = document.getElementById('go-to-login');

    // Check if buttons exist before adding event listeners to prevent errors
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

    // --- Part 2: Send data to Backend on Login submit ---
    const loginForm = document.getElementById('login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent default form submission (page refresh)

            const usernameInput = document.getElementById('login-username').value;
            const passwordInput = document.getElementById('login-password').value;

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: usernameInput,
                        password: passwordInput
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    alert('Login successful!');
                    window.location.href = data.redirect || 'dashboard.html'; 
                } else {
                    alert('Login failed: ' + data.message);
                    document.getElementById('login-password').value = ''; 
                }

            } catch (error) {
                console.error('Error:', error);
                alert('Cannot connect to the server.');
            }
        });
    }

    // --- Part 3: Register System (For future implementation) ---
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Registration system is under development...');
            // In the future, you can implement fetch('/register') here
        });
    }

});