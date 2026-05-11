const express = require('express');
const router = express.Router();

// router.get('/', (req, res) => {
//     res.send('Lista completa degli episodi...');
// });

router.get('/:id', (req, res) => {
    const episodeId = req.params.id;

    // const mockEpisode = {
    //     EpisodeID: episodeId,
    //     Title: `Episodio ${episodeId} - Il più forte`,
    //     Description: "Lorem Ipsum Caput Mentulae Es, Amice",
    //     : [
    //         {user: "jjklover69", text: "idk man jojo is lowk better than ts"},
    //         {user: "jojolover420", text: "man jojolover shut up, gojo no diffs ur verse"},
    //     ]
    // }

    const mockEpisode = {
        EpisodeID: 101n,
        ReleaseDate: new Date('2024-03-20T18:00:00Z'), // Può essere anche una stringa ISO
        REF_SeasonID: 5n,
        Duration: 1440n, // Durata in secondi (es. 24 minuti)
        Likes: 1250n,
        Streams: 45000n,
        Description: "In questo episodio, il protagonista scopre il segreto della città perduta.",
        Title: "Il più forte"
    };

    res.json(mockEpisode)
});

module.exports = router;