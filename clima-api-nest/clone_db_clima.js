const sql = require('mssql');

const configMaster = {
    user: 'sa',
    password: 'TuPasswordFuerte!2026',
    server: '190.56.16.85',
    database: 'master',
    options: { encrypt: false, trustServerCertificate: true }
};

async function cloneDB() {
    try {
        let pool = await sql.connect(configMaster);
        
        console.log('1. Sacando backup de Bdplaner...');
        // Respaldar a un archivo local temporal en el servidor de BDD
        // (Asumimos que C:\temp existe en el servidor 190.56.16.85 o linux /tmp)
        // Probémos con C:\bdplaner.bak si es Windows, o dejémoslo en el default backup dir si solo damos el nombre.
        
        // Mejor conseguir la ruta del default backup:
        const backupDir = (await pool.request().query(\`
            SELECT SERVERPROPERTY('instancedefaultdatapath') AS dp, SERVERPROPERTY('instancedefaultlogpath') as lp
        \`)).recordset[0];
        
        const backupPath = "Bdplaner_copy.bak";
        await pool.request().query(\`BACKUP DATABASE Bdplaner TO DISK = '\${backupPath}' WITH INIT\`);
        
        console.log('2. Obteniendo nombres lógicos...');
        const fileList = await pool.request().query(\`RESTORE FILELISTONLY FROM DISK = '\${backupPath}'\`);
        
        const dataLogical = fileList.recordset.find(f => f.Type === 'D').LogicalName;
        const logLogical = fileList.recordset.find(f => f.Type === 'L').LogicalName;
        
        // Usar los paths por defecto de master pero cambiando nombres
        const dataPath = backupDir.dp + 'Bdclima.mdf';
        const logPath = backupDir.lp + 'Bdclima_log.ldf';
        
        console.log('3. Restaurando como Bdclima...');
        await pool.request().query(\`
            ALTER DATABASE Bdclima SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
            DROP DATABASE Bdclima;
        \`).catch(e => console.log('Bdclima no existía o no se pudo hacer drop rápido.'));

        await pool.request().query(\`
            RESTORE DATABASE Bdclima FROM DISK = '\${backupPath}'
            WITH 
                MOVE '\${dataLogical}' TO '\${dataPath}',
                MOVE '\${logLogical}' TO '\${logPath}',
                REPLACE
        \`);

        console.log('4. Limpiando datos de Bdclima (dejando solo los 4 usuarios pedidos)...');
        // Aquí conectamos a Bdclima y limpiamos
        await pool.close();
        
        const configClima = { ...configMaster, database: 'Bdclima'};
        const poolClima = await sql.connect(configClima);
        
        // Eliminar a todos excepto los 4
        const deleteUsuarios = \`
            -- Desactivar FKs temporalmente o eliminar en cascada
            EXEC sp_MSforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT ALL'
            
            -- Borramos usuarios que NO sean Cándida, Juan Ortuno, Sergio, Allan
            DELETE FROM dbo.p_Usuarios
            WHERE nombre IS NOT NULL 
              AND nombreCompleto NOT LIKE '%Candida Sanchez%'
              AND nombreCompleto NOT LIKE '%Juan Ortuno%'
              AND nombreCompleto NOT LIKE '%Juan Ortuño%'
              AND LOWER(nombreCompleto) NOT IN ('sergio')
              AND nombreCompleto NOT LIKE '%Allan Hernandez%'
              AND nombreCompleto NOT LIKE '%Alan Hernandez%';
              
            DELETE FROM dbo.p_empleados
            WHERE nombre_completo IS NOT NULL 
              AND nombre_completo NOT LIKE '%Candida Sanchez%'
              AND nombre_completo NOT LIKE '%Juan Ortuno%'
              AND nombre_completo NOT LIKE '%Juan Ortuño%'
              AND LOWER(nombre_completo) NOT IN ('sergio')
              AND nombre_completo NOT LIKE '%Allan Hernandez%'
              AND nombre_completo NOT LIKE '%Alan Hernandez%';

            -- Opcionalmente truncar auditorias y tareas (si se desea empezar limpio)
            -- TRUNCATE TABLE dbo.p_Tareas;
            -- TRUNCATE TABLE dbo.p_Auditoria;
            
            EXEC sp_MSforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL'
        \`;
        
        await poolClima.request().query(deleteUsuarios);
        console.log('Migración completa. Bdclima clonada y limpia.');

        await poolClima.close();
        process.exit(0);

    } catch (err) {
        console.error('Error detallado:', err);
        process.exit(1);
    }
}

cloneDB();
