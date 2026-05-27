import express from 'express';
import birdsRouter from './routes/birds.js';

const app = express();
const port = 3000;

app.use('/birds', birdsRouter);

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.get('/abc', (req, res) => {
    res.send("Abc")
});

app.use((req, res) => {
    res.status(404).send('<html><body><h1>404: Not Found</h1></body></html>');
})
app.listen(port, () =>{
    console.log(`Server listening on http://localhost:${port}`);
});
























// import {createServer} from 'node:http';
// const hostname = '127.0.0.1';
// const port = 3000;


// const server = createServer((req, res) => {
//     res.statusCode = 200;
//     res.setHeader('Content-Type', 'text/html');
//     res.end('<html><body><h1>hello siuu</h1></body></html>')
// });

// server.listen(port, hostname, () => {
//     console.log(`Server running at http://${hostname}:${port}/`);
// });