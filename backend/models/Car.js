const mongoose = require("mongoose");

const carSchema = new mongoose.Schema(
    {
        brand: { type: String, required: true },
        model: { type: String, required: true },
        year: { type: Number }, // Arayüzden kaldırıldı (tüm araçlar sıfır), eski kayıtlarda duruyor
        horsepower: { type: Number }, // Motor gücü, BG (beygir)
        bodyType: { type: String, required: true },
        drivetrain: { type: String },
        range: { type: Number, required: true },
        battery: { type: Number },
        price: { type: Number, required: true },
        status: { type: String, enum: ["catalog", "shortlist", "testDrive", "rejected"], default: "catalog" },
        imageUrl: { type: String },
        link: { type: String },
        note: { type: String },
        ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Aracı ekleyen kişinin ID'si
    }
    , 
    {
        timestamps: true // bu ayar createdAt ve updatedAt tarihlerini otomatik ekler. 
    }
);
module.exports = mongoose.model("Car", carSchema);
