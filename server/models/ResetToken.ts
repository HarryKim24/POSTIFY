import { Schema, model, Document, Types } from 'mongoose';

export interface IResetToken extends Document {
  token: string;
  user: Types.ObjectId;
  expiresAt: Date;
}

const resetTokenSchema = new Schema<IResetToken>({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

const ResetToken = model<IResetToken>('ResetToken', resetTokenSchema);
export default ResetToken;
