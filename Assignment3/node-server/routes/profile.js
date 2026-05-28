import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.get('/:email/profile', async(req, res, next) =>{
    try{

        const email = req.params.email;
        const user = await req.db.from("users")

        .select("email", "firstName", "lastName", "dob", "address")
        .where({email: email}).first();
        if(!user){
            return res.status(404).json({ error: true, 
                message: "User not found" });
        }

        const authHeader = req.headers['authorization'];
        let isOwner = false;

        if(authHeader){

            if(!authHeader.startsWith('Bearer ')){
                return res.status(401).json({
                    error: true,
                    message: "Authorization header is malformed"
                });
            }
            const token = authHeader.split(' ')[1];
            try{
                const decoded = jwt.verify(
                    token,
                    process.env.JWT_SECRET
                );
                isOwner = decoded.email === email;
            } catch(err){
                if(err.name === "TokenExpiredError"){
                    return res.status(401).json({
                        error: true,
                        message: "JWT token has expired"
                    });
                }

                return res.status(401).json({
                    error: true,
                    message: "Invalid JWT token"
                });
            }
        }
        if(isOwner){
            return res.status(200).json({
                email: user.email,
                firstName: user.firstName ?? null,
                lastName: user.lastName ?? null,
                dob: user.dob ? new Date(user.dob).toISOString().slice(0, 10): null,
                address: user.address ?? null
            });
        }
       
        return res.status(200).json({ email: user.email,
            firstName: user.firstName ?? null,
            lastName: user.lastName ?? null
        });
        
    } catch(err){
        next(err);
    }
    

});

// router.put('/:email/profile', authenticateToken, async(req, res, next) =>{
router.put("/:email/profile", authenticateToken, async (req, res, next) => {
    try{
        const profileEmail = req.params.email;
        const loggedInEmail = req.user.email;
        
        if(profileEmail !== loggedInEmail){
            return res.status(403).json({
                error: true,
                message: "Forbidden"
            });
        }
        
        const{ firstName, lastName, dob, address } = req.body;
        
        //validations
        if(!firstName || !lastName || !dob || !address){
            return res.status(400).json({ 
                error: true,
                message: "Request body incomplete: firstName, lastName, dob and address are required."
            });
        }

        // strings only
        if (typeof firstName !== 'string' || typeof lastName !== 'string' || typeof address !== 'string') {
            return res.status(400).json({
                error: true,
                message: "Request body invalid: firstName, lastName and address must be strings only."
            });
        }

        //validate dob format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if(!dateRegex.test(dob)) {
            return res.status(400).json({
                error: true,
                message: "Invalid input: dob must be a real date in format YYYY-MM-DD."
            });
        }

        //checking if its a real date
        const parsedDate = new Date(dob);
        if (isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== dob) {
            return res.status(400).json({
                error: true,
                message: "Invalid input: dob must be a real date in format YYYY-MM-DD."
            });
        }

        //not in the future
        if(parsedDate >= new Date()) {
            return res.status(400).json({
                error: true,
                message: "Invalid input: dob must be a date in the past."
            });
        }

        
        await req.db("users")
        .where({email: profileEmail})
        .update({firstName, lastName, dob, address});

        res.status(200).json({
            email: profileEmail,
            firstName: firstName,
            lastName: lastName,
            dob: new Date(dob).toISOString().slice(0, 10),
            address: address
        });

    } catch (err){
        next(err);
    }
});

export default router;