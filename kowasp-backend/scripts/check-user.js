const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function checkUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Get the users collection
    const db = mongoose.connection.db;
    const users = db.collection('users');
    
    // Find the user
    const user = await users.findOne({ email: 'test@example.com' });
    
    if (user) {
      console.log('User found:');
      console.log('Email:', user.email);
      console.log('Role:', user.role);
      console.log('Password hash exists:', !!user.passwordHash);
      console.log('Password hash starts with $2b$:', user.passwordHash?.startsWith('$2b$'));
      
      // Test password comparison
      const testPassword = 'password123';
      const isMatch = await bcrypt.compare(testPassword, user.passwordHash);
      console.log('Password "password123" matches hash:', isMatch);
      
      // If password doesn't match, let's reset it
      if (!isMatch) {
        console.log('\nResetting password to "password123"...');
        const newHash = await bcrypt.hash(testPassword, 10);
        await users.updateOne(
          { email: 'test@example.com' },
          { $set: { passwordHash: newHash } }
        );
        console.log('Password reset successfully!');
      }
    } else {
      console.log('User not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkUser(); 