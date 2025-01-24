import mongoose, { Schema, model, Document, Types } from 'mongoose';

export interface IPost extends Document {
  title: string;
  content: string;
  imageUrl?: string;
  user: Types.ObjectId;
  likes: Types.ObjectId[];
  dislikes: Types.ObjectId[];
  comments: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000, 
    },
    imageUrl: {
      type: String,
      default: null,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
    dislikes: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
    comments: [{ type: Schema.Types.ObjectId, ref: 'Comment', default: [] }],
  },
  { timestamps: true }
);

postSchema.pre(/^find/, function (next) {
  const doc = this as mongoose.Query<any, IPost>;
  doc.populate({
    path: 'user',
    select: 'username profileImage',
  }).populate({
    path: 'comments',
    populate: {
      path: 'user',
      select: 'username profileImage',
    },
  });
  next();
});


export default model<IPost>('Post', postSchema);
