const express = require('express');
const router = express.Router();
const WasteItem = require('../../models/wasteitem.model');

// 모든 쓰레기 항목 조회
router.get('/', async (req, res) => {
    try {
        const wasteItems = await WasteItem.find().sort({ createdAt: -1 });
        res.json(wasteItems);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 새로운 쓰레기 항목 추가
router.post('/', async (req, res) => {
    const wasteItem = new WasteItem({
        name: req.body.name,
        category: req.body.category,
        description: req.body.description,
        disposalMethod: req.body.disposalMethod,
        imageUrl: req.body.imageUrl
    });

    try {
        const newWasteItem = await wasteItem.save();
        res.status(201).json(newWasteItem);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// 특정 쓰레기 항목 조회
router.get('/:id', async (req, res) => {
    try {
        const wasteItem = await WasteItem.findById(req.params.id);
        if (wasteItem) {
            res.json(wasteItem);
        } else {
            res.status(404).json({ message: '쓰레기 항목을 찾을 수 없습니다.' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 