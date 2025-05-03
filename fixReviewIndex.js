/**
 * Script to fix the index naming issue in reviews collection
 * This script specifically addresses the E11000 duplicate key error
 * Run with: node fixReviewIndex.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

const fixReviewIndexes = async () => {
  try {
    // Access the database directly
    const db = mongoose.connection.db;
    const reviewCollection = db.collection('reviews');
    
    // 1. Show current indexes to see the problem
    console.log('Current indexes:');
    const currentIndexes = await reviewCollection.indexes();
    console.log(JSON.stringify(currentIndexes, null, 2));
    
    // 2. Drop ALL indexes (except _id which can't be dropped)
    console.log('Dropping all indexes...');
    await reviewCollection.dropIndexes();
    console.log('All indexes dropped');
    
    // 3. Find and fix any documents with null userId or snackId
    console.log('Finding documents with null fields...');
    const nullDocs = await reviewCollection.find({
      $or: [
        { userId: null },
        { snackId: null },
        { user: { $exists: true } },
        { snack: { $exists: true } }
      ]
    }).toArray();
    
    console.log(`Found ${nullDocs.length} documents with potential issues`);
    
    // 4. Delete problematic documents
    if (nullDocs.length > 0) {
      console.log('Removing problematic documents...');
      await reviewCollection.deleteMany({
        $or: [
          { userId: null },
          { snackId: null },
          { user: { $exists: true } },
          { snack: { $exists: true } }
        ]
      });
      console.log(`Removed ${nullDocs.length} problematic documents`);
    }
    
    // 5. Create the correct index
    console.log('Creating new index with correct field names...');
    await reviewCollection.createIndex(
      { userId: 1, snackId: 1 },
      { unique: true, background: true, name: 'userId_snackId_unique' }
    );
    console.log('New index created successfully');
    
    // 6. Verify the new indexes
    console.log('New indexes:');
    const newIndexes = await reviewCollection.indexes();
    console.log(JSON.stringify(newIndexes, null, 2));
    
    // 7. Show collection statistics
    const stats = await reviewCollection.stats();
    console.log(`Collection now has ${stats.count} documents`);
    
  } catch (error) {
    console.error('Error fixing review indexes:', error);
  } finally {
    mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
};

// Run the script
connectDB().then(() => {
  fixReviewIndexes();
}); 