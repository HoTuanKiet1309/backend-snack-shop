/**
 * Script to clean up invalid reviews in the database
 * Run this with: node cleanupReviews.js
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

const cleanupReviews = async () => {
  try {
    // Get the Review collection
    const db = mongoose.connection.db;
    const reviewCollection = db.collection('reviews');
    
    console.log('Removing reviews with null userId or snackId...');
    
    // Find and delete reviews where userId or snackId is null
    const result = await reviewCollection.deleteMany({
      $or: [
        { userId: null },
        { snackId: null },
        { userId: { $exists: false } },
        { snackId: { $exists: false } }
      ]
    });
    
    console.log(`Deleted ${result.deletedCount} invalid reviews`);
    
    // List all reviews to verify
    const reviews = await reviewCollection.find({}).toArray();
    console.log(`Collection now has ${reviews.length} valid reviews`);
    
    // Check for duplicates
    const duplicates = await reviewCollection.aggregate([
      { $group: { _id: { userId: "$userId", snackId: "$snackId" }, count: { $sum: 1 }, docs: { $push: "$$ROOT" } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();
    
    if (duplicates.length > 0) {
      console.log(`Found ${duplicates.length} sets of duplicate reviews`);
      
      for (const dup of duplicates) {
        console.log(`Duplicate set for userId: ${dup._id.userId}, snackId: ${dup._id.snackId}`);
        
        // Keep the most recent review and delete others
        dup.docs.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        const docsToRemove = dup.docs.slice(1);
        
        for (const doc of docsToRemove) {
          await reviewCollection.deleteOne({ _id: doc._id });
          console.log(`Deleted duplicate review with ID: ${doc._id}`);
        }
      }
    } else {
      console.log('No duplicate reviews found');
    }
    
  } catch (error) {
    console.error('Error cleaning up reviews:', error);
  } finally {
    mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
};

// Run the script
connectDB().then(() => {
  cleanupReviews();
}); 