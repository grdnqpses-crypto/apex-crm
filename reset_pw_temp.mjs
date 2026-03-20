import bcrypt from 'bcryptjs';

const hash = await bcrypt.hash('Apex2024x', 12);
console.log('HASH:' + hash);
