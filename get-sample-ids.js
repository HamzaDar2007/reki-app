// Simple script to get sample IDs for Swagger examples
require('dotenv').config();
const { Client } = require('pg');

async function getSampleIds() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'reki_db',
  });

  try {
    await client.connect();
    
    // Get Manchester city ID
    const cityResult = await client.query("SELECT id FROM cities WHERE name = 'Manchester' LIMIT 1");
    const cityId = cityResult.rows[0]?.id;
    
    // Get sample venue IDs
    const venueResult = await client.query("SELECT id, name FROM venues LIMIT 3");
    const venues = venueResult.rows;
    
    // Get sample offer IDs
    const offerResult = await client.query("SELECT id, title FROM offers LIMIT 3");
    const offers = offerResult.rows;
    
    console.log('Sample IDs for Swagger examples:');
    console.log('================================');
    console.log(`Manchester City ID: ${cityId}`);
    console.log('\nSample Venues:');
    venues.forEach(v => console.log(`- ${v.name}: ${v.id}`));
    console.log('\nSample Offers:');
    offers.forEach(o => console.log(`- ${o.title}: ${o.id}`));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

getSampleIds();