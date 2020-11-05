const express = require('express');
const cors = require('cors');
const client = require('./client.js');
const app = express();
const morgan = require('morgan');
const ensureAuth = require('./auth/ensure-auth');
const createAuthRoutes = require('./auth/create-auth-routes');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev')); // http logging

const authRoutes = createAuthRoutes();

// setup authentication routes to give user an auth token
// creates a /auth/signin and a /auth/signup POST route. 
// each requires a POST body with a .email and a .password
app.use('/auth', authRoutes);

// everything that starts with "/api" below here requires an auth token!
app.use('/api', ensureAuth);

// and now every request that has a token in the Authorization header will have a `req.userId` property for us to see who's talking
app.get('/api/test', (req, res) => {
  res.json({
    message: `in this proctected route, we get the user's id like so: ${req.userId}`
  });
});

app.get('/artists', async(req, res) => {
  try {
    const data = await client.query(`
    SELECT 
      artists.id, 
      artists.name, 
      artists.first_album, 
      artists.on_tour,
      artists.owner_id,
      genres.name as genre
    from artists
    JOIN genres
    ON genres.id = artists.genre_id
    `);
    // ORDER BY genres.name ASC
    
    res.json(data.rows);
  } catch(e) {
    
    res.status(500).json({ error: e.message });
  }
});

app.get('/genres', async(req, res) => {
  try {
    const data = await client.query('SELECT * from genres');
    
    res.json(data.rows);
  } catch(e) {
    
    res.status(500).json({ error: e.message });
  }
});

app.get('/artists/:id', async(req, res) => {
  try {
    const artistId = req.params.id;
    // does this need to be snake case?
    const data = await client.query(`
    SELECT * FROM artists
    WHERE artists.id=$1`,
    // needed the backticks for this. was that because of $1?
    [artistId]);
    
    res.json(data.rows[0]);
  } catch(e) {
    
    res.status(500).json({ error: e.message });
  }
});

app.post('/artists', async(req, res) => {
  try {
    const addArtist = req.body.name;
    const addAlbum = req.body.first_album;
    const addTourStatus = req.body.on_tour;
    const addGenreId = req.body.genre_id;
    const addUser = req.body.owner_id;

    const data = await client.query(`
    INSERT INTO artists (name, first_album, on_tour, genre_id, owner_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *`,
    [addArtist, addAlbum, addTourStatus, addGenreId, addUser]);
    
    res.json(data.rows[0]);
  } catch(e) {
    
    res.status(500).json({ error: e.message });
  }
});

app.post('/genres', async(req, res) => {
  try {
    const addGenre = req.body.name;

    const data = await client.query(`
    INSERT INTO genres (name)
    VALUES ($1)
    RETURNING *`,
    [addGenre]);
    
    res.json(data.rows[0]);
  } catch(e) {
    
    res.status(500).json({ error: e.message });
  }
});

app.put('/artists/:id', async(req, res) => {
  try {
    const artistId = req.params.id;

    const data = await client.query(`
    UPDATE artists
    SET
      name=$1, 
      first_album=$2, 
      on_tour=$3, 
      genre_id=$4, 
      owner_id=$5
    WHERE artists.id=$6
    RETURNING *`,
    [req.body.name, req.body.first_album, req.body.on_tour, req.body.genre_id, req.body.owner_id, artistId]);
    
    res.json(data.rows[0]);
  } catch(e) {
    
    res.status(500).json({ error: e.message });
  }
});

app.delete('/artists/:id', async(req, res) => {
  try {
    const artistId = req.params.id;

    const data = await client.query(`
    DELETE FROM artists
    WHERE artists.id=$1
    RETURNING *`,
    [artistId]);
    
    res.json(data.rows[0]);
  } catch(e) {
    
    res.status(500).json({ error: e.message });
  }
});

app.use(require('./middleware/error'));

module.exports = app;
