/**
 * Script to reset and recreate indexes in the Review collection
 * Run this with: node resetIndexes.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

const resetReviewIndexes = async () => {
  try {
    // Get the Review collection
    const db = mongoose.connection.db;
    const reviewCollection = db.collection('reviews');
    
    console.log('Dropping all indexes from reviews collection...');
    await reviewCollection.dropIndexes();
    console.log('All indexes dropped');
    
    console.log('Creating new unique compound index...');
    await reviewCollection.createIndex(
      { userId: 1, snackId: 1 }, 
      { unique: true, background: true }
    );
    console.log('New index created successfully');
    
    // List all indexes to verify
    const indexes = await reviewCollection.indexes();
    console.log('Current indexes:', indexes);
    
    // Count documents to display collection health
    const count = await reviewCollection.countDocuments();
    console.log(`Collection has ${count} documents`);
    
    // Remove any potential duplicate reviews if they exist
    const duplicates = await reviewCollection.aggregate([
      { $group: { _id: { userId: "$userId", snackId: "$snackId" }, count: { $sum: 1 }, ids: { $push: "$_id" } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();
    
    console.log(`Found ${duplicates.length} duplicate review groups`);
    
    for (const dup of duplicates) {
      // Keep the first review, remove others
      const idsToRemove = dup.ids.slice(1);
      console.log(`Removing ${idsToRemove.length} duplicate reviews for userId: ${dup._id.userId}, snackId: ${dup._id.snackId}`);
      
      for (const id of idsToRemove) {
        await reviewCollection.deleteOne({ _id: id });
      }
    }
    
    console.log('Cleanup complete');
    
  } catch (error) {
    console.error('Error resetting indexes:', error);
  } finally {
    mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
};

// Run the script
connectDB().then(() => {
  resetReviewIndexes();
}); 