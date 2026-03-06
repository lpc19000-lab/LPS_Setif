
const { PrismaClient, OrderStatus } = require('@prisma/client');
console.log('OrderStatus:', OrderStatus);
const prisma = new PrismaClient();
console.log('PrismaClient initialized');
process.exit(0);
