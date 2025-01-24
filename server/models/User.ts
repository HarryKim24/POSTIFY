import { Schema, model, Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  password: string;
  profileImage?: {
    url: string;
    public_id: string;
  } | null;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    profileImage: {
      type: {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
      default: null,
    },
  },
  { timestamps: true }
);

const User = model<IUser>('User', userSchema);
export default User;
