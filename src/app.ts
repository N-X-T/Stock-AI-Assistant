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
import getFinancialAnalysis from './cronjob/stock/FinancialAnalysis_TCB';
import FinancialReport from './cronjob/stock/PromptFinancial';
import CalcPriceDynamics from './cronjob/stock/Price_Dynamics_TCB';
import PriceDynamicReport from './cronjob/stock/PromptPrice';

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
  console.trace();
  //logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

cron.schedule('30 9 1 2,5,8,11 *', async () => {
  console.log('Cronjob báo cáo tài chính hàng quý');
  await getFinancialAnalysis();
  await FinancialReport();
});

cron.schedule('30 9 1 * *', async () => {
  console.log('Cronjob Lịch sử giá hàng tháng');
  await CalcPriceDynamics();
  await PriceDynamicReport();
});