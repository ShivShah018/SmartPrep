import multer from 'multer';
import { config } from '../config.js';
import { AppError } from '../utils/errors.js';

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx', '.txt', '.md']);
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = file.originalname.split('.').pop()?.toLowerCase();

  if (!ext || !ALLOWED_EXTENSIONS.has(`.${ext}`)) {
    return cb(new AppError(`Unsupported file type: "${file.originalname}". Only PDF, DOCX, TXT and MD files are accepted.`, 400));
  }
  if (file.mimetype && !ALLOWED_MIME_TYPES.has(file.mimetype)) {
    // Allow some leniency: many systems mislabel files; extension is the primary check.
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    files: config.maxFiles,
    fileSize: config.maxFileSizeMb * 1024 * 1024,
  },
});

export const uploadPapers = upload.any();

export const getMaxFiles = () => config.maxFiles;
export const getMaxFileSizeMb = () => config.maxFileSizeMb;