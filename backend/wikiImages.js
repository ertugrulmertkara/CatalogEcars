const mongoose = require('mongoose');
const Car = require('./models/Car');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.DATABASE_URL);
  console.log('Veritabanına bağlandı. Wikipedia resim araması başlıyor...');
  
  const cars = await Car.find();
  let success = 0;
  
  for (let car of cars) {
    if (car.imageUrl && car.imageUrl.length > 5 && !car.imageUrl.includes('ui-avatars')) continue;
    
    try {
      const modelFirstWord = car.model.split(' ')[0];
      let searchTerm = car.brand + ' ' + modelFirstWord;
      
      const url = "https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=" + encodeURIComponent(searchTerm);
      
      const response = await fetch(url);
      const data = await response.json();
      
      const pages = data.query.pages;
      const pageId = Object.keys(pages)[0];
      
      if (pageId !== '-1' && pages[pageId].original) {
        car.imageUrl = pages[pageId].original.source;
        await car.save();
        console.log("[BULUNDU] " + searchTerm + " -> OK");
        success++;
      } else {
        const url2 = "https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=" + encodeURIComponent(modelFirstWord);
        const res2 = await fetch(url2);
        const data2 = await res2.json();
        const pages2 = data2.query.pages;
        const pageId2 = Object.keys(pages2)[0];
        
        if (pageId2 !== '-1' && pages2[pageId2].original) {
          car.imageUrl = pages2[pageId2].original.source;
          await car.save();
          console.log("[BULUNDU] " + modelFirstWord + " -> OK");
          success++;
        } else {
          car.imageUrl = "https://ui-avatars.com/api/?name=" + encodeURIComponent(car.brand+'+'+modelFirstWord) + "&background=random&size=400";
          await car.save();
          console.log("[YOK] " + searchTerm + " (Renkli Kutu eklendi)");
        }
      }
    } catch (e) {
      console.log("[HATA] " + car.brand + " - " + e.message);
    }
  }
  
  console.log("\nİşlem tamam! Toplam " + success + " adet gerçek araba fotoğrafı bulundu.");
  process.exit(0);
}
run();
