const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  role: {
    type: String,
    enum: ['user', 'dealer', 'superadmin'], // superadmin eklendi
    default: 'user'
  },
  // KULLANICIYA ÖZEL ARAÇ DURUMLARI (Kısa Liste, Test Sürüşü vb.)
  personalList: [{
    carId: { type: mongoose.Schema.Types.ObjectId, ref: 'Car' },
    status: { 
      type: String, 
      enum: ["catalog", "shortlist", "testDrive", "rejected"], 
      default: "catalog" 
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
