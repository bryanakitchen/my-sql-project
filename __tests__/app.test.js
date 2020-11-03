require('dotenv').config();

const { execSync } = require('child_process');

const fakeRequest = require('supertest');
const app = require('../lib/app');
const client = require('../lib/client');

describe('app routes', () => {
  describe('routes', () => {
    let token;
  
    beforeAll(async done => {
      execSync('npm run setup-db');
  
      client.connect();
  
      const signInData = await fakeRequest(app)
        .post('/auth/signup')
        .send({
          email: 'jon@user.com',
          password: '1234'
        });
      
      token = signInData.body.token;
  
      return done();
    });
  
    afterAll(done => {
      return client.end(done);
    });

    test('returns artists', async() => {

      const expectation = [
        {
          id: 1,
          name: 'Griz',
          first_album: 2011,
          on_tour: false,
          genre: 'electronica',
          owner_id: 1
        },
        {
          id: 2,
          name: 'Odesza',
          first_album: 2012,
          on_tour: false,
          genre: 'indietronica',
          owner_id: 1
        },
        {
          id: 3,
          name: 'Disclosure',
          first_album: 2013,
          on_tour: false,
          genre: 'house',
          owner_id: 1
        },
        {
          id: 4,
          name: 'Louis the Child',
          first_album: 2013,
          on_tour: false,
          genre: 'dance pop',
          owner_id: 1
        },
      ];

      const data = await fakeRequest(app)
        .get('/artists')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(data.body).toEqual(expectation);
    });

    test('returns one artist', async() => {

      const expectation =
        {
          id: 1,
          name: 'Griz',
          first_album: 2011,
          on_tour: false,
          genre: 'electronica',
          owner_id: 1
        };

      const data = await fakeRequest(app)
        .get('/artists/1')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(data.body).toEqual(expectation);
    });

    test('adds one artist to the database and returns it', async() => {

      const expectation =
        {
          id: 5,
          name: 'Big Gigantic',
          first_album: 2009,
          on_tour: false,
          genre: 'electronica',
          owner_id: 1
        };

      const data = await fakeRequest(app)
        .post('/artists')
        .send({
          name: 'Big Gigantic',
          first_album: 2009,
          on_tour: false,
          genre: 'electronica',
          owner_id: 1
        })
        .expect('Content-Type', /json/)
        .expect(200);

      const allArtists = await fakeRequest(app)
        .get('/artists')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(data.body).toEqual(expectation);
      expect(allArtists.body.length).toEqual(5);
    });


  });

});
