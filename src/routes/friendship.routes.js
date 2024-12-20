const express = require('express');
const router = express.Router();
const friendshipController = require('../controllers/friendshipController');
const auth = require('../middlewares/auth');

router.use(auth);

router.get('/', friendshipController.getFriends);
router.post('/request', friendshipController.sendRequest);
router.post('/request/:friendshipId/respond', friendshipController.respondToRequest);
router.post('/cleanup', friendshipController.cleanupOldRequests);
router.get('/pending', friendshipController.getPendingRequests);

module.exports = router; 