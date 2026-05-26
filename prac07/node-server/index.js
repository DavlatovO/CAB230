import express from 'express'; 
const router = express.Router();

router.use((req, res, next) => {
    console.log(new Date());
    next();
});

router.get('/', (req, res, next) => {
    res.send("<h1>Home Page Router</h1>");
})

router.get('/user/:id', (req, res, next) => {
    res.send('User: ' + req.params.id);
});

export default router;