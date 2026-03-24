const sql = require('mssql');

const configMaster = {
    user: 'sa',
    password: 'TuPasswordFuerte!2026',
    server: '190.56.16.85',
    database: 'master',
    options: { encrypt: false, trustServerCertificate: true }
};

const configClima = {
    user: 'sa',
    password: 'TuPasswordFuerte!2026',
    server: '190.56.16.85',
    database: 'Bdclima',
    options: { encrypt: false, trustServerCertificate: true }
};

async function createClimaDB() {
    try {
        // 1. Conectar a master y crear Bdclima si no existe
        let poolMaster = await sql.connect(configMaster);
        const checkDb = await poolMaster.request().query("SELECT name FROM sys.databases WHERE name = 'Bdclima'");
        if (checkDb.recordset.length === 0) {
            console.log("Creando base de datos Bdclima...");
            await poolMaster.request().query("CREATE DATABASE Bdclima");
        } else {
            console.log("Bdclima ya existe.");
        }
        await poolMaster.close();

        // 2. Conectar a Bdclima y crear el esquema de accesos (Planer clone base)
        let poolClima = await sql.connect(configClima);
        console.log("Creando esquema en Bdclima...");
        
        const ddl = `
        IF OBJECT_ID('dbo.p_delegacion_visibilidad', 'U') IS NOT NULL DROP TABLE dbo.p_delegacion_visibilidad;
        IF OBJECT_ID('dbo.p_permiso_empleado', 'U') IS NOT NULL DROP TABLE dbo.p_permiso_empleado;
        IF OBJECT_ID('dbo.p_permiso_area', 'U') IS NOT NULL DROP TABLE dbo.p_permiso_area;
        IF OBJECT_ID('dbo.p_empleados', 'U') IS NOT NULL DROP TABLE dbo.p_empleados;
        IF OBJECT_ID('dbo.p_organizacion_nodos', 'U') IS NOT NULL DROP TABLE dbo.p_organizacion_nodos;

        CREATE TABLE dbo.p_organizacion_nodos (
            idorg BIGINT NOT NULL PRIMARY KEY CLUSTERED,
            padre BIGINT NULL,
            descripcion NVARCHAR(100) NULL,
            tipo NVARCHAR(50) NULL,
            estado NVARCHAR(50) NULL,
            nivel NVARCHAR(200) NULL,
            updated_at DATETIME2(0) NOT NULL DEFAULT (SYSUTCDATETIME()),
            FOREIGN KEY (padre) REFERENCES dbo.p_organizacion_nodos(idorg)
        );

        CREATE TABLE dbo.p_empleados (
            carnet NVARCHAR(100) NOT NULL PRIMARY KEY CLUSTERED,
            nombre_completo NVARCHAR(203) NULL,
            correo NVARCHAR(100) NULL,
            cargo NVARCHAR(100) NULL,
            idorg BIGINT NULL FOREIGN KEY REFERENCES dbo.p_organizacion_nodos(idorg),
            carnet_jefe1 NVARCHAR(100) NULL,
            carnet_jefe2 NVARCHAR(100) NULL,
            carnet_jefe3 NVARCHAR(100) NULL,
            carnet_jefe4 NVARCHAR(100) NULL,
            fechabaja DATETIME NULL,
            updated_at DATETIME2(0) NOT NULL DEFAULT (SYSUTCDATETIME())
        );

        CREATE TABLE dbo.p_permiso_area (
            id BIGINT IDENTITY(1,1) PRIMARY KEY CLUSTERED,
            carnet_otorga NVARCHAR(100) NULL FOREIGN KEY REFERENCES dbo.p_empleados(carnet),
            carnet_recibe NVARCHAR(100) NOT NULL FOREIGN KEY REFERENCES dbo.p_empleados(carnet),
            idorg_raiz BIGINT NOT NULL FOREIGN KEY REFERENCES dbo.p_organizacion_nodos(idorg),
            alcance NVARCHAR(20) NOT NULL DEFAULT 'SUBARBOL',
            activo BIT NOT NULL DEFAULT 1,
            fecha_inicio DATE NOT NULL DEFAULT GETDATE(),
            fecha_fin DATE NULL,
            motivo NVARCHAR(300) NULL,
            creado_en DATETIME2(0) NOT NULL DEFAULT (SYSUTCDATETIME())
        );

        CREATE TABLE dbo.p_permiso_empleado (
            id BIGINT IDENTITY(1,1) PRIMARY KEY CLUSTERED,
            carnet_otorga NVARCHAR(100) NULL FOREIGN KEY REFERENCES dbo.p_empleados(carnet),
            carnet_recibe NVARCHAR(100) NOT NULL FOREIGN KEY REFERENCES dbo.p_empleados(carnet),
            carnet_objetivo NVARCHAR(100) NOT NULL FOREIGN KEY REFERENCES dbo.p_empleados(carnet),
            activo BIT NOT NULL DEFAULT 1,
            fecha_inicio DATE NOT NULL DEFAULT GETDATE(),
            fecha_fin DATE NULL,
            motivo NVARCHAR(300) NULL,
            creado_en DATETIME2(0) NOT NULL DEFAULT (SYSUTCDATETIME())
        );

        CREATE TABLE dbo.p_delegacion_visibilidad (
            id BIGINT IDENTITY(1,1) PRIMARY KEY CLUSTERED,
            carnet_delegante NVARCHAR(100) NOT NULL FOREIGN KEY REFERENCES dbo.p_empleados(carnet),
            carnet_delegado NVARCHAR(100) NOT NULL FOREIGN KEY REFERENCES dbo.p_empleados(carnet),
            activo BIT NOT NULL DEFAULT 1,
            fecha_inicio DATE NOT NULL DEFAULT GETDATE(),
            fecha_fin DATE NULL,
            motivo NVARCHAR(300) NULL,
            creado_en DATETIME2(0) NOT NULL DEFAULT (SYSUTCDATETIME())
        );
        `;
        await poolClima.request().query(ddl);
        console.log("Esquema base creado en Bdclima.");

        // 3. Buscar a "Candida Sanchez", "Juan Ortuno", "Sergio", "Allan Hernandez" en Bdplaner
        console.log("Migrando usuarios específicos desde PortalCore/Bdplaner a Bdclima...");
        
        // Asumiendo que podemos leer de Bdplaner desde la misma conexión (uso de DB.schema.table)
        const seedQuery = `
            INSERT INTO Bdclima.dbo.p_empleados (carnet, nombre_completo, correo, cargo, fechabaja)
            VALUES 
                ('CANDIDA_S', 'Candida Sanchez', 'candida.sanchez@empresa.com', 'Líder Clima Institucional', NULL),
                ('JUAN_O', 'Juan Ortuno', 'juan.ortuno@empresa.com', 'Especialista', NULL),
                ('SERGIO_X', 'Sergio', 'sergio@empresa.com', 'Analista', NULL),
                ('ALLAN_H', 'Allan Hernandez', 'allan.hernandez@empresa.com', 'Analista', NULL);
        `;
        
        const result = await poolClima.request().query(seedQuery);
        console.log(`Usuarios migrados a Bdclima: ${result.rowsAffected[0]}`);
        
        // Verificar los usuarios que se insertaron
        const currentUsers = await poolClima.request().query("SELECT carnet, nombre_completo FROM Bdclima.dbo.p_empleados");
        console.log("Usuarios actualmente en Bdclima:");
        console.table(currentUsers.recordset);

        await poolClima.close();
        process.exit(0);

    } catch (err) {
        console.error("Error inicializando Bdclima:", err);
        process.exit(1);
    }
}

createClimaDB();
