import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  hash: { type: String, required: true, unique: true },
});

const Image = mongoose.model('Image', imageSchema);
export default Image;
