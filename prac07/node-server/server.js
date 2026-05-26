import indexRouter from './index.js';
import docsRouter from './docs.js';
import express from "express";
import knex from 'knex';
import knexConfig from './knexfile.js'
import helmet from 'helmet';
import testRouter from './test.js';


const app = express();
const port = 3000;

const db = knex(knexConfig);
app.use(helmet());

app.use((req, res, next) => {
    req.db = db;
    next();
})

app.get('/error', (req, res) =>{
    throw new Error("Oops there's an Error");
});

app.get('/crash', (req, res, next) => {
    setTimeout(() => {
        next(new Error("But this will crash the server after 1 second"));
        }, 1000);
});

app.get('/api/city', async (req, res, next) => {
    try {

        const rows = await req.db.from('City').select('CityName', 'District')
        res.json({ error: false, message: 'Success', cities: rows });
    } catch(err) {
        next(err);
    }
});



function logOriginalUrl(req, res, next) {
    console.log('Request URL:' + req.originalUrl);
    next();
}

function logMethod(req, res, next) {
    console.log('Request Type:' + req.method);
    next();
}

const logStuff = [logOriginalUrl, logMethod];

app.use('/', logStuff, indexRouter);
app.use('/docs', docsRouter);
app.use('/test', testRouter);

app.use((err, req, res, next) =>{
    const error = new Error("404 page not found");
    error.status = 404;
    next(error);    
});

app.use((err, req, res, next) => {
    console.log(err);
    const status = err.status || 500;
    const message = status == 404 ? err.message : "Internal server error";
    res.status(status).json({ error:true, message });
});

app.listen(port, () =>{
    console.log("Server running on port : http://localhost:3000")
});