// Variables de entorno para los tests, siempre ANTES de importar la app.
// Se usa una base SQLite descartable y se afloja el rate limiting para que las suites no se corten solas.
process.env.NODE_ENV = 'test';
process.env.DB_TYPE = 'sql';
process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = './test-ualab.sqlite';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.RESET_SECRET = 'test-reset-secret';
process.env.SITE_URL = 'http://localhost:3000';
process.env.INQUIRY_RATE_LIMIT_MAX = '1000';
process.env.INQUIRY_RATE_LIMIT_WINDOW_MS = '86400000';
process.env.AUTH_RATE_LIMIT_MAX = '1000';
process.env.AUTH_RATE_LIMIT_WINDOW_MS = '86400000';
// Origen fijo de desarrollo para testear la allowlist de CORS en las suites
process.env.CORS_ORIGIN = 'http://localhost:5173,http://localhost:3000';