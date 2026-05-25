const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    // Opzionale: mostra le query SQL generate da Prisma nel terminale
    log: ['query', 'info', 'warn', 'error'],
});

module.exports = prisma;