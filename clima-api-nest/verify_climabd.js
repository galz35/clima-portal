const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'TuPasswordFuerte!2026',
    server: '190.56.16.85',
    database: 'climabd',
    options: { encrypt: false, trustServerCertificate: true }
};

async function check() {
    try {
        let pool = await sql.connect(config);
        const result = await pool.request().query(\`
            SELECT count(*) as total_tablas FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'
        \`);
        console.log(\`Total tablas en climabd: \${result.recordset[0].total_tablas}\`);
        
        const users = await pool.request().query(\`
            IF OBJECT_ID('dbo.p_Usuarios', 'U') IS NOT NULL
                SELECT count(*) as total_usuarios FROM dbo.p_Usuarios
            ELSE
                SELECT 0 as total_usuarios
        \`);
        console.log(\`Total usuarios en climabd (p_Usuarios): \${users.recordset[0].total_usuarios}\`);

        await pool.close();
        process.exit(0);
    } catch(e) {
        console.error("Error conectando a climabd:", e.message);
        process.exit(1);
    }
}
check();
