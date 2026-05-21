require('dotenv').config();

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./db');
const { upload, cloudinary } = require('./cloudinary');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.set('trust proxy', 1);

app.use(session({
  secret: process.env.SESSION_SECRET || 'travel-diary-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

// ─── AUTH ROUTES ──────────────────────────────────────────────────────────────

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const [existing] = await db.query(
      'SELECT user_id FROM users WHERE email = ? OR name = ?',
      [email, username]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [username, email, hashed]
    );

    req.session.userId = result.insertId;
    req.session.username = username;

    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'Session error' });
      }
      res.json({ success: true, userId: result.insertId, username });
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.userId = user.user_id;
    req.session.username = user.name;

    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'Session error' });
      }
      res.json({ success: true, userId: user.user_id, username: user.name });
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.json({ success: true });
  });
});

// Get current user
app.get('/api/me', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT user_id, name, email, phone, created_at FROM users WHERE user_id = ?',
      [req.session.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── TRIPS ROUTES ─────────────────────────────────────────────────────────────

// Get all trips
app.get('/api/trips', requireAuth, async (req, res) => {
  try {
    const [trips] = await db.query(
      `SELECT t.*,
        (SELECT COUNT(*) FROM places WHERE trip_id = t.id AND user_id = t.user_id) AS place_count,
        (SELECT COUNT(*) FROM photos WHERE trip_id = t.id AND user_id = t.user_id) AS photo_count
       FROM trips t
       WHERE t.user_id = ?
       ORDER BY t.created_at DESC`,
      [req.session.userId]
    );

    res.json(trips);
  } catch (err) {
    console.error('Get trips error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single trip
app.get('/api/trips/:id', requireAuth, async (req, res) => {
  try {
    const [trips] = await db.query(
      'SELECT * FROM trips WHERE id = ? AND user_id = ?',
      [req.params.id, req.session.userId]
    );

    if (trips.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const [places] = await db.query(
      'SELECT * FROM places WHERE trip_id = ? AND user_id = ? ORDER BY visit_date ASC, created_at DESC',
      [req.params.id, req.session.userId]
    );

    const [photos] = await db.query(
      'SELECT * FROM photos WHERE trip_id = ? AND user_id = ? ORDER BY created_at DESC',
      [req.params.id, req.session.userId]
    );

    res.json({ ...trips[0], places, photos });
  } catch (err) {
    console.error('Get trip error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create trip
app.post('/api/trips', requireAuth, upload.single('cover_photo'), async (req, res) => {
  try {
    const { title, description, start_date, end_date, status } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title required' });
    }

    const cover_photo = req.file ? req.file.path : null;

    const [result] = await db.query(
      `INSERT INTO trips (user_id, title, description, start_date, end_date, cover_photo, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.session.userId,
        title,
        description || null,
        start_date || null,
        end_date || null,
        cover_photo,
        status || 'planned'
      ]
    );

    res.json({ success: true, tripId: result.insertId });
  } catch (err) {
    console.error('Create trip error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update trip
app.put('/api/trips/:id', requireAuth, upload.single('cover_photo'), async (req, res) => {
  try {
    const { title, description, start_date, end_date, status } = req.body;

    const fields = { title, description, start_date, end_date, status };
    if (req.file) {
      fields.cover_photo = req.file.path;
    }

    const filteredKeys = Object.keys(fields).filter((key) => fields[key] !== undefined);

    if (filteredKeys.length === 0) {
      return res.status(400).json({ error: 'No fields provided to update' });
    }

    const sets = filteredKeys.map((key) => `${key} = ?`).join(', ');
    const values = [...filteredKeys.map((key) => fields[key]), req.params.id, req.session.userId];

    await db.query(
      `UPDATE trips SET ${sets} WHERE id = ? AND user_id = ?`,
      values
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Update trip error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete trip
app.delete('/api/trips/:id', requireAuth, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM trips WHERE id = ? AND user_id = ?',
      [req.params.id, req.session.userId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Delete trip error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── PLACES ROUTES ────────────────────────────────────────────────────────────

// Get places for a trip
app.get('/api/trips/:tripId/places', requireAuth, async (req, res) => {
  try {
    const [places] = await db.query(
      `SELECT p.*,
        (SELECT COUNT(*) FROM photos WHERE place_id = p.id AND user_id = p.user_id) AS photo_count
       FROM places p
       WHERE p.trip_id = ? AND p.user_id = ?
       ORDER BY p.visit_date ASC, p.created_at DESC`,
      [req.params.tripId, req.session.userId]
    );

    res.json(places);
  } catch (err) {
    console.error('Get trip places error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all places
app.get('/api/places', requireAuth, async (req, res) => {
  try {
    const [places] = await db.query(
      `SELECT p.*, t.title AS trip_title
       FROM places p
       LEFT JOIN trips t ON p.trip_id = t.id
       WHERE p.user_id = ?
       ORDER BY p.visit_date DESC, p.created_at DESC`,
      [req.session.userId]
    );

    res.json(places);
  } catch (err) {
    console.error('Get places error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add place to trip
app.post('/api/trips/:tripId/places', requireAuth, async (req, res) => {
  try {
    const { name, description, latitude, longitude, address, visit_date, rating } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Place name required' });
    }

    const [result] = await db.query(
      `INSERT INTO places (trip_id, user_id, name, description, latitude, longitude, address, visit_date, rating)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.params.tripId,
        req.session.userId,
        name,
        description || null,
        latitude || null,
        longitude || null,
        address || null,
        visit_date || null,
        rating || null
      ]
    );

    res.json({ success: true, placeId: result.insertId });
  } catch (err) {
    console.error('Add place error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete place
app.delete('/api/places/:id', requireAuth, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM places WHERE id = ? AND user_id = ?',
      [req.params.id, req.session.userId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Delete place error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── PHOTOS ROUTES ────────────────────────────────────────────────────────────

// Get all photos
app.get('/api/photos', requireAuth, async (req, res) => {
  try {
    const [photos] = await db.query(
      `SELECT ph.*, t.title AS trip_title, p.name AS place_name
       FROM photos ph
       LEFT JOIN trips t ON ph.trip_id = t.id
       LEFT JOIN places p ON ph.place_id = p.id
       WHERE ph.user_id = ?
       ORDER BY ph.created_at DESC`,
      [req.session.userId]
    );

    res.json(photos);
  } catch (err) {
    console.error('Get photos error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get photos for a trip
app.get('/api/trips/:tripId/photos', requireAuth, async (req, res) => {
  try {
    const [photos] = await db.query(
      'SELECT * FROM photos WHERE trip_id = ? AND user_id = ? ORDER BY created_at DESC',
      [req.params.tripId, req.session.userId]
    );

    res.json(photos);
  } catch (err) {
    console.error('Get trip photos error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload photos (Cloudinary)
app.post('/api/trips/:tripId/photos', requireAuth, upload.array('photos', 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const { place_id, caption, latitude, longitude } = req.body;
    const inserted = [];

    for (const file of req.files) {
      const filename = file.path; // Cloudinary URL

      const [result] = await db.query(
        `INSERT INTO photos (trip_id, place_id, user_id, filename, caption, latitude, longitude)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          req.params.tripId,
          place_id || null,
          req.session.userId,
          filename,
          caption || null,
          latitude || null,
          longitude || null
        ]
      );

      inserted.push({ id: result.insertId, filename });
    }

    res.json({ success: true, photos: inserted });
  } catch (err) {
    console.error('Upload photos error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete photo (also removes from Cloudinary)
app.delete('/api/photos/:id', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM photos WHERE id = ? AND user_id = ?',
      [req.params.id, req.session.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Delete from Cloudinary
    const imageUrl = rows[0].filename;
    if (imageUrl && imageUrl.includes('cloudinary')) {
      const parts = imageUrl.split('/');
      const publicId = parts.slice(-2).join('/').replace(/\.[^/.]+$/, '');
      await cloudinary.uploader.destroy(publicId);
    }

    await db.query(
      'DELETE FROM photos WHERE id = ? AND user_id = ?',
      [req.params.id, req.session.userId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Delete photo error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── LOCATIONS ROUTE ──────────────────────────────────────────────────────────

app.get('/api/locations', requireAuth, async (req, res) => {
  try {
    const [locations] = await db.query(
      `SELECT DISTINCT address, latitude, longitude, name, visit_date, trip_id
       FROM places
       WHERE user_id = ?
       ORDER BY visit_date DESC, created_at DESC`,
      [req.session.userId]
    );

    res.json(locations);
  } catch (err) {
    console.error('Get locations error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── STATS ROUTE ──────────────────────────────────────────────────────────────

app.get('/api/stats', requireAuth, async (req, res) => {
  try {
    const uid = req.session.userId;

    const [[{ trips }]] = await db.query(
      'SELECT COUNT(*) AS trips FROM trips WHERE user_id = ?', [uid]
    );
    const [[{ places }]] = await db.query(
      'SELECT COUNT(*) AS places FROM places WHERE user_id = ? AND visit_date IS NOT NULL', [uid]
    );
    const [[{ photos }]] = await db.query(
      'SELECT COUNT(*) AS photos FROM photos WHERE user_id = ?', [uid]
    );
    const [[{ locations }]] = await db.query(
      `SELECT COUNT(DISTINCT
          CASE
            WHEN address IS NOT NULL AND address != '' THEN address
            ELSE CONCAT(IFNULL(latitude, ''), ',', IFNULL(longitude, ''))
          END
        ) AS locations
       FROM places WHERE user_id = ?`,
      [uid]
    );

    res.json({ trips, places, photos, locations });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err.message || 'Server error' });
});

// ─── SPA FALLBACK ─────────────────────────────────────────────────────────────

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── START SERVER ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🌍 Travel Diary running at http://localhost:${PORT}\n`);
});