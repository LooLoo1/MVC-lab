const mongoose = require('mongoose');

// MongoDB connection URI
const MONGODB_URI = 'mongodb+srv://vam:123@cluster0.rd5knl1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Connection options
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true
};

// Test connection
async function testConnection() {
    try {
        console.log('Attempting to connect to MongoDB...');
        console.log('Connection URI:', MONGODB_URI);
        
        await mongoose.connect(MONGODB_URI, options);
        
        console.log('Successfully connected to MongoDB!');
        
        // Test database operations
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Available collections:', collections.map(c => c.name));
        
    } catch (error) {
        console.error('MongoDB connection error:', error);
    } finally {
        // Close the connection
        await mongoose.connection.close();
        console.log('Connection closed');
    }
}

// Run the test
testConnection(); 