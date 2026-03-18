const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Sub-folders for organization
['resumes', 'kyc'].forEach(sub => {
    const subPath = path.join(uploadDir, sub);
    if (!fs.existsSync(subPath)) {
        fs.mkdirSync(subPath);
    }
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let folder = 'resumes';
        if (file.fieldname === 'kyc') folder = 'kyc';
        cb(null, path.join(uploadDir, folder));
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF and Images are allowed.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

module.exports = upload;
