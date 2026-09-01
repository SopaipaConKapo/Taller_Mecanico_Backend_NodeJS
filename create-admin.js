const { PrismaClient } = require('@prisma/workshop-client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function createAdmin() {
  const hashedPassword = await bcrypt.hash('passwordSegura123', 10);
  await prisma.usuario.upsert({
    where: { email: 'admin@tallersaas.com' },
    update: { rol: 'ADMIN', password: hashedPassword },
    create: {
      email: 'admin@tallersaas.com',
      password: hashedPassword,
      nombre: 'Administrador Principal',
      rol: 'ADMIN'
    }
  });
  console.log('ADMIN creado en la DB.');
}

createAdmin().catch(console.error).finally(() => prisma.$disconnect());
