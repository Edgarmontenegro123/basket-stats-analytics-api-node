import express from 'express'
import cors from 'cors'

import { registerRoutes } from './routes/routes'

const app = express();
const PORT = process.env.PORT || 3002
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'https://basket-stats-frontend.vercel.app',
]

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true)
            return
        }
        callback (new Error('Not allowed by CORS'))
    }
}))
app.use(express.json())

registerRoutes(app)

app.listen(PORT, () => {
    console.log(`Analytics API running on port ${PORT}`)
})