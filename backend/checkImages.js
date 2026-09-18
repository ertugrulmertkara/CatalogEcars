const mongoose = require('mongoose');
const Car = require('./models/Car');

const ATLAS_URL = "mongodb+srv://radfe46511_db_user:xEEjOyCRpOCkcn9A@cluster0.p6nwfo3.mongodb.net/catalog_ecars";

async function run() {
  await mongoose.connect(ATLAS_URL);
  const cars = await Car.find().limit(15);
  for (let c of cars) {
    console.log(`${c.brand} ${c.model}: ${c.imageUrl ? c.imageUrl.substring(0, 50) + '...' : 'YOK'}`);
  }
  process.exit(0);
}
run();
