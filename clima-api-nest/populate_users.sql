USE climabd;
GO

SET NOCOUNT ON;

-- Si existe la tabla p_empleados, la vaciamos
IF OBJECT_ID('dbo.p_empleados', 'U') IS NOT NULL 
BEGIN
    TRUNCATE TABLE dbo.p_empleados;
END
GO

-- Vaciamos p_Usuarios
-- TRUNCATE TABLE dbo.p_Usuarios; -- puede fallar si hay FKs, pero sabemos que está vacía

INSERT INTO dbo.p_Usuarios (nombre, nombreCompleto, correo, activo, carnet, eliminado, rolGlobal)
VALUES 
('Candida Sanchez', 'Candida Sanchez', 'candida.sanchez@empresa.com', 1, 'CANDIDA_S', 0, 'Admin'),
('Juan Ortuno', 'Juan Ortuno', 'juan.ortuno@empresa.com', 1, 'JUAN_O', 0, 'Soporte'),
('Sergio', 'Sergio', 'sergio@empresa.com', 1, 'SERGIO_X', 0, 'Soporte'),
('Allan Hernandez', 'Allan Hernandez', 'allan.hernandez@empresa.com', 1, 'ALLAN_H', 0, 'Soporte');
GO

-- Si p_empleados existe, insertarlos también allí por si alguna vista o sub-procedimiento antíguo los requiere
IF OBJECT_ID('dbo.p_empleados', 'U') IS NOT NULL 
BEGIN
    INSERT INTO dbo.p_empleados (carnet, nombre_completo, correo, cargo)
    VALUES 
    ('CANDIDA_S', 'Candida Sanchez', 'candida.sanchez@empresa.com', 'Admin'),
    ('JUAN_O', 'Juan Ortuno', 'juan.ortuno@empresa.com', 'Especialista'),
    ('SERGIO_X', 'Sergio', 'sergio@empresa.com', 'Analista'),
    ('ALLAN_H', 'Allan Hernandez', 'allan.hernandez@empresa.com', 'Analista');
END
GO
