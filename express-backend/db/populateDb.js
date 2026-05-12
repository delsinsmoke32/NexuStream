const dbf = require("./db")
db = dbf.db;

const populateDb = () => {
    const query = `
        -- Lingue Supportate
        INSERT INTO "SupportedLanguages" ("LanguageID") VALUES ('it'), ('en'), ('jp');

        -- Immagini Profilo
        INSERT INTO "Propics" ("PropicPath") VALUES ('/static/img/avatar1.png'), ('/static/img/avatar2.png'), ('/static/img/admin_icon.png');

        -- Utenti (Password in chiaro per esempio, usa hash in produzione)
        INSERT INTO "Users" ("Email", "Password", "Username", "isMod", "isCataloguer", "isAdmin", "REF_LanguageID", "REF_PropicID") VALUES 
        ('admin@stream.it', 'admin123', 'SuperAdmin', 1, 1, 1, 'it', '/static/img/admin_icon.png'),
        ('marco@email.com', 'marco88', 'MarcoRossi', 0, 0, 0, 'it', '/static/img/avatar1.png'),
        ('guest@test.com', 'guest99', 'GuestUser', 0, 1, 0, 'en', '/static/img/avatar2.png');

        -- Serie TV
        INSERT INTO "Shows" ("DateStarted", "hasEnded", "DateEnded", "Favourited", "Description", "Title") VALUES 
        (1672531200, 0, NULL, 150, 'Un thriller psicologico ambientato a Milano.', 'Nebbia Urbana'),
        (1614556800, 1, '2022-05-10', 3200, 'Lotta per il potere in un mondo fantasy.', 'Il Trono di Pixel');

        -- Stagioni
        INSERT INTO "Seasons" ("REF_ShowID", "DateStarted", "hasEnded", "DateEnded", "Description", "Title") VALUES 
        (1, '2023-01-01', 0, NULL, 'La prima stagione introduce i personaggi.', 'Stagione 1 - Genesi'),
        (2, '2021-03-01', 1, '2021-06-01', 'L''inizio della saga epica.', 'Libro Primo');

        -- Episodi
        INSERT INTO "Episodes" ("ReleaseDate", "REF_SeasonID", "Duration", "Likes", "Streams", "Description", "Title") VALUES 
        ('2023-01-01', 1, 45, 120, 1500, 'Il ritrovamento del primo indizio.', 'Il Silenzio'),
        ('2023-01-08', 1, 42, 95, 1200, 'Le indagini si complicano.', 'Ombre Lunghe'),
        ('2021-03-01', 2, 60, 500, 8000, 'Un viaggio oltre i confini.', 'Il Portale');

        -- Lingue e Sottotitoli Episodio
        INSERT INTO "EpisodeLanguage" ("REF_EpisodeID", "Language") VALUES (1, 'Italiano'), (3, 'Inglese');
        INSERT INTO "EpisodeSub" ("REF_EpisodeID", "Language") VALUES (1, 'English'), (2, 'Italiano'), (3, 'Italiano');

        -- Orari Episodio (es. Sigle o Recap)
        INSERT INTO "EpisodeTimes" ("REF_EpisodeID", "StartTime", "EndTime", "Type") VALUES 
        (1, 0, 120, 'Opening'),
        (1, 2400, 2700, 'Ending');

        -- Commenti (incluso un commento ricorsivo/risposta)
        INSERT INTO "Comments" ("REF_UserID", "REF_EpisodeID", "DateCommented", "REF_CommentID", "isHidden", "Likes", "isApproved") VALUES 
        (2, 1, '2023-05-10 14:30', 1, 0, 10, 1), -- Commento principale (ID 1)
        (1, 1, '2023-05-10 15:00', 1, 0, 2, 1);  -- Risposta al commento 1

        -- Interazioni Utente-Episodio
        INSERT INTO "LINKs_User_Interacts_Episode" ("REF_UserID", "REF_EpisodeID", "LastWatchedDate", "Progress", "isCompleted", "isDropped", "isLiked") VALUES 
        (2, 1, '2023-06-01', 100, 1, 0, 1),
        (3, 1, '2023-06-02', 20, 0, 1, 0);

        -- Like alle Serie
        INSERT INTO "LINKs_User_Likes_Show" ("REF_UserID", "REF_ShowID") VALUES (2, 1), (2, 2);
    `;
    
    db.run(query);

    console.log("✅ Record inserito con successo!");
}

module.exports = { populateDb };