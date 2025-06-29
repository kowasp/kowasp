const bcrypt = require('bcrypt');

async function testBcrypt() {
  const password = 'password123';
  
  console.log('Testing bcrypt hashing and comparison...');
  console.log('Password:', password);
  
  // Hash the password
  const salt = await bcrypt.genSalt();
  const hash = await bcrypt.hash(password, salt);
  
  console.log('Generated hash:', hash);
  console.log('Hash starts with $2b$:', hash.startsWith('$2b$'));
  
  // Test comparison
  const isMatch = await bcrypt.compare(password, hash);
  console.log('Password matches hash:', isMatch);
  
  // Test with wrong password
  const wrongMatch = await bcrypt.compare('wrongpassword', hash);
  console.log('Wrong password matches hash:', wrongMatch);
}

testBcrypt().catch(console.error); 