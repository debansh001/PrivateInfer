const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.provider.findMany().then(providers => {
  console.log("Providers:");
  console.log(providers);
  return prisma.query.findMany();
}).then(queries => {
  console.log("Queries:");
  console.log(queries);
}).catch(console.error).finally(() => prisma.$disconnect());
