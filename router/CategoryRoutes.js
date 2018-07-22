const CategoryController = require('../controllers/CategoryController');
const authenticate = require('../middleware/Authentication');

router.put('/create', authenticate, (req, res, next) => {
	CategoryController.create(req, res, next);
});
router.patch('/update/:categoryId', (req, res, next) => {
	CategoryController.update(req, res, next);
});

module.exports = router;