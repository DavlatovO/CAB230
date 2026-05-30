import express from 'express';
import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
const router = express.Router();

// shared helper
const generateTokenAndRespond = (email, expiresIn, expiresInSeconds, res) => {
    const token = jwt.sign(
        { email },
        process.env.JWT_SECRET,
        { expiresIn }
    );
    res.status(200).json({ token, tokenType: 'Bearer', expiresIn: expiresInSeconds });
};


router.post('/register', async (req, res, next) => {
    try{
        const {email, password} = req.body;
        if(!email || !password){
            return res.status(400).json({
                error: true,
                message: "Request body incomplete, both email and password are required"
            });
        }
        const existing = await req.db('users')
        .where({email})
        .first();
        if(existing) {
            return res.status(409).json({error: true, message: "User already exists" });
        }
        const hashedPassword = await argon2.hash(password, 10);
        const user = await req.db('users').insert({
            email: email,
            password: hashedPassword,
        })
        res.status(201).json({error: false, message: "User created"});
    }catch(err){
        next(err);
    }
});


// Normal login - token lasts 24 hours
router.post('/login', async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ 
            error: true, 
            message: "Request body incomplete, both email and password are required" 
        });
    }

    try {
        const user = await req.db('users').where({ email }).first();

        if (!user) {
            return res.status(401).json({ 
                error: true, 
                message: "Incorrect email or password" 
            });
        }

        const match = await argon2.verify(user.password, password);
        if (!match) {
            return res.status(401).json({ 
                error: true, 
                message: "Incorrect email or password" 
            });
        }

       
       generateTokenAndRespond(email, '24h', 86400, res);

    } catch (err) {
        next(err);
    }
});

// Debug login - token lasts 1 second
router.post('/debugLogin', async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ 
            error: true, 
            message: "Request body incomplete, both email and password are required" 
        });
    }

    try {
        const user = await req.db('users').where({ email }).first();

        if (!user) {
            return res.status(401).json({ 
                error: true, 
                message: "Incorrect email or password" 
            });
        }

        const match = await argon2.verify(user.password, password);
        if (!match) {
            return res.status(401).json({ 
                error: true, 
                message: "Incorrect email or password" 
            });
        }

       generateTokenAndRespond(email, '1s', 1, res);

    } catch (err) {
        next(err);
    }
});

export default router;