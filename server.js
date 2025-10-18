
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';
import bcrypt from 'bcrypt';

dotenv.config();

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error("FATAL ERROR: FIREBASE_SERVICE_ACCOUNT environment variable is not set.");
    process.exit(1);
}

let serviceAccount;
try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} catch (error) {
    console.error("FATAL ERROR: Could not parse FIREBASE_SERVICE_ACCOUNT. Make sure it is a valid JSON string.");
    process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const db = admin.firestore();
const sectionsCollection = db.collection('sections');
const linksCollection = db.collection('links');
const collegesCollection = db.collection('colleges');
const saltRounds = 10;

app.post('/api/colleges/:id/view', async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ error: 'Password is required' });
        }

        const collegeDoc = await collegesCollection.doc(id).get();

        if (!collegeDoc.exists) {
            return res.status(404).json({ error: 'College not found' });
        }

        const college = collegeDoc.data();
        const passwordMatch = await bcrypt.compare(password, college.password);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        res.json({ message: 'Authentication successful' });
    } catch (e) {
        console.error('Error authenticating for view:', e);
        res.status(500).json({ error: 'Failed to authenticate for view' });
    }
});

app.get('/api/colleges', async (req, res) => {
    const { name, id } = req.query;

    try {
        if (id) {
            const collegeDoc = await collegesCollection.doc(id).get();
            if (!collegeDoc.exists) {
                return res.status(404).json({ message: 'College not found' });
            }
            const collegeData = collegeDoc.data();
            return res.json({ id: collegeDoc.id, name: collegeData.name });
        }

        if (name) {
            const snapshot = await collegesCollection
                .where('name', '>=', name)
                .where('name', '<=', name + '\uf8ff')
                .get();

            if (snapshot.empty) {
                return res.json([]);
            }

            const colleges = snapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
            }));

            return res.json(colleges);
        }
        
        return res.status(400).json({ error: 'A college name or ID is required' });

    } catch (e) {
        console.error('Error getting college(s):', e);
        res.status(500).json({ error: 'Failed to get college(s)' });
    }
});

app.post('/api/colleges', async (req, res) => {
    try {
        const { name, password } = req.body;
        if (!name || !name.trim() || !password) {
            return res.status(400).json({ error: 'College name and password are required' });
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newCollege = {
            name: name.trim(),
            password: hashedPassword,
            createdAt: new Date().toISOString(),
        };

        const docRef = await collegesCollection.add(newCollege);
        res.status(201).json({ id: docRef.id, name: newCollege.name });
    } catch (e) {
        res.status(500).json({ error: 'Failed to create college' });
    }
});

app.post('/api/colleges/:id/join', async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ error: 'Password is required' });
        }

        const collegeDoc = await collegesCollection.doc(id).get();

        if (!collegeDoc.exists) {
            return res.status(404).json({ error: 'College not found' });
        }

        const college = collegeDoc.data();
        const passwordMatch = await bcrypt.compare(password, college.password);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        const isAdmin = true;

        res.json({ message: 'Successfully joined college', collegeId: id, isAdmin });
    } catch (e) {
        console.error('Error joining college:', e);
        res.status(500).json({ error: 'Failed to join college' });
    }
});

app.get('/api/colleges/:collegeId/sections', async (req, res) => {
    try {
        const { collegeId } = req.params;
        const snapshot = await sectionsCollection.where('collegeId', '==', collegeId).get();
        const sections = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(sections);
    } catch (e) {
        console.error('Error fetching sections:', e);
        res.status(500).json({ error: 'Failed to fetch sections' });
    }
});

app.post('/api/colleges/:collegeId/sections', async (req, res) => {
    try {
        const { collegeId } = req.params;
        const { name, description } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ error: 'Section name is required' });

        const newSection = {
            collegeId,
            name: name.trim(),
            description: description?.trim() || '',
            createdAt: new Date().toISOString()
        };
        const docRef = await sectionsCollection.add(newSection);
        res.status(201).json({ id: docRef.id, ...newSection });
    } catch (e) {
        res.status(500).json({ error: 'Failed to create section' });
    }
});

app.get('/api/sections/:sectionId/links', async (req, res) => {
    try {
        const { sectionId } = req.params;
        const snapshot = await linksCollection.where('sectionId', '==', sectionId).orderBy('createdAt', 'desc').get();
        const links = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(links);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch links' });
    }
});

app.post('/api/sections/:sectionId/links', async (req, res) => {
    try {
        const { sectionId } = req.params;
        const { title, url, note } = req.body;
        if (!title || !url) return res.status(400).json({ error: 'Title and URL are required' });

        const newLink = {
            sectionId,
            title: title.trim(),
            url: url.trim(),
            note: note?.trim() || '',
            createdAt: new Date().toISOString()
        };
        const docRef = await linksCollection.add(newLink);
        res.status(201).json({ id: docRef.id, ...newLink });
    } catch (e) {
        res.status(500).json({ error: 'Failed to create link' });
    }
});

app.delete('/api/sections/:sectionId', async (req, res) => {
    try {
        const { sectionId } = req.params;
        const linksSnapshot = await linksCollection.where('sectionId', '==', sectionId).get();
        const batch = db.batch();
        linksSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        await sectionsCollection.doc(sectionId).delete();
        res.json({ message: 'Section deleted successfully' });
    } catch (e) {
        res.status(500).json({ error: 'Failed to delete section' });
    }
});

app.delete('/api/links/:linkId', async (req, res) => {
    try {
        const { linkId } = req.params;
        await linksCollection.doc(linkId).delete();
        res.json({ message: 'Link deleted successfully' });
    } catch (e) {
        res.status(500).json({ error: 'Failed to delete link' });
    }
});

// Static frontend
app.use(express.static(path.join(__dirname, 'public')));

app.get('/college/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/view', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'view.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'college.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
});
