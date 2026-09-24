document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const showRegisterBtn = document.getElementById('showRegister');
  const showLoginBtn = document.getElementById('showLogin');

  const loginError = document.getElementById('login-error');
  const registerMsg = document.getElementById('register-msg');
  const loginBtn = loginForm ? loginForm.querySelector('.btn-login') : null;
  const registerBtn = registerForm ? registerForm.querySelector('.btn-login') : null;

  // --- FORM GEÇİŞLERİ (LOGIN <-> REGISTER) ---
  if (showRegisterBtn && showLoginBtn) {
    showRegisterBtn.addEventListener('click', (e) => {
      e.preventDefault();
      loginForm.style.display = 'none';
      registerForm.style.display = 'block';
    });

    showLoginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      registerForm.style.display = 'none';
      loginForm.style.display = 'block';
    });
  }

  // --- GİRİŞ YAPMA (LOGIN) MANTIĞI ---
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault(); 
      const usernameVal = document.getElementById('username').value.trim();
      const passwordVal = document.getElementById('password').value.trim();

      loginError.style.display = 'none';
      const originalBtnText = loginBtn.textContent;
      loginBtn.textContent = 'Giriş Yapılıyor...';
      loginBtn.disabled = true;
      loginBtn.classList.add('is-charging'); // Buton, istek sürerken şarj oluyormuş gibi dolar

      // GERÇEK BACKEND (JWT) DOĞRULAMASI
      fetch("https://catalogecars.onrender.com/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameVal, password: passwordVal })
      })
      .then(response => response.json())
      .then(data => {
        if (data.token) {
          localStorage.setItem("jwt_token", data.token);
          window.location.href = 'app.html';
        } else {
          loginError.textContent = data.error || 'Hatalı kullanıcı adı veya şifre!';
          loginError.style.display = 'block';
          loginBtn.textContent = originalBtnText;
          loginBtn.disabled = false;
          loginBtn.classList.remove('is-charging');
        }
      })
      .catch(error => {
        console.error("Giriş hatası:", error);
        loginError.textContent = 'Sunucuya bağlanılamadı!';
        loginError.style.display = 'block';
        loginBtn.textContent = originalBtnText;
        loginBtn.disabled = false;
        loginBtn.classList.remove('is-charging');
      });
    });
  }

  // --- KAYIT OLMA (REGISTER) MANTIĞI ---
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const usernameVal = document.getElementById('reg-username').value.trim();
      const passwordVal = document.getElementById('reg-password').value.trim();
      const passwordConfirmVal = document.getElementById('reg-password-confirm').value.trim();
      const roleVal = document.getElementById('reg-role') ? document.getElementById('reg-role').value : 'user';

      registerMsg.style.display = 'none';

      if (passwordVal !== passwordConfirmVal) {
        registerMsg.textContent = 'Şifreler eşleşmiyor!';
        registerMsg.style.color = '#ff4d4d'; // Kırmızı
        registerMsg.style.display = 'block';
        return;
      }

      const originalBtnText = registerBtn.textContent;
      registerBtn.textContent = 'Kayıt Olunuyor...';
      registerBtn.disabled = true;

      // GERÇEK BACKEND KAYIT İŞLEMİ
      fetch("https://catalogecars.onrender.com/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameVal, password: passwordVal, role: roleVal })
      })
      .then(response => response.json())
      .then(data => {
        if (data.message) {
          // Başarılı kayıt
          registerMsg.textContent = 'Başarılı! Şimdi giriş yapabilirsiniz.';
          registerMsg.style.color = '#22c55e'; // Yeşil
          registerMsg.style.display = 'block';
          registerBtn.textContent = originalBtnText;
          registerBtn.disabled = false;

          // 2 saniye sonra otomatik giriş ekranına at
          setTimeout(() => {
            registerForm.style.display = 'none';
            loginForm.style.display = 'block';
            document.getElementById('username').value = usernameVal; // Adını otomatik doldur
            document.getElementById('password').value = ''; 
          }, 2000);

        } else {
          // Hata (Kullanıcı zaten var vs.)
          registerMsg.textContent = data.error || 'Kayıt başarısız!';
          registerMsg.style.color = '#ff4d4d';
          registerMsg.style.display = 'block';
          registerBtn.textContent = originalBtnText;
          registerBtn.disabled = false;
        }
      })
      .catch(error => {
        console.error("Kayıt hatası:", error);
        registerMsg.textContent = 'Sunucuya bağlanılamadı!';
        registerMsg.style.color = '#ff4d4d';
        registerMsg.style.display = 'block';
        registerBtn.textContent = originalBtnText;
        registerBtn.disabled = false;
      });
    });
  }

  // --- MİSAFİR OLARAK İNCELE: BUTON DOLDUKTAN SONRA SAYFAYA GEÇ ---
  const guestBtn = document.getElementById('rehbereGit');
  if (guestBtn) {
    guestBtn.addEventListener('click', (e) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; // animasyonsuz, direkt geç
      e.preventDefault();
      guestBtn.classList.add('is-charging');
      setTimeout(() => { window.location.href = guestBtn.href; }, 1300); // bir dolum turu kadar bekle
    });
  }

  // --- ŞİFRE GÖSTER/GİZLE ---
  const eyeIcons = document.querySelectorAll('.eye-icon');
  eyeIcons.forEach(icon => {
    icon.addEventListener('click', () => {
      const targetId = icon.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (input) {
        if (input.type === 'password') {
          input.type = 'text';
          icon.textContent = '🙈';
        } else {
          input.type = 'password';
          icon.textContent = '👁️';
        }
      }
    });
  });
});
