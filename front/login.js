const API_BASE = "http://localhost:8080/api";

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
        localStorage.setItem("userSession", JSON.stringify(data));
        window.location.href = "index.html"; // Redirigir al main
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
      window.location.href = "index.html"; // Si ya hay sesión activa, directo al main
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
