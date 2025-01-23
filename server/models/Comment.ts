import { Schema, model, Types, Document } from 'mongoose';

export interface IComment extends Document {
  content: string;
  user: Types.ObjectId;
  post: Types.ObjectId;
  likes: Types.ObjectId[];
  dislikes: Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}

const commentSchema = new Schema<IComment>(
  {
    content: { type: String, required: true, trim: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    dislikes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

export default model<IComment>('Comment', commentSchema);
