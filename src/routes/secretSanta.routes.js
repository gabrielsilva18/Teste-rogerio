const express = require('express');
const router = express.Router();
const secretSantaController = require('../controllers/secretSantaController');
const auth = require('../middlewares/auth');

// Todas as rotas precisam de autenticação
router.use(auth);

router.post('/', secretSantaController.create);
router.get('/', secretSantaController.listMine);
router.get('/:id', secretSantaController.getOne);
router.post('/:id/draw', secretSantaController.draw);
router.post('/:id/join', secretSantaController.join);
router.put('/:id/wishlist', secretSantaController.updateWishList);
router.get('/:id/target', secretSantaController.getMyTarget);
router.post('/:id/invite', secretSantaController.inviteParticipant);
router.delete('/:id', secretSantaController.delete);

module.exports = router; 