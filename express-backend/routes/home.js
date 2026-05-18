require('dotenv').config();
const express = require('express');
const router = express.Router({ mergeParams: true });
const dbf = require("../db/db")
const authOptional = require("../middleware/authOptional");
const auth = require("../middleware/auth");

//GET /api/home
router.get('/', authOptional, async (req, res) => {

    if (req.user){
        const user = req.user;
    }
    const topFavoritedQuery = `
        SELECT *
        FROM Shows AS s
        ORDER BY s.Favourited DESC
        LIMIT 20`;
    
    const topStreamedQuery = `
        SELECT sh.*, SUM(e.Streams) AS TotalStreams
        FROM Shows AS sh
        JOIN Seasons AS s ON s.REF_ShowID = sh.ShowID
        JOIN Episodes AS e ON e.REF_SeasonID = s.SeasonID
        GROUP BY s.ShowID
        ORDER BY TotalStreams DESC
        LIMIT 20`;

    try {
        const promises = [
            dbf.allAsync(topFavoritedQuery, []),
            dbf.allAsync(topStreamedQuery, [])
        ];

        let continueWatchingPromise = null;
        if (user) {
            const continueWatchingQuery = `
                SELECT sh.showID, sh.Title AS ShowTitle, s.Description,
                    e.EpisodeID, e.Title AS EpisodeTitle,
                    ui.Progress, ui.LastWatchedDate
                FROM LINKs_User_Interacts_Episode AS ui
                JOIN Episodes AS e ON ui.REF_EpisodeID = e.EpisodeID
                JOIN Seasons AS s ON e.REF_SeasonID = s.SeasonID
                JOIN Shows AS sh ON s.REF_ShowID = sh.ShowID
                WHERE ui.REF_UserID = ? AND ui.isCompleted = 0 AND ui.isDropped = 0
                ORDER BY ui.LastWatchedDate DESC
                LIMIT 10`;

            continueWatchingPromise = dbf.allAsync(continueWatchingQuery, [user.id]);
            promises.push(continueWatchingPromise);
        }


        const results = await Promise.all(promises);

        const HomeData = {
            topLiked: results[0],
            topViewed: results[1],
            continueWatching: results[2]
        };

        res.json(HomeData);

    } catch (err) {
        console.error("Errore query homepage: ", err);
        return res.status(500).json({ error: "Errore interno del server" });
    }
});

module.exports = router;