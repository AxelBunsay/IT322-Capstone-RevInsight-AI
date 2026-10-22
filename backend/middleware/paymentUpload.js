const multer = require('multer');
const path = require('path');

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter(req, file, callback) {
    const extension = path.extname(file.originalname).toLowerCase();
    const isJpeg = file.mimetype === 'image/jpeg' && ['.jpg', '.jpeg'].includes(extension);
    const isPng = file.mimetype === 'image/png' && extension === '.png';
    if (isJpeg || isPng) return callback(null, true);
    return callback(new Error('Upload a JPG or PNG image.'));
  },
  limits: { fileSize: 2 * 1024 * 1024, files: 1 }
});

module.exports = upload;
