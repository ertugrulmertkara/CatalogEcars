const mongoose = require('mongoose');
const Car = require('./models/Car');

const ATLAS_URL = "mongodb+srv://radfe46511_db_user:xEEjOyCRpOCkcn9A@cluster0.p6nwfo3.mongodb.net/catalog_ecars";

async function searchAndGetImage(query) {
  try {
    // 1. Wikipedia arama motorunda arat
    const searchUrl = "https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=" + encodeURIComponent(query) + "&utf8=&format=json";
    const res = await fetch(searchUrl, {
      headers: { 'User-Agent': 'CatalogEcarsApp/1.0 (contact@ertugrul.dev)' }
    });
    const data = await res.json();
    const firstResult = data.query?.search?.[0];
    if (!firstResult) return null;

    // 2. Bulunan ilk sayfanın görselini çek
    const pageUrl = "https://en.wikipedia.org/w/api.php?action=query&titles=" + encodeURIComponent(firstResult.title) + "&prop=pageimages&format=json&piprop=original";
    const pageRes = await fetch(pageUrl, {
      headers: { 'User-Agent': 'CatalogEcarsApp/1.0 (contact@ertugrul.dev)' }
    });
    const pageData = await pageRes.json();
    const pages = pageData.query?.pages;
    const pageId = Object.keys(pages || {})[0];
    return pages?.[pageId]?.original?.source || null;
  } catch (e) {
    return null;
  }
}

async function run() {
  console.log("Atlas'a baglaniliyor...");
  await mongoose.connect(ATLAS_URL);
  console.log("Baglanti tamam! Akilli arama basliyor...");

  const cars = await Car.find();
  let updated = 0;

  for (let car of cars) {
    const q = `${car.brand} ${car.model.split(' ')[0]}`;
    const img = await searchAndGetImage(q);

    if (img) {
      car.imageUrl = img;
      await car.save();
      updated++;
      console.log(`[OK] ${car.brand} ${car.model}`);
    } else {
      console.log(`[PAS] ${car.brand} ${car.model}`);
    }

    await new Promise(r => setTimeout(r, 120));
  }

  console.log(`\nBitti! Toplam ${updated} / ${cars.length} arac gercek fotograflarla donatildi!`);
  process.exit(0);
}

run();
