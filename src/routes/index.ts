import express from 'express';
import configRouter from './config';
import modelsRouter from './models';
import suggestionsRouter from './suggestions';
import chatsRouter from './chats';
import topRouter from './toptickers';
import marketRouter from './market';
import sectorRouter from './sector';

const router = express.Router();

router.use('/config', configRouter);
router.use('/models', modelsRouter);
router.use('/suggestions', suggestionsRouter);
router.use('/chats', chatsRouter);
router.use('/top_ticker', topRouter);
router.use('/market', marketRouter);
router.use('/sector', sectorRouter);

export default router;
