import { Sequelize } from 'sequelize';

export async function createDatabaseIfNotExists() {
    if (process.env.DB_AUTO_CREATE !== 'true') {
        return false;
    }

    const dialect = process.env.DB_DIALECT;
    const name = process.env.DB_NAME;

    if (dialect === 'sqlite') {
        return false;
    }

    if (!name) {
        throw new Error('[createDatabaseIfNotExists] DB_AUTO_CREATE=true requiere DB_NAME');
    }

    const base = {
        dialect,
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        logging: false
    };

    let bootName = '';

    if (dialect === 'mssql') {
        bootName = 'master';
    } else if (dialect === 'postgres') {
        bootName = 'postgres';
    }

    const bootOptions = { ...base, database: bootName || undefined };
    
    if (dialect === 'mssql') {
        bootOptions.dialectOptions = {
            encrypt: process.env.DB_ENCRYPT === 'true',
            trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true'
        };
    }

    if ((dialect === 'mysql' || dialect === 'mariadb') && bootName === '') {
        // conecta a la instancia sin DB específica
    }

    const boot = new Sequelize(bootOptions);
    await boot.authenticate();

    try {
        if (dialect === 'mssql') {
            await boot.query(`IF DB_ID(N'${name}') IS NULL CREATE DATABASE [${name}];`);
        } else if (dialect === 'mysql' || dialect === 'mariadb') {
            await boot.query(`CREATE DATABASE IF NOT EXISTS \`${name}\`;`);
        } else if (dialect === 'postgres') {
            const [rows] = await boot.query(
                `SELECT 1 FROM pg_database WHERE datname = '${name}'`
            );

            if (rows.length === 0) {
                await boot.query(`CREATE DATABASE "${name}";`);
            }
        } else {
            console.warn(`[createDatabaseIfNotExists] dialecto '${dialect}' sin bootstrap automático`);
        }

        console.log(`[createDatabaseIfNotExists] DB '${name}' verificada (${dialect})`);
    } finally {
        await boot.close();
    }
    
    return true;
}
