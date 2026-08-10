const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function main() {
  const pool = new Pool({ connectionString: 'postgresql://guestflow_prod:5bf905f06c3d1e02823767df@localhost:5432/guestflow_prod' });
  const hash = await bcrypt.hash('password', 10);
  await pool.query('UPDATE "User" SET password = $1 WHERE email = $2', [hash, 'admin@guestflow.app']);
  console.log('Password reset successfully');
  await pool.end();
}

main().catch(console.error);
