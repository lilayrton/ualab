import { Sequelize } from 'sequelize';

const dialect = process.env.DB_DIALECT;
const options = { dialect, logging: false };

if (dialect === 'sqlite') {
    options.storage = process.env.DB_STORAGE;
} else {
    options.host = process.env.DB_HOST;
    options.port = Number(process.env.DB_PORT);
    options.database = process.env.DB_NAME;
    options.username = process.env.DB_USER;
    options.password = process.env.DB_PASSWORD;

    if (dialect === 'mssql') {
        options.dialectOptions = {
            encrypt: process.env.DB_ENCRYPT === 'true',
            trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true'
        };
    }

    if (dialect === 'postgres' && process.env.DB_SSL === 'true') {
        options.dialectOptions = { ssl: { require: true, rejectUnauthorized: false } };
    }
}

const sequelize = new Sequelize(options);
export default sequelize;