const PG_PASSWORD = process.env.PG_PASSWORD || 'postgres';
const PG_USER = process.env.PG_USER || 'postgres';
const PG_HOST = process.env.PG_HOST || 'localhost';
const PG_DB = process.env.PG_DB || 'db';



module.exports = {
    PG_PASSWORD,
    PG_HOST,
    PG_USER,
    PG_DB,
};
