const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

router.post('/login', adminController.login);
router.get('/dashboard', authenticateToken, authorizeRole(['admin']), adminController.dashboard);
router.put('/doctors/:id/approve', authenticateToken, authorizeRole(['admin']), adminController.approveDoctor);
router.put('/doctors/:id', authenticateToken, authorizeRole(['admin']), adminController.updateDoctor);
router.delete('/doctors/:id', authenticateToken, authorizeRole(['admin']), adminController.deleteDoctor);
router.delete('/patients/:id', authenticateToken, authorizeRole(['admin']), adminController.removePatient);

module.exports = router;
