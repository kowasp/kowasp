import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kowasp';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function main() {
  await mongoose.connect(MONGODB_URI);
  const email = 'test@example.com';
  const password = 'test1234';
  const role = 'user';
  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Test user already exists:', email);
    await mongoose.disconnect();
    return;
  }

  await User.create({ email, passwordHash, role });
  console.log('Test user created:', email, 'password:', password);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Error populating test user:', err);
  process.exit(1);
}); 