import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kowasp';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function main() {
  await mongoose.connect(MONGODB_URI);
  const email = 'admin@kowasp.com';
  const password = 'admin1234';
  const role = 'admin';
  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Admin user already exists:', email);
    await mongoose.disconnect();
    return;
  }

  await User.create({ email, passwordHash, role });
  console.log('Admin user created:', email, 'password:', password);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Error creating admin user:', err);
  process.exit(1);
}); 
