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


        const rows = await req.db.from("data").distinct("state").orderBy('state', 'asc');
        const states = rows.map(row => row.state);
        res.json(states);
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


        const rows = await req.db.from("data").distinct("propertyType").orderBy('propertyType', 'asc');
        const propertyTypes = rows.map(row => row.propertyType);
        res.json(propertyTypes);


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


        // valid values for sortBy
        const validSortFields = ['id', 'title', 'rent', 'propertyType', 'latitude', 
            'longitude', 'postcode', 'state', 'suburb', 'bathrooms', 'bedrooms', 
            'parkingSpaces', 'averageRating', 'numRatings'];

        // add this after destructuring query params
        if (req.query.page !== undefined && (isNaN(parseInt(req.query.page)) || parseInt(req.query.page) < 1)) {
            return res.status(400).json({
                error: true,
                message: "Invalid page parameter. Must be an integer greater than or equal to 1."
            });
        }
        

        if (postcode !== undefined) {
            const postcodeInt = parseInt(postcode);
            if (!/^\d{4}$/.test(postcode) || isNaN(postcodeInt) || postcodeInt < 0 || postcodeInt > 9999) {
                return res.status(400).json({
                    error: true,
                    message: "Invalid postcode parameter. Must be an integer in the range of 0000-9999."
                });
            }
        }

        // helper function
        const isInvalidInt = (val) => isNaN(parseInt(val)) || !Number.isInteger(Number(val));
        const isNegative = (val) => parseInt(val) < 0;

        if (minimumRent !== undefined && isInvalidInt(minimumRent)) {
            return res.status(400).json({ error: true, message: "Invalid minimumRent parameter. Must be a non-negative integer." });
        }
        if (maximumRent !== undefined && isInvalidInt(maximumRent)) {
            return res.status(400).json({ error: true, message: "Invalid maximumRent parameter. Must be a non-negative integer." });
        }
        if (minimumBathrooms !== undefined && (isInvalidInt(minimumBathrooms) || isNegative(minimumBathrooms))) {
            return res.status(400).json({ error: true, message: "Invalid minimumBathrooms parameter. Must be a non-negative integer." });
        }
        if (maximumBathrooms !== undefined && (isInvalidInt(maximumBathrooms) || isNegative(maximumBathrooms))) {
            return res.status(400).json({ error: true, message: "Invalid maximumBathrooms parameter. Must be a non-negative integer." });
        }
        if (minimumBedrooms !== undefined && (isInvalidInt(minimumBedrooms) || isNegative(minimumBedrooms))) {
            return res.status(400).json({ error: true, message: "Invalid minimumBedrooms parameter. Must be a non-negative integer." });
        }
        if (maximumBedrooms !== undefined && (isInvalidInt(maximumBedrooms) || isNegative(maximumBedrooms))) {
            return res.status(400).json({ error: true, message: "Invalid maximumBedrooms parameter. Must be a non-negative integer." });
        }
        if (minimumParking !== undefined && (isInvalidInt(minimumParking) || isNegative(minimumParking))) {
            return res.status(400).json({ error: true, message: "Invalid minimumParking parameter. Must be a non-negative integer." });
        }
        if (maximumParking !== undefined && (isInvalidInt(maximumParking) || isNegative(maximumParking))) {
            return res.status(400).json({ error: true, message: "Invalid maximumParking parameter. Must be a non-negative integer." });
        }


        // sortOrder without sortBy = 400
        if (sortOrder && !sortBy) {
            return res.status(400).json({ error: true, message: "Invalid sortOrder parameter. sortBy must be specified." });
        }

        // invalid sortBy = 400
        if (sortBy && !validSortFields.includes(sortBy)) {
            return res.status(400).json({ error: true, message: `Invalid sortBy parameter. Must refer to a valid sortable property.` });
        }

        // invalid sortOrder = 400
        if (sortOrder && !['asc', 'desc'].includes(sortOrder)) {
            return res.status(400).json({ error: true, message: "Invalid sortOrder parameter. Must be 'asc' or 'desc'." });
        }


        const perPage = 10;
        const currentPage = parseInt(page);
        const offset = (currentPage - 1) * perPage;


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

       // these fields don't exist in data table, handle after fetching
        const needsRatingSort =
            sortBy === 'averageRating' ||
            sortBy === 'numRatings';

        if (sortBy && validSortFields.includes(sortBy) && !needsRatingSort) {
            const order = sortOrder === 'desc' ? 'desc' : 'asc';
            query = query.orderBy(sortBy, order);
        } else if (!needsRatingSort) {
            query = query.orderBy('id', 'asc');
        }

        // pagination
        query = query.limit(perPage).offset(offset);

        const rows = await query.select('id', 'title', 'rent', 'propertyType',
            'locality', 'latitude', 'longitude', 'postcode', 'state',
            'streetAddress', 'suburb', 'bathrooms', 'bedrooms', 'parkingSpaces',
            'agencyName', 'amenities');
        
        const rentalIds = rows.map(r => r.id);

        const ratings = await req.db('ratings')
        .whereIn('rentalId', rentalIds)
        .select('rentalId')
        .avg('rating as averageRating')
        .count('id as numRatings')
        .groupBy('rentalId');

        const data = rows.map(rental => {
            const ratingData = ratings.find(r => r.rentalId === rental.id);
            return {
                ...rental,
                latitude: parseFloat(rental.latitude),    // ← force number
                longitude: parseFloat(rental.longitude),  // ← force number
                averageRating: ratingData ? Math.round(ratingData.averageRating * 100) / 100 : null,
                numRatings: ratingData ? parseInt(ratingData.numRatings) : 0
            };
        });

        if (needsRatingSort) {
            const order = sortOrder === 'desc' ? -1 : 1;

            data.sort((a, b) => {
                const aVal = a[sortBy] ?? -1;
                const bVal = b[sortBy] ?? -1;

                return (aVal - bVal) * order;
            });
        }

        const lastPage = Math.ceil(total / perPage);

        res.json({
            error: false,
            message: 'Success',
            data: data,
            pagination: {
                total: parseInt(total),
                lastPage,
                prevPage: currentPage > 1 ? currentPage - 1 : null,
                nextPage: currentPage < lastPage ? currentPage + 1 : null,
                perPage,
                currentPage,
                from: offset,
                to: offset + rows.length
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
        ? Math.round((ratings.reduce((sum, r) => sum + r.rating, 0) / numRatings) * 100) / 100: null
        
        
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
            latitude: parseFloat(rental.latitude),
            longitude: parseFloat(rental.longitude),
            averageRating,
            numRatings,
            reviews
        });

    } catch(err){
        next(err);
    }
});

export default router;