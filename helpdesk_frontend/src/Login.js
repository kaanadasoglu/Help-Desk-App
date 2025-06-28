import React, { useState } from "react";
import './Login.css';
import helpIcon from './assets/helpdesk-icon.png'; 
import companyIcon from './assets/texchmax.png';    

function Login({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);

 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");


  const [fullName, setFullName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [role, setRole] = useState("user"); 

 
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        onLoginSuccess(data);
      } else {
        alert(data.message || "Giriş başarısız");
      }
    } catch (error) {
      alert("Sunucuya bağlanılamıyor");
    }
  };

 
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    if (registerPassword !== registerConfirmPassword) {
      alert("Şifreler eşleşmiyor");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          fullName,
          email: registerEmail,
          password: registerPassword,
          role  
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Kayıt başarılı, giriş yapabilirsiniz");
        setIsLogin(true);
      } else {
        alert(data.message || "Kayıt başarısız");
      }
    } catch (error) {
      alert("Sunucuya bağlanılamıyor");
    }
  };

  return (
    <div className="login-page">
      <div className="logo-wrapper">
        <img src={companyIcon} alt="Company Logo" className="company-icon" />
      </div>

      <div className="helpdesk-container">
        <img src={helpIcon} alt="Help Desk Icon" className="help-icon" />
        <h1 className="help-desk-title">Help Desk</h1>
      </div>

      <main className="form-container">
        {isLogin ? (
          <>
            <h2>Giriş Yap</h2>
            <form onSubmit={handleLoginSubmit}>
              <div>
                <label>Email:</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label>Şifre:</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <button type="submit">Giriş Yap</button>
            </form>
            <p>
              Hesabınız yok mu?{" "}
              <button
                onClick={() => setIsLogin(false)}
                className="link-button"
                type="button"
              >
                Kayıt Ol
              </button>
            </p>
          </>
        ) : (
          <>
            <h2>Kayıt Ol</h2>
            <form onSubmit={handleRegisterSubmit}>
              <div>
                <label>Ad Soyad:</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div>
                <label>Email:</label>
                <input
                  type="email"
                  required
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                />
              </div>
              <div>
                <label>Şifre:</label>
                <input
                  type="password"
                  required
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                />
              </div>
              <div>
                <label>Şifre Tekrar:</label>
                <input
                  type="password"
                  required
                  value={registerConfirmPassword}
                  onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                />
              </div>
              <div>
                <label>Rol Seçimi:</label>
                <select 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)}
                  required
                >
                  <option value="user">Kullanıcı</option>
                  <option value="support">Destek Elemanı</option>
                </select>
              </div>
              <button type="submit">Kayıt Ol</button>
            </form>
            <p>
              Zaten hesabınız var mı?{" "}
              <button
                onClick={() => setIsLogin(true)}
                className="link-button"
                type="button"
              >
                Giriş Yap
              </button>
            </p>
          </>
        )}
      </main>
    </div>
  );
}

export default Login;
