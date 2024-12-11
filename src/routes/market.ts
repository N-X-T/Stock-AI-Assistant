import express from 'express';
import logger from '../utils/logger';
import db from '../db/index';
import { sql } from 'drizzle-orm';

const router = express.Router();

router.get('/', async (req, res) => {

    try {
        const query = sql.raw(`SELECT * FROM MarketAnalysis ORDER BY id DESC`);

        const result = db.all(query);

        return res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ message: 'An error has occurred.' });
        logger.error(`Error in getting market analysis: ${err.message}`);
    }
});

export default router;
