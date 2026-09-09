import { Router } from 'express';
import { analyzePapers } from '../controllers/analysis.controller.js';

const router = Router();

router.post('/analysis', analyzePapers);

export default router;