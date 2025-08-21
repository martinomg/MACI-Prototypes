require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

module.exports = {
    // extends: ['./directus-sync.config.base.js'],
    debug: true,
    directusUrl: process.env.DIRECTUS_URL || 'http://0.0.0.0:17777',
    directusEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
    directusPassword: process.env.ADMIN_PASSWORD || 'd1r3ctu5',
    split: true,
    dumpPath: './directus-config',
    collectionsPath: 'collections',
    snapshotPath: 'snapshot',
};