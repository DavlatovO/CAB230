import express from "express";
import knex from 'knex';
import knexConfig from './knexfile.js';
import apiRouter from './api.js';
import helmet from 'helmet';
import cors from 'cors';
import morgan from "morgan";
import swaggerUI from 'swagger-ui-express';
import swaggerDocument from './docs/openapi.json' with {type: 'json'};


const app = express();
const port = 3000;

const db = knex(knexConfig);
app.use((req, res, next) =>{
    req.db = db;
    next();
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(morgan('dev'));

// morgan.token('res', (req, res) => {
//   const headers = {};
//   res.getHeaderNames().map(h => headers[h] = res.getHeader(h));
//   return JSON.stringify(headers);
// });

app.use(helmet());
app.use('/api', apiRouter);

app.get("/knex", (req, res, next) =>{
    req.db.raw("SELECT VERSION()")
    .then(version => {console.log(version[0][0]);
        res.send("Version logged successfully");
    })
    .catch(err => {
        console.log(err);
        throw err;
    });
});

app.get('/', (req, res) => {
    res.send("<h1>Hello world</h1>");
});

app.use('/docs', swaggerUI.serve);
app.get('/docs', swaggerUI.setup(swaggerDocument));



app.listen(port, () =>{
    console.log(`Server listening on http://localhost:${port}`);
});