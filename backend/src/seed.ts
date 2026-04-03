import * as mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/engineering-management';

const UserSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: { type: String, unique: true, lowercase: true },
    password: String,
    role: { type: String, enum: ['SUPERADMIN', 'ADMIN', 'MEMBER'], default: 'MEMBER' },
    isActive: { type: Boolean, default: true },
    projects: { type: [String], default: [] },
  },
  { timestamps: true },
);

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const UserModel = mongoose.model('User', UserSchema);

  const existing = await UserModel.findOne({ email: 'admin@example.com' });
  if (existing) {
    console.log('✅ Superadmin already exists, skipping seed.');
    await mongoose.disconnect();
    return;
  }

  const hashedPassword = await bcrypt.hash('Admin@123', 12);
  await UserModel.create({
    firstName: 'Super',
    lastName: 'Admin',
    email: 'admin@example.com',
    password: hashedPassword,
    role: 'SUPERADMIN',
    isActive: true,
  });

  console.log('✅ Superadmin created successfully');
  console.log('   Email:    admin@example.com');
  console.log('   Password: Admin@123');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
