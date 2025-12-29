require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Person = require('../models/Person');

// Guard: prevent accidental execution in production unless explicitly allowed
if (process.env.NODE_ENV === 'production' && process.env.DEV_UTILS_ALLOWED !== 'true') {
  console.error('Developer utility scripts are disabled in production. Set DEV_UTILS_ALLOWED=true to enable.');
  process.exit(1);
}

const run = async () => {
  console.log('Script starting...');
  const mongoUri = process.env.MONGODB_URI;
  console.log(`Attempting to connect to MongoDB with URI: ${mongoUri}`);

  if (!mongoUri) {
    console.error('Error: MONGODB_URI is not defined. Please check your .env file.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected successfully.');
  } catch (err) {
    console.error('Database Connection Error:', err.message);
    process.exit(1);
  }

  try {
    console.log("Searching for person with no job title ('position' is null or empty)...");
    const personToDelete = await Person.findOne({
      $or: [{ position: null }, { position: '' }],
    });

    if (personToDelete) {
      console.log(`Found person to delete: ${personToDelete.firstName} ${personToDelete.lastName} (ID: ${personToDelete._id})`);
      await Person.findByIdAndDelete(personToDelete._id);
      console.log('Person successfully deleted.');
    } else {
      console.log('No person found with no job title.');
    }
  } catch (error) {
    console.error('Error during delete operation:', error);
  } finally {
    console.log('Closing database connection.');
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

run().catch(error => {
  console.error('An unexpected error occurred:', error);
  process.exit(1);
});
