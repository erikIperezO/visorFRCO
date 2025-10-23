-- =====================================================
-- Migración SIMPLE: Sin eliminar índice viejo
-- =====================================================

USE digitalizacion;

-- PASO 1: Limpiar duplicados
-- Si hay registros duplicados con el mismo usuario_id y municipio_id, mantiene solo uno
DELETE t1 FROM usuario_municipios t1
INNER JOIN usuario_municipios t2
WHERE t1.id > t2.id
  AND t1.usuario_id = t2.usuario_id
  AND t1.municipio_id = t2.municipio_id;

-- PASO 2: Actualizar fechas a NULL
UPDATE usuario_municipios
SET fecha_asignacion = NULL;

-- PASO 3: Verificar resultado
SELECT
    u.id AS user_id,
    u.username,
    COUNT(um.municipio_id) AS total_municipios
FROM usuarios u
LEFT JOIN usuario_municipios um ON u.id = um.usuario_id
GROUP BY u.id, u.username
ORDER BY u.username;

-- Verificar que no hay duplicados
SELECT
    usuario_id,
    municipio_id,
    COUNT(*) as cantidad
FROM usuario_municipios
GROUP BY usuario_id, municipio_id
HAVING COUNT(*) > 1;

SELECT '✅ Migración SIMPLE completada' AS resultado;

-- NOTA: Esta migración NO elimina el índice viejo con fecha
-- El índice con fecha sigue existente pero ahora fecha_asignacion siempre es NULL
-- El sistema funciona correctamente así
