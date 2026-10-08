const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const messagesController = require('../controllers/messagesController');
const favouritesController = require('../controllers/favouritesController');

router.get('/demand-records', dashboardController.listDemandRecords);
router.post('/demand-records', dashboardController.createDemandRecords);
router.get('/forecast', dashboardController.getForecast);

router.get('/messages', messagesController.listMessages);
router.post('/messages', messagesController.createMessage);

router.get('/favourites', favouritesController.listFavourites);
router.post('/favourites/toggle', favouritesController.toggleFavourite);

module.exports = router;
