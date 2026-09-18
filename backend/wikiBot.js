const mongoose = require('mongoose');
const Car = require('./models/Car');

const ATLAS_URL = "mongodb+srv://radfe46511_db_user:xEEjOyCRpOCkcn9A@cluster0.p6nwfo3.mongodb.net/catalog_ecars";

async function fetchWikiImage(query) {
  try {
    const url = "https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=" + encodeURIComponent(query);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'CatalogEcarsApp/1.0 (educational_project; student_dev)'
      }
    });
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) return null;
    const pageId = Object.keys(pages)[0];
    if (pageId !== '-1' && pages[pageId]?.original?.source) {
      return pages[pageId].original.source;
    }
  } catch (e) {}
  return null;
}

async function run() {
  console.log("Atlas'a baglaniliyor...");
  await mongoose.connect(ATLAS_URL);
  console.log("Baglanti basarili! Arabalar taranıyor...");

  const cars = await Car.find();
  let updated = 0;

  for (let car of cars) {
    const firstWord = car.model.split(' ')[0];
    const queries = [
      car.brand + " " + firstWord,
      car.brand + " " + car.model.split(' ').slice(0, 2).join(' '),
      firstWord
    ];

    let foundUrl = null;
    for (let q of queries) {
      foundUrl = await fetchWikiImage(q);
      if (foundUrl) break;
      await new Promise(r => setTimeout(r, 150));
    }

    if (foundUrl) {
      car.imageUrl = foundUrl;
      await car.save();
      updated++;
      console.log(`[+] ${car.brand} ${car.model} -> Resim guncellendi!`);
    } else {
      console.log(`[-] ${car.brand} ${car.model} -> Wikipedia'da bulunamadi`);
    }

    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\nISLEM BITTI! Toplam ${updated} / ${cars.length} arabaya gercek fotograf eklendi.`);
  process.exit(0);
}

run();
