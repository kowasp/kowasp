import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kowasp';

// User schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true });
const User = mongoose.model('User', userSchema);

// Project schema
const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  repositoryUrl: { type: String, required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });
const Project = mongoose.model('Project', projectSchema);

// Scan schema
const scanSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  status: { type: String, enum: ['queued', 'running', 'completed', 'failed'], default: 'queued', required: true },
  results: { type: Object },
  completedAt: { type: Date },
}, { timestamps: true });
const Scan = mongoose.model('Scan', scanSchema);

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB. Dropping collections...');
  await Promise.all([
    User.deleteMany({}),
    Project.deleteMany({}),
    Scan.deleteMany({}),
  ]);
  console.log('Collections dropped. Seeding data...');

  // Create admin user
  const adminEmail = 'admin@kowasp.com';
  const adminPassword = 'admin1234';
  const adminHash = await bcrypt.hash(adminPassword, 10);
  const admin = await User.create({ email: adminEmail, passwordHash: adminHash, role: 'admin' });

  // Create test user
  const testEmail = 'test@example.com';
  const testPassword = 'test1234';
  const testHash = await bcrypt.hash(testPassword, 10);
  const testUser = await User.create({ email: testEmail, passwordHash: testHash, role: 'user' });

  // Create example project (owned by admin)
  const project = await Project.create({
    name: 'Example Project',
    repositoryUrl: 'https://github.com/example/repo',
    ownerId: admin._id,
  });

  // Create example scan for the project
  await Scan.create({
    projectId: project._id,
    status: 'completed',
    results: { summary: 'No vulnerabilities found.' },
    completedAt: new Date(),
  });

  console.log('Seeded users:');
  console.log(`  Admin: ${adminEmail} / ${adminPassword}`);
  console.log(`  Test:  ${testEmail} / ${testPassword}`);
  console.log('Seeded project: Example Project');
  console.log('Seeded scan: completed for Example Project');

  await mongoose.disconnect();
  console.log('Database migration and seeding complete.');
}

main().catch((err) => {
  console.error('Error during migration:', err);
  process.exit(1);
}); 
