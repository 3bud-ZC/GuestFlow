const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'admin@guestflow.app' } });
  if (!user) {
    console.log('User not found');
    return;
  }
  
  const isValid = await bcrypt.compare('password', user.password);
  console.log('Password is "password"?', isValid);
  
  // If not, let's reset it to 'Admin123!'
  if (!isValid) {
    const newHash = await bcrypt.hash('Admin123!', 10);
    await prisma.user.update({
      where: { email: 'admin@guestflow.app' },
      data: { password: newHash }
    });
    console.log('Password reset to Admin123!');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
