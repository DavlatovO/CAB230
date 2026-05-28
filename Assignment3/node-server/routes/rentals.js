import express from 'express';


const router = express.Router();

router.get('/states', async (req, res, next) => {
    try{
        const queryParams = Object.keys(req.query);
        if(queryParams.length > 0){
            return res.status(400).json({
                error: true,
                message: `Invalid query parameters: ${queryParams.join(',')}. Query parameters are not permitted.`
            });
        }


        const rows = await req.db.from("data").distinct("state");
        res.json({ error: false, message:"Success", states:rows });
    } catch(err){
        next(err);
    }
});

router.get('/property-types', async (req, res, next) => {
    try{
        const queryParams = Object.keys(req.query);
        if(queryParams.length > 0){
            return res.status(400).json({
                error: true,
                message: `Invalid query parameters: ${queryParams.join(',')}. Query parameters are not permitted.`
            });
        }


        const rows = await req.db.from("data").distinct("propertyType");
        res.json({ error: false, message:"Success", types:rows });
    } catch(err){
        next(err);
    }
});

router.get('/search', async (req, res, next) => {
    try {
        const {
            suburb, state, postcode,
            minimumRent, maximumRent,
            minimumBathrooms, maximumBathrooms,
            minimumBedrooms, maximumBedrooms,
            minimumParking, maximumParking,
            propertyTypes,
            minimumRating, maximumRating,
            sortBy, sortOrder,
            page = 1
        } = req.query;

        if (postcode !== undefined) {
            const postcodeInt = parseInt(postcode);
            if (!/^\d{4}$/.test(postcode) || isNaN(postcodeInt) || postcodeInt < 0 || postcodeInt > 9999) {
                return res.status(400).json({
                    error: true,
                    message: "Invalid postcode parameter. Must be an integer in the range of 0000-9999."
                });
            }
        }



        const perPage = 20;
        const currentPage = parseInt(page);
        const offset = (currentPage - 1) * perPage;

        // valid values for sortBy
        const validSortFields = ['id', 'title', 'rent', 'propertyType', 'latitude', 
            'longitude', 'postcode', 'state', 'suburb', 'bathrooms', 'bedrooms', 
            'parkingSpaces', 'averageRating', 'numRatings'];

        // build base query
        let query = req.db('data');

        // apply filters
        if (suburb)     query = query.where('suburb', suburb);
        if (state)      query = query.where('state', state);
        if (postcode)   query = query.where('postcode', parseInt(postcode));

        if (minimumRent)      query = query.where('rent', '>=', parseInt(minimumRent));
        if (maximumRent)      query = query.where('rent', '<=', parseInt(maximumRent));

        if (minimumBathrooms) query = query.where('bathrooms', '>=', parseInt(minimumBathrooms));
        if (maximumBathrooms) query = query.where('bathrooms', '<=', parseInt(maximumBathrooms));

        if (minimumBedrooms)  query = query.where('bedrooms', '>=', parseInt(minimumBedrooms));
        if (maximumBedrooms)  query = query.where('bedrooms', '<=', parseInt(maximumBedrooms));

        if (minimumParking)   query = query.where('parkingSpaces', '>=', parseInt(minimumParking));
        if (maximumParking)   query = query.where('parkingSpaces', '<=', parseInt(maximumParking));

        // propertyTypes can be array e.g. ?propertyTypes=apartment&propertyTypes=studio
        if (propertyTypes) {
            const types = Array.isArray(propertyTypes) ? propertyTypes : [propertyTypes];
            query = query.whereIn('propertyType', types);
        }

        // get total count before pagination (clone query before limit/offset)
        const countQuery = query.clone().count('id as total').first();
        const { total } = await countQuery;

        // sorting
        if (sortBy && validSortFields.includes(sortBy)) {
            const order = sortOrder === 'desc' ? 'desc' : 'asc';
            query = query.orderBy(sortBy, order);
        } else {
            query = query.orderBy('id', 'asc');  // default
        }

        // pagination
        query = query.limit(perPage).offset(offset);

        const rows = await query.select('id', 'title', 'rent', 'propertyType',
            'locality', 'latitude', 'longitude', 'postcode', 'state',
            'streetAddress', 'suburb', 'bathrooms', 'bedrooms', 'parkingSpaces',
            'agencyName', 'amenities');

        const lastPage = Math.ceil(total / perPage);

        res.json({
            error: false,
            message: 'Success',
            data: rows,
            pagination: {
                total: parseInt(total),
                lastPage,
                prevPage: currentPage > 1 ? currentPage - 1 : null,
                nextPage: currentPage < lastPage ? currentPage + 1 : null,
                perPage,
                currentPage,
                from: offset,
                to: offset + perPage
            }
        });

    } catch(err) {
        next(err);
    }
});

router.get('/:id', async (req, res, next) =>{
    try{

        const queryParams = Object.keys(req.query);
        if(queryParams.length > 0){
            return res.status(400).json({
                error: true,
                message: `Invalid query parameters: ${queryParams.join(',')}. Query parameters are not permitted.`
            });
        }

        const rental = await req.db.from("data").select('title', 'rent', 'description', 'propertyType',
                'locality', 'latitude', 'longitude', 'postcode', 'state',
                'streetAddress', 'suburb', 'bathrooms', 'bedrooms', 'parkingSpaces',
                'agencyName', 'amenities')
                .where('id', req.params.id).first();
        
        if(!rental){
            return res.status(404).json({ error: true,
                message: "No rental exists with this ID"
            });
        }

        const ratings = await req.db('ratings')
        .where('rentalId', req.params.id)
        .select('rating', 'userEmail', 'comment', 'dateTime');

        const numRatings = ratings.length;
        const averageRating = numRatings > 0
        ? Math.round((ratings.reduce((sum, r) => sum + r.rating, 0) / numRatings) * 100 / 100): null
        
        
        const reviews = ratings.map(r => {
            const review = {
                rating: r.rating,
                user: r.userEmail,
                dateTime: r.dateTime
            };
            if(r.comment) review.comment = r.comment;
            return review;
        });

        res.json({
            ...rental,
            averageRating,
            numRatings,
            reviews
        });

    } catch(err){
        next(err);
    }
});

export default router;