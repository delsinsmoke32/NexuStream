const express = require('express');
const router = express.Router({ mergeParams: true
 });

router.get('/', (req, res) => {
    const episodeId = req.params.id;

    const comment1 = {
        CommentID: 1001n,
        REF_UserID: 42n,
        REF_EpisodeID: 101n,
        DateCommented: '2024-05-10T14:30:00Z',
        REF_CommentID: 0n, // 0 indica che è un commento principale, non una risposta
        isHidden: false,
        Likes: 156n,
        isApproved: true
    };

    const comment2 = {
        CommentID: 1002n,
        REF_UserID: 88n,
        REF_EpisodeID: 101n,
        DateCommented: '2024-05-10T15:00:00Z',
        REF_CommentID: 1001n, // Questo commento è una risposta al commento 1001
        isHidden: false,
        Likes: 12n,
        isApproved: true
    };

    res.json([comment1, comment2])
});

module.exports = router;