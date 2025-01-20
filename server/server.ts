import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes'; 
import postRoutes from './routes/postRoutes';
// import commentRoutes from './routes/commentRoutes';
import uploadRoutes from './routes/uploadRoutes'; 
import path from 'path';

dotenv.config();

const app = express();

app.use(
  cors({
    origin: 'http://localhost:5173', 
    credentials: true,
  })
);

app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.DB_URI || '';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
// app.use('/api/comments', commentRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/', (req, res) => {
  res.send('서버가 실행 중입니다...');
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
