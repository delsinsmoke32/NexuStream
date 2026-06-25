const discussionModel = require('../models/discussionModel');
const { validationResult } = require('express-validator');

const getDiscussions = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        console.error(errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    const { episodeId } = req.params;

    try {
        const discussions = await discussionModel.getDiscussionsByEpisode(episodeId);
        return res.json(discussions);
    } catch (err) {
        console.error("Errore recupero discussioni: ", err);
        return res.status(500).json({ message: err instanceof Error ? err.message : "Errore interno del server." });
    }
};

const getDiscussionById = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        console.error(errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    const { discussionId } = req.params;

    try {
        const discussion = await discussionModel.getDiscussionById(discussionId);
        return res.json(discussion);
    } catch (err) {
        console.error("Errore recupero discussione: ", err);
        return res.status(500).json({ message: err instanceof Error ? err.message : "Errore interno del server." });
    }
};

module.exports = {
    getDiscussions,
    getDiscussionById
}