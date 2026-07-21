const mongoose = require('mongoose');
require('dotenv').config();

async function dropCollection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    // Drop the collection
    await mongoose.connection.collection('admins').drop();
    console.log('✅ Admins collection dropped successfully');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

dropCollection();
