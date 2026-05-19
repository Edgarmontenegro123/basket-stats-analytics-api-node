import express from 'express';
import cors from 'cors';

import { registerRoutes } from './routes/routes';

const app = express();
const PORT = process.env.PORT || 3002;
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors({
    origin: allowedOrigin,
}));
app.use(express.json());

registerRoutes(app);

app.listen(PORT, () => {
    console.log(`Analytics API running on port ${PORT}`);
});