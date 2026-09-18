const mongoose = require("mongoose");

const carSchema = new mongoose.Schema(
    {
        brand: { type: String, required: true },
        model: { type: String, required: true },
        year: { type: Number, required: true },
        bodyType: { type: String, required: true },
        drivetrain: { type: String },
        range: { type: Number, required: true },
        battery: { type: Number },
        price: { type: Number, required: true },
        status: { type: String, default: "catalog" },
        imageUrl: { type: String },
        link: { type: String },
        note: { type: String }
    }
    , 
    {
        timestamps: true // bu ayar createdAt ve updatedAt tarihlerini otomatik ekler. 
    }
);
module.exports = mongoose.model("Car", carSchema);
