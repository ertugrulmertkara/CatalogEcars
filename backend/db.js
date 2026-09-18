const mongoose = require("mongoose");
require("dotenv").config();

//pool = bağlantı havuzu


async function connectDb() 
{
    try 
    {
        await mongoose.connect(process.env.DATABASE_URL);
        console.log("MongoDB Veritabanına Başarıyla Bağlandı.")
    }
    catch(error)
    {
        console.error("MongoDB Bağlantı Hatası:", error);
    }
}

module.exports =connectDb;

