-- =====================================================
-- Script para arreglar el problema de fechas
-- =====================================================

USE digitalizacion;

-- 1. Actualizar asignaciones que no tienen fecha
UPDATE usuario_municipios
SET fecha_asignacion = CURDATE()
WHERE fecha_asignacion IS NULL;

-- 2. Verificar resultados
SELECT
    u.id AS user_id,
    u.username,
    m.idmunicipios AS municipio_id,
    m.nombre AS municipio,
    um.fecha_asignacion
FROM usuario_municipios um
JOIN usuarios u ON um.usuario_id = u.id
JOIN municipios m ON um.municipio_id = m.idmunicipios
ORDER BY u.username, m.nombre;

-- 3. Mostrar resumen
SELECT
    u.username,
    COUNT(um.municipio_id) AS total_municipios,
    MIN(um.fecha_asignacion) AS primera_asignacion,
    MAX(um.fecha_asignacion) AS ultima_asignacion
FROM usuarios u
LEFT JOIN usuario_municipios um ON u.id = um.usuario_id
GROUP BY u.username
ORDER BY u.username;

SELECT '✅ Fechas actualizadas correctamente' AS resultado;
