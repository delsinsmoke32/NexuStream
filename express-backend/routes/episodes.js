const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.send('Lista completa degli episodi...');
});

router.get('/:id', (req, res) => {
    const episodeId = req.params.id;

    const mockEpisode = {
        id: episodeId,
        title: `Episodio ${episodeId} - Il più forte`,
        description: "Lorem Ipsum Caput Mentulae Es, Amice",
        videoUrl: "sorry mistah dont got a folder for thems yet...",
        comments: [
            {user: "jjklover69", text: "idk man jojo is lowk better than ts"},
            {user: "jojolover420", text: "man jojolover shut up, gojo no diffs ur verse"},
        ]
    }

    res.json(mockEpisode)
});

module.exports = router;