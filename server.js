import express from 'express';
import mongoose from 'mongoose';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// MongoDB connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/drive_links_sections';
mongoose
  .connect(mongoUri, {
    autoIndex: true
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Mongoose models
const SectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true }
  },
  { timestamps: true }
);

const LinkSchema = new mongoose.Schema(
  {
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true, index: true },
    title: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    note: { type: String, default: '', trim: true }
  },
  { timestamps: true }
);

const Section = mongoose.model('Section', SectionSchema);
const Link = mongoose.model('Link', LinkSchema);

// API routes
app.get('/api/sections', async (req, res) => {
  const sections = await Section.find().sort({ createdAt: -1 });
  res.json(sections);
});

app.post('/api/sections', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Section name is required' });
    const section = await Section.create({ name: name.trim(), description: description?.trim() || '' });
    res.status(201).json(section);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create section' });
  }
});

app.get('/api/sections/:id/links', async (req, res) => {
  const { id } = req.params;
  const links = await Link.find({ sectionId: id }).sort({ createdAt: -1 });
  res.json(links);
});

app.post('/api/sections/:id/links', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, url, note } = req.body;
    if (!title || !url) return res.status(400).json({ error: 'Title and URL are required' });
    const link = await Link.create({ sectionId: id, title: title.trim(), url: url.trim(), note: note?.trim() || '' });
    res.status(201).json(link);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create link' });
  }
});

// Delete section and all its links
app.delete('/api/sections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Link.deleteMany({ sectionId: id });
    await Section.findByIdAndDelete(id);
    res.json({ message: 'Section deleted successfully' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete section' });
  }
});

// Delete individual link
app.delete('/api/links/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Link.findByIdAndDelete(id);
    res.json({ message: 'Link deleted successfully' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete link' });
  }
});

// Static frontend
app.use(express.static(path.join(__dirname, 'public')));

// Route for view page
app.get('/view', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'view.html'));
});

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});


