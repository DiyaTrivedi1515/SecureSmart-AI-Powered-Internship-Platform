const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config({ quiet: true });
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Verify JWT_SECRET is loaded
if (!process.env.JWT_SECRET) {
    console.error('CRITICAL ERROR: JWT_SECRET is not defined in .env file!');
    console.log('Please restart your server after adding it.');
}

const authRoutes = require('./routes/auth');
const internshipsRoutes = require('./routes/internships');
const companyRoutes = require('./routes/companies');
const aiRoutes = require('./routes/ai');
const adminRoutes = require('./routes/admin');
const applicationRoutes = require('./routes/applications');
const notificationRoutes = require('./routes/notifications');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/student', require('./routes/student'));
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/internships', internshipsRoutes);

app.get('/api/status', (req, res) => {
    res.json({ message: 'SecureSmart Backend API is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
