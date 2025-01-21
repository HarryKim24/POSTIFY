import { Schema, model, Types, Document } from 'mongoose';

export interface IComment extends Document {
  content: string;
  user: Types.ObjectId;
  post: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const commentSchema = new Schema<IComment>(
  {
    content: { type: String, required: true, trim: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  },
  { timestamps: true }
);

const Comment = model<IComment>('Comment', commentSchema);
export default Comment;
