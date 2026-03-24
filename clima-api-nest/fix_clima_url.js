const sql = require('mssql');
const config = {
    user: 'sa',
    password: 'TuPasswordFuerte!2026',
    server: '190.56.16.85',
    database: 'PortalCore',
    options: { encrypt: false, trustServerCertificate: true }
};

async function updateClimaUrl() {
    try {
        let pool = await sql.connect(config);
        await pool.request().query("UPDATE AplicacionSistema SET Ruta = 'http://localhost:5178' WHERE Codigo = 'clima'");
        const result = await pool.request().query("SELECT Codigo, Nombre, Ruta, Icono FROM AplicacionSistema ORDER BY OrdenVisual");
        console.log("Apps registradas en el Portal:");
        console.table(result.recordset);
        await pool.close();
        process.exit(0);
    } catch(e) {
        console.error("Error:", e.message);
        process.exit(1);
    }
}
updateClimaUrl();
