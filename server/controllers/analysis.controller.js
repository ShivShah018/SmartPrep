import { asyncHandler } from '../utils/errors.js';
import { uploadPapers, getMaxFiles, getMaxFileSizeMb } from '../middleware/upload.js';
import { runAnalysis } from '../services/analysis.service.js';

export const analyzePapers = [
  (req, res, next) => {
    uploadPapers(req, res, (err) => {
      if (err) {
        const message = err.code === 'LIMIT_FILE_SIZE'
          ? `File too large. Maximum size is ${getMaxFileSizeMb()}MB per paper.`
          : err.code === 'LIMIT_FILE_COUNT'
            ? `Too many files. Maximum is ${getMaxFiles()} papers per analysis session.`
            : err.message;
        return res.status(err.statusCode || 400).json({ success: false, error: { message } });
      }
      next();
    });
  },
  asyncHandler(async (req, res) => {
    const meta = {
      subjectName: req.body.subjectName || '',
      courseName: req.body.courseName || '',
    };

    const result = await runAnalysis(req.files, meta);

    res.json({
      success: true,
      data: result,
    });
  }),
];