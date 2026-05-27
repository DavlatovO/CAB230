import express from 'express';

const router = express.Router();

router.use((req, res, next) => {
    console.log('Time:', new Date());
    next();
})


router.get('/', (req, res) =>{
    res.send('Birds Home page');
});

router.get('/about', (req, res) => {
    res.send("About birds");
})
export default router;
