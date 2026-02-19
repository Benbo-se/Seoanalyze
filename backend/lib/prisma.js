// Prisma Client Singleton for Next.js
// Detta förhindrar flera instanser i development med hot reload

const { PrismaClient } = require('@prisma/client');

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
} else {
  // I development, använd global för att överleva hot reload
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  prisma = global.prisma;
}

// Kontrollera om databas är aktiverad
const isDatabaseEnabled = process.env.ENABLE_DATABASE === 'true';

// Exportera både client och status
module.exports = {
  prisma: isDatabaseEnabled ? prisma : null,
  isDatabaseEnabled
};