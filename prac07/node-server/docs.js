import express from "express";
import swaggerUI from 'swagger-ui-express';
import swaggerDocument from './swagger-petstore.json' with { type: 'json' };




const router  = express.Router();

router.use('/', swaggerUI.serve);
router.get('/', swaggerUI.setup(swaggerDocument));

export default router;
