import express from 'express';
const router  = express.Router();

router.get('/', function(req, res, next){
    res.send("<h1>World Cities API</h1>");
})

router.post('/update', (req, res) => {
    const city        = req.body.city        || req.query.city;
    const countryCode = req.body.countryCode || req.query.countryCode;
    const pop         = req.body.pop         || req.query.pop;
   
    if (!city || !countryCode || !pop) {
        res.status(400).json({ message: "Error missing fields" });
        return; // ← also need return here to stop execution
    }

    const filter = {
        Name: city,
        CountryCode: countryCode
    };

    const update = {
        Population: pop
    };

    // ✅ now inside the route where req exists
    req.db('city').where(filter).update(update)
        .then(_ => {
            res.status(200).json({ message: `Successfully updated ${req.body.city}` });
            console.log('Successful population update:', JSON.stringify(filter));
        })
        .catch(error => {
            console.log(error);
            res.status(500).json({ message: 'Database error - not updated' });
        });
});




router.get("/city", async (req, res, next) =>{
    try{
        const rows = await req.db.from("city").select("name", "district");
        res.json({error: false, message: "Success", cities:rows});
    }   catch(err) {
        next(err);
    }  
});

router.get("/city/:countryCode", (req, res, next) =>{
    const { countryCode } = req.params;
    
    if(!/^[A-Z]{3}$/.test(countryCode)) {
        return res.status(400).json({ error: true, message: "Invalid country code format" });
    }
    
    req.db.from("city")
    .select("*")
    .where("CountryCode", "=", countryCode)
    .then((rows) => {
        if (rows.length === 0) {
            return res.status(404).json({ error: true, message: "No cities found for that country" });
        }
        res.json({error: false, message: "Success", cities: rows });
    })
    .catch((err) => {
        console.log(err);
        res.status(500).json({error: true, message: "Error in MySQL query" });
    });
});

export default router;