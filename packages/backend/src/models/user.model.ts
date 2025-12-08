import mongoose, { Schema, Document } from "mongoose";

// ============================================
// User Schema
// ============================================

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String }
  },
  {
    timestamps: true
  }
);

// Indexes
UserSchema.index({ email: 1 });

export const User = mongoose.model<IUser>("User", UserSchema);

// ============================================
// User Repository
// ============================================

export class UserRepository {
  async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase() });
  }

  async create(data: { name: string; email: string; phone?: string }): Promise<IUser> {
    const user = new User(data);
    return user.save();
  }

  async update(id: string, data: Partial<IUser>): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, data, { new: true });
  }

  async findOrCreate(email: string, name: string): Promise<IUser> {
    let user = await this.findByEmail(email);
    if (!user) {
      user = await this.create({ name, email });
    }
    return user;
  }
}

