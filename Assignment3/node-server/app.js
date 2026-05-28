import dotenv from 'dotenv';
dotenv.config();
import express from "express";
import swaggerUI from "swagger-ui-express";
import swaggerDocument from './docs/rentals-openapi.json' with {type: 'json'};
import ratingsRouter from './routes/ratings.js';
import knex from 'knex';
import helmet from 'helmet';
import cors from 'cors';
import knexConfig from './knexfile.js';
import userRouter from './routes/auth.js';
import rentalsRouter from './routes/rentals.js';
import profileRouter from './routes/profile.js';
import rateLimit from 'express-rate-limit';


const app = express();
const port = 3000;


const db = knex(knexConfig);
app.use(helmet());
app.use(cors());
app.use((req, res, next) =>{
    req.db = db;
    next();
});

const limiter = rateLimit({
    windowMs: 60 * 1000,  // 15 minutes
    max: 500,                    // max 100 requests per 15 minutes
    message: 'Too many requests, please try again later.'
});

app.use(limiter);

app.use((err, req, res, next) =>{
    console.error(err);
    res.status(err.status || 500).json({ error: true, message: "Internal server error"});
})

app.use(express.json());

app.use('/docs', swaggerUI.serve);
app.get('/docs', swaggerUI.setup(swaggerDocument));

app.use('/ratings', ratingsRouter);
app.use('/user', userRouter);
app.use('/user', profileRouter);
app.use('/rentals', rentalsRouter);

app.get('/', (req, res, next) => {
    res.send("<h1>Hello</h1>");
});



app.listen(port, ()=>{
    console.log(`Server listening on http://localhost:${port}`);
});