-- =====================================================
-- Script de datos iniciales para el sistema
-- =====================================================

USE digitalizacion;

-- Insertar roles
INSERT INTO roles (id, nombre) VALUES
(1, 'admin'),
(2, 'usuario')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- Insertar usuario admin por defecto
-- Usuario: admin
-- Contraseña: admin123
-- Hash generado con bcrypt cost 10
INSERT INTO usuarios (username, password_hash, rol_id, activo) VALUES
('admin', '$2a$10$WZS4nTXp5d32NVDAw43REuJGhl1nY6m/oaIXCHYHAIro6FZeJ1R5y', 1, 1)
ON DUPLICATE KEY UPDATE username = VALUES(username);

-- NOTA: Para generar nuevos hashes de contraseñas ejecuta:
-- cd back && go run generar_hash.go

SELECT '✅ Datos iniciales insertados correctamente' AS resultado;
