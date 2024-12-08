import express from 'express';
import logger from '../utils/logger';
import db from '../db/index';
import { sql } from 'drizzle-orm';

const router = express.Router();

router.post('/', async (req, res) => {

    try {
        const query = sql.raw(`SELECT * FROM scoring
        WHERE creatAt IN (SELECT MAX(creatAt)
                            FROM scoring
                            WHERE TYPE = '${req.body.type}'
                            GROUP BY symbol)
        ORDER BY score DESC`);

        const result = db.all(query);

        return res.status(200).json({ tickers: result });
    } catch (err) {
        res.status(500).json({ message: 'An error has occurred.' });
        logger.error(`Error in getting top ticker: ${err.message}`);
    }
});

export default router;
