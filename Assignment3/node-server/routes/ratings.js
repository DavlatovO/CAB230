import express from  'express';
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();



router.post("/debugEraseRatings", async (req, res, next) => {
    try{
        await req.db('ratings').del();
        res.status(200).json({message: "All ratings successfully erased."});
    } catch(err){
        next(err);
    }
})

router.post('/rentals/:id', authenticateToken, async(req, res, next) =>{
    try{
        const rentalId = req.params.id;
        const userEmail = req.user.email;
        const { rating, comment } = req.body;


        // validate rating
        if (!rating) {
            return res.status(400).json({ error: true, 
                message: "Invalid rating. Rating must be an integer value between 1 and 5" });
        }

        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            return res.status(400).json({ error: true, 
                message: "Invalid rating. Rating must be an integer value between 1 and 5" });
        }

        if(comment !== undefined){
            if(typeof comment !== 'string' || comment.length < 1 || comment.length > 2000) {
                return res.status(400).json({ 
                    error: true,
                    message: "Invalid comment parameter. Comment must be a string 1-2000 characters long."
                });
            }
        }

        // check rental exists
        const rental = await req.db('data').where('id', rentalId).first();
        if (!rental) {
            return res.status(404).json({ error: true, message: 'No rental with this ID.' });
        }

        
        const existing = await req.db('ratings')
        .where({ rentalId, userEmail }).first();

        const data = {
            rating, 
            dateTime: new Date(),
            comment: comment || null
        };

        if(existing){
            await req.db('ratings').where({rentalId, userEmail }).update(data);
        } else {
            await req.db('ratings').insert({ rentalId, userEmail, ...data});
        }

        res.status(201).json({ rating, dateTime: new Date().toISOString() });
    } catch(err){
        next(err);
    }

});

router.get('/rentals/:id', authenticateToken, async (req, res, next) =>{
    try{

        const queryParams = Object.keys(req.query);
        if(queryParams.length > 0){
            return res.status(400).json({
                error: true,
                message: `Invalid query parameters: ${queryParams.join(',')}. Query parameters are not permitted.`
            });
        }

        const userEmail = req.user.email;
        const rentalId = req.params.id;
        
        const row = await req.db.from("ratings")
        .select("rating", "dateTime")
        .where({ rentalId, userEmail }).first();
        
        if(!row){
            return res.status(404).json({ error: true, message: "No rating with this rental ID"});
        }
        
        res.status(200).json({rating: rows.rating, dateTime: row.dateTime });
    
    }catch(err){
        next(err);
    }
});

router.get('/', authenticateToken, async(req, res, next) => {
    try{
        
        if (req.query.page !== undefined && (isNaN(parseInt(req.query.page)) || parseInt(req.query.page) < 1)) {
            return res.status(400).json({
                error: true,
                message: "Invalid page parameter. Must be an integer greater than or eqaul to 1."
            });
        }

        const email = req.user.email;
        const page = parseInt(req.query.page) || 1;
        const perPage = 20;
        const offset = (page - 1) * perPage;

        const { total } = await req.db('ratings')
        .where('userEmail', email)
        .count('id as total')
        .first();

        const rows = await req.db('ratings')
        .where('userEmail', email)
        .select('rentalId', 'rating', 'dateTime', 'comment')
        .orderBy('dateTime', 'desc')
        .limit(perPage)
        .offset(offset);

        const data = rows.map(row => {
            const entry = { rentalId: row.rentalId, rating: row.rating, dateTime: row.dateTime };
            if (row.comment) entry.comment = row.comment;
            return entry;
        });

        const lastPage = Math.ceil(total / perPage);

        res.json({data, pagination: {total: parseInt(total),
            lastPage,
            prevPage: page > 1? page - 1: null,
            nextPage: page < lastPage ? page + 1 : null,
            perPage,
            currentPage: page,
            from: offset,
            to: offset + perPage
        }});
    }catch(err){
        next(err);
    }
});



export default router;