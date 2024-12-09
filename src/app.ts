import { config } from 'dotenv'
config();

import { startWebSocketServer } from './websocket';
import express from 'express';
import cors from 'cors';
import http from 'http';
import routes from './routes';
import { getPort } from './config';
import logger from './utils/logger';
import cron from 'node-cron';
import StockScoring from './cronjob/StockScoring';
import MarketAnalysis from './cronjob/MarketAnalysis';

const port = getPort();

const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin: '*',
};

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api', routes);
app.get('/api', (_, res) => {
  res.status(200).json({ status: 'ok' });
});

server.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});

startWebSocketServer(server);

process.on('uncaughtException', (err, origin) => {
  logger.error(`Uncaught Exception at ${origin}: ${err}`);
});

process.on('unhandledRejection', (reason: Error, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

cron.schedule('0 9 1 2,5,8,11 *', () => { // BCTC trễ nhất sau 1 tháng khi kết thúc quý
  StockScoring(true); // true == LongTerm
});

cron.schedule('0 9 * * *', () => { // 9h hàng ngày
  StockScoring(false); // false == ShortTerm
});

cron.schedule('0 23 * * *', () => { // 23h hàng ngày
  MarketAnalysis();
});