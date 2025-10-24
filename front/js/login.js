const API_BASE = "http://172.19.2.220:8080/api";

const DOM = {
  loginForm: document.getElementById("login-form"),
  usernameInput: document.getElementById("username"),
  passwordInput: document.getElementById("password"),
  notification: document.getElementById("notification"),
};

class Notification {
  static show(message, type = "success") {
    DOM.notification.textContent = message;
    DOM.notification.className = `notification ${type}`;
    DOM.notification.classList.add("show");

    setTimeout(() => {
      DOM.notification.classList.remove("show");
    }, 3000);
  }
}

class AuthService {
  static async login(username, password) {
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();

        // Guardar sesión Y token por separado
        localStorage.setItem("userSession", JSON.stringify(data));
        localStorage.setItem("authToken", data.token); // Guardar token JWT

        // Redirigir según el rol
        if (data.usuario.rol_nombre === "admin" || data.usuario.rol_id === 1) {
          window.location.href = "/front/public/admin.html";
        } else {
          window.location.href = "/front/public/index.html";
        }
      } else {
        Notification.show("Credenciales incorrectas", "error");
      }
    } catch (error) {
      Notification.show("Error de conexión", "error");
    }
  }

  static verificarSesion() {
    const session = localStorage.getItem("userSession");
    if (session) {
      const data = JSON.parse(session);
      // Si ya hay sesión activa, redirigir según el rol
      if (data.usuario.rol_nombre === "admin" || data.usuario.rol_id === 1) {
        window.location.href = "/front/admin.html";
      } else {
        window.location.href = "/front/index.html";
      }
    }
  }
}

// Inicializar
document.addEventListener("DOMContentLoaded", () => {
  AuthService.verificarSesion();

  DOM.loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = DOM.usernameInput.value;
    const password = DOM.passwordInput.value;
    AuthService.login(username, password);
  });
});
