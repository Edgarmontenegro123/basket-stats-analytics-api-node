import express from 'express';
import cors from 'cors';

import { registerRoutes } from './routes/routes';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

registerRoutes(app);

app.listen(PORT, () => {
    console.log(`Analytics API running on port ${PORT}`);
});