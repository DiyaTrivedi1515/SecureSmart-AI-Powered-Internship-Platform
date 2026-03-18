const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Internship = require('../models/Internship');
const connectDB = require('../config/db');

dotenv.config();

const cleanupInternships = async () => {
    try {
        await connectDB();
        
        console.log('Connected to MongoDB.');
        
        const total = await Internship.countDocuments();
        console.log(`Total internships found: ${total}`);
        
        if (total > 50) {
            console.log('More than 50 internships found, starting cleanup...');
            
            const oldDocs = await Internship
                .find()
                .sort({ createdAt: -1 })
                .skip(50);
                
            const ids = oldDocs.map(doc => doc._id);
            
            const result = await Internship.deleteMany({ _id: { $in: ids } });
            console.log(`Successfully deleted ${result.deletedCount} old internships.`);
        } else {
            console.log('50 or fewer internships found, no cleanup needed.');
        }
    } catch (error) {
        console.error('Error cleaning up internships:', error);
    } finally {
        mongoose.connection.close();
        console.log('MongoDB connection closed.');
    }
};

cleanupInternships();
