import express from 'express';

const router = express.Router();

router.get('/', (req, res, next) =>{
    res.send("<h1>Siuu</h1>");
});

console.log("Start");

process.nextTick(() =>{
    console.log("nexTick");
});

console.log("end");

export default router;