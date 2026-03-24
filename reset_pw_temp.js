const bcrypt = require('bcryptjs');

async function main() {
  const hash = await bcrypt.hash('Axiom2024x', 12);
  console.log('HASH:' + hash);
}
main().catch(console.error);
