const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extensionAllowed = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimeTypeAllowed = allowedTypes.test(file.mimetype);

  if (extensionAllowed && mimeTypeAllowed) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});