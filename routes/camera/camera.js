const express = require('express');
const router = express.Router();
const cameraController = require('../../controllers/camera/camera');

// 카메라 관련 라우트
router.get('/', cameraController.getCameraPage);
router.post('/capture', cameraController.captureImage);
router.post('/analyze', cameraController.analyzeImage);

module.exports = router;
