const mongoose = require('mongoose');
const google = require('googlethis');
const Car = require('./models/Car');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.DATABASE_URL);
  console.log('Veritabanına bağlandı. Resim arama başlıyor...');
  
  const cars = await Car.find();
  
  for (let car of cars) {
    if (car.imageUrl && car.imageUrl.length > 5) continue; // Zaten varsa atla
    try {
      const query = car.brand + ' ' + car.model + ' car exterior high quality';
      const images = await google.image(query, { safe: false });
      if (images && images.length > 0) {
        car.imageUrl = images[0].url;
        await car.save();
        console.log('[BULUNDU] ' + car.brand + ' ' + car.model);
      } else {
        console.log('[BULUNAMADI] ' + car.brand + ' ' + car.model);
      }
    } catch (e) {
      console.log('[HATA] ' + car.brand + ' ' + car.model + ' - ' + e.message);
    }
    // Google engellemesin diye 1.5 saniye bekle
    await new Promise(r => setTimeout(r, 1500));
  }
  
  console.log('Tüm arabalar güncellendi!');
  process.exit(0);
}
run();
