const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'items.json');
const IMAGES_DIR = path.join(__dirname, 'public', 'images');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, IMAGES_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Ensure data directory and file exist
async function initializeDataFile() {
    try {
        await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
        await fs.mkdir(IMAGES_DIR, { recursive: true });
        try {
            await fs.access(DATA_FILE);
        } catch {
            // File doesn't exist, create with empty array
            await fs.writeFile(DATA_FILE, '[]');
        }
    } catch (error) {
        console.error('Error initializing data file:', error);
    }
}

initializeDataFile();

// Helper function to read items
async function readItems() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// Helper function to write items
async function writeItems(items) {
    await fs.writeFile(DATA_FILE, JSON.stringify(items, null, 2));
}

// Routes

// GET all items
app.get('/api/items', async (req, res) => {
    try {
        const items = await readItems();
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: 'Error reading items' });
    }
});

// GET single item
app.get('/api/items/:id', async (req, res) => {
    try {
        const items = await readItems();
        const item = items.find(i => i.id === parseInt(req.params.id));
        if (item) {
            res.json(item);
        } else {
            res.status(404).json({ error: 'Item not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error reading items' });
    }
});

// POST new item
app.post('/api/items', upload.single('image'), async (req, res) => {
    try {
        const items = await readItems();
        const imagePath = req.file ? `/images/${req.file.filename}` : '';
        
        const newItem = {
            id: items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1,
            name: req.body.name,
            quantity: parseInt(req.body.quantity) || 0,
            price: parseFloat(req.body.price) || 0,
            category: req.body.category || 'Uncategorized',
            description: req.body.description || '',
            image: imagePath,
            createdAt: new Date().toISOString()
        };
        
        items.push(newItem);
        await writeItems(items);
        res.status(201).json(newItem);
    } catch (error) {
        res.status(500).json({ error: 'Error creating item' });
    }
});

// PUT update item
app.put('/api/items/:id', upload.single('image'), async (req, res) => {
    try {
        const items = await readItems();
        const index = items.findIndex(i => i.id === parseInt(req.params.id));
        
        if (index !== -1) {
            const imagePath = req.file ? `/images/${req.file.filename}` : items[index].image;
            
            items[index] = {
                ...items[index],
                name: req.body.name || items[index].name,
                quantity: parseInt(req.body.quantity) || items[index].quantity,
                price: parseFloat(req.body.price) || items[index].price,
                category: req.body.category || items[index].category,
                description: req.body.description || items[index].description,
                image: imagePath,
                updatedAt: new Date().toISOString()
            };
            
            await writeItems(items);
            res.json(items[index]);
        } else {
            res.status(404).json({ error: 'Item not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error updating item' });
    }
});

// DELETE item
app.delete('/api/items/:id', async (req, res) => {
    try {
        const items = await readItems();
        const filteredItems = items.filter(i => i.id !== parseInt(req.params.id));
        
        if (filteredItems.length < items.length) {
            await writeItems(filteredItems);
            res.json({ message: 'Item deleted successfully' });
        } else {
            res.status(404).json({ error: 'Item not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error deleting item' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});