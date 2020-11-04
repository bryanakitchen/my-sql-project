const client = require('../lib/client');
// import our seed data:
const artists = require('./artists.js');
const genres = require('./genres.js');
const usersData = require('./users.js');
const { getEmoji } = require('../lib/emoji.js');

run();

async function run() {

  try {
    await client.connect();

    const users = await Promise.all(
      usersData.map(user => {
        return client.query(`
                      INSERT INTO users (email, hash)
                      VALUES ($1, $2)
                      RETURNING *;
                  `,
        [user.email, user.hash]);
      })
    );

    await Promise.all(
      genres.map(genre => {
        return client.query(`
                      INSERT INTO genres (name)
                      VALUES ($1, $2)
                      RETURNING *;
                  `,
        [genre.name]);
      })
    );
      
    const user = users[0].rows[0];

    await Promise.all(
      artists.map(artist => {
        return client.query(`
                    INSERT INTO artists (name, first_album, on_tour, genre, owner_id)
                    VALUES ($1, $2, $3, $4, $5);
                `,
        [artist.name, artist.first_album, artist.on_tour, artist.genre, user.id]);
      })
    );
    

    console.log('seed data load complete', getEmoji(), getEmoji(), getEmoji());
  }
  catch(err) {
    console.log(err);
  }
  finally {
    client.end();
  }
    
}
