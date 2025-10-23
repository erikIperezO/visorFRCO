-- =====================================================
-- Migración: Eliminar restricción de fechas
-- =====================================================

USE digitalizacion;

-- PASO 1: Limpiar datos duplicados PRIMERO (antes de cualquier cambio de índice)
-- Si hay registros duplicados con el mismo usuario_id y municipio_id, mantiene solo uno
DELETE t1 FROM usuario_municipios t1
INNER JOIN usuario_municipios t2
WHERE t1.id > t2.id
  AND t1.usuario_id = t2.usuario_id
  AND t1.municipio_id = t2.municipio_id;

-- PASO 2: Actualizar registros existentes: hacer fecha_asignacion NULL
UPDATE usuario_municipios
SET fecha_asignacion = NULL;

-- PASO 3: Eliminar las constraints de clave foránea temporalmente
ALTER TABLE usuario_municipios
DROP FOREIGN KEY usuario_municipios_ibfk_1;

ALTER TABLE usuario_municipios
DROP FOREIGN KEY usuario_municipios_ibfk_2;

-- PASO 4: Eliminar el índice único que incluye fecha_asignacion
ALTER TABLE usuario_municipios
DROP INDEX unique_usuario_municipio_fecha;

-- PASO 5: Crear nuevo índice único sin fecha (solo usuario + municipio)
-- Esto evita asignar el mismo municipio al mismo usuario múltiples veces
ALTER TABLE usuario_municipios
ADD UNIQUE INDEX unique_usuario_municipio (usuario_id, municipio_id);

-- PASO 6: Recrear las constraints de clave foránea
ALTER TABLE usuario_municipios
ADD CONSTRAINT usuario_municipios_ibfk_1
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE usuario_municipios
ADD CONSTRAINT usuario_municipios_ibfk_2
    FOREIGN KEY (municipio_id) REFERENCES municipios(idmunicipios)
    ON DELETE RESTRICT ON UPDATE RESTRICT;

-- 5. Verificar resultado
SELECT
    u.id AS user_id,
    u.username,
    COUNT(um.municipio_id) AS total_municipios
FROM usuarios u
LEFT JOIN usuario_municipios um ON u.id = um.usuario_id
GROUP BY u.id, u.username
ORDER BY u.username;

SELECT '✅ Migración completada - Sistema sin fechas' AS resultado;

-- Nota: La columna fecha_asignacion sigue existiendo pero ahora siempre es NULL
-- Si quieres eliminarla completamente (opcional):
-- ALTER TABLE usuario_municipios DROP COLUMN fecha_asignacion;
