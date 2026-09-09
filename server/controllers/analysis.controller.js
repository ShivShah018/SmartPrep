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

    const pyqFiles = (req.files || []).filter(f => f.fieldname === 'pyqFiles' || f.fieldname === 'papers');
    const syllabusFiles = (req.files || []).filter(f => f.fieldname === 'syllabusFiles');
    const notesFiles = (req.files || []).filter(f => f.fieldname === 'notesFiles');

    // Fallback if fieldnames are plain 'files' or unspecified
    const filesToAnalyze = (pyqFiles.length > 0 || syllabusFiles.length > 0 || notesFiles.length > 0)
      ? { pyqFiles, syllabusFiles, notesFiles }
      : req.files;

    const result = await runAnalysis(filesToAnalyze, meta);

    res.json({
      success: true,
      data: result,
    });
  }),
];