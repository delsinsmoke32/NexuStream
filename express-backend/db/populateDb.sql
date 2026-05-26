-- 1. Lingue Supportate
INSERT INTO "SupportedLanguages" ("LanguageID") VALUES ('it'), ('en'), ('jp');

-- 2. Generi cinematografici
INSERT INTO "Genres" ("Name") VALUES ('Sci-Fi'), ('Fantasy'), ('Thriller'), ('Drama');

-- 3. Immagini Profilo (Avatar)
INSERT INTO "Propics" ("PropicURI", "Bundle") VALUES 
('/static/avatars/avatar-000.png', 'Default'), 
('/static/avatars/avatar-001.png', 'Default'), 
('/static/avatars/avatar-002.png', 'Anime Pack');

-- 4. Serie TV (Shows) - Titolo e Descrizione convertiti in JSON
INSERT INTO "Shows" ("DateStarted", "hasEnded", "DateEnded", "Favourited", "Title", "Description", "ThumbnailURI", "BannerURI") VALUES 
(
  '2023-01-01', 0, NULL, 150, 
  '{"it":"Nebbia Urbana","en":"Urban Fog"}', 
  '{"it":"Un thriller psicologico ambientato a Milano.","en":"A psychological thriller set in Milan."}', 
  '/static/avatars/avatar-000.png', '/static/avatars/avatar-000.png'
),
(
  '2021-03-01', 1, '2022-05-10', 3200, 
  '{"it":"Il Trono di Pixel","en":"The Pixel Throne"}', 
  '{"it":"Lotta per il potere in un mondo fantasy.","en":"A struggle for power in a fantasy world."}', 
  '/static/avatars/avatar-000.png', '/static/avatars/avatar-000.png'
);

-- 5. Stagioni (Seasons) - Titolo e Descrizione convertiti in JSON
INSERT INTO "Seasons" ("REF_ShowID", "DateStarted", "hasEnded", "DateEnded", "Title", "Description", "SeasonNumber") VALUES 
(
  1, '2023-01-01', 0, NULL, 
  '{"it":"Stagione 1 - Genesi","en":"Season 1 - Genesis"}', 
  '{"it":"La prima stagione introduce i personaggi.","en":"The first season introduces the characters."}', 
  1
),
(
  2, '2021-03-01', 1, '2021-06-01', 
  '{"it":"Libro Primo","en":"Book One"}', 
  '{"it":"L''inizio della saga epica.","en":"The beginning of the epic saga."}', 
  1
);

-- 6. Episodi (Episodes) - Titolo e Descrizione convertiti in JSON
INSERT INTO "Episodes" ("ReleaseDate", "REF_SeasonID", "Duration", "Likes", "Streams", "Title", "Description", "ThumbnailURI", "EpisodeNumber") VALUES 
(
  '2023-01-01', 1, 45, 120, 1500, 
  '{"it":"Il Silenzio","en":"The Silence"}', 
  '{"it":"Il ritrovamento del primo indizio.","en":"The discovery of the first clue."}', 
  '/static/avatars/avatar-000.png', 1
),
(
  '2023-01-08', 1, 42, 95, 1200, 
  '{"it":"Ombre Lunghe","en":"Long Shadows"}', 
  '{"it":"Le indagini si complicano.","en":"The investigations get complicated."}', 
  '/static/avatars/avatar-000.png', 2
),
(
  '2021-03-01', 2, 60, 500, 8000, 
  '{"it":"Il Portale","en":"The Portal"}', 
  '{"it":"Un viaggio oltre i confini.","en":"A journey beyond borders."}', 
  '/static/avatars/avatar-000.png', 1
);

-- 7. Discussioni (Discussions - per i thread degli episodi)
INSERT INTO "Discussions" ("REF_EpisodeID", "OpenDate", "CloseDate", "ForceClosed", "Type") VALUES 
(1, '2026-01-01 00:00', '2027-01-08 00:00', 0, 'standard'),
(2, '2026-01-01 00:00', '2027-01-01 00:00', 0, 'standard'),
(2, '2021-03-01 00:00', '2021-03-15 00:00', 1, 'archive');

-- 8. Associazioni Serie -> Generi (LINKs_Show_Has_Genre)
INSERT INTO "LINKs_Show_Has_Genre" ("REF_GenreID", "REF_ShowID") VALUES 
(3, 1), -- Nebbia Urbana -> Thriller
(4, 1), -- Nebbia Urbana -> Drama
(2, 2); -- Il Trono di Pixel -> Fantasy

-- 9. Lingue Tracce Audio dell'Episodio (EpisodeLanguage)
INSERT INTO "EpisodeLanguage" ("REF_EpisodeID", "REF_LanguageID") VALUES 
(1, 'it'), 
(1, 'en'),
(2, 'it'),
(3, 'jp'),
(3, 'en');

-- 10. Sottotitoli dell'Episodio (EpisodeSubtitles)
INSERT INTO "EpisodeSubtitles" ("REF_EpisodeID", "REF_LanguageID") VALUES 
(1, 'en'), 
(1, 'it'), 
(2, 'it'), 
(3, 'it'),
(3, 'en');

-- 11. Salti Temporali (EpisodeTimes - es. sigle/intro)
INSERT INTO "EpisodeTimes" ("REF_EpisodeID", "StartTime", "EndTime", "Type") VALUES 
(1, 0, 120, 'Opening'),
(1, 2400, 2700, 'Ending'),
(3, 30, 150, 'Opening');

-- 12. Risoluzioni Video disponibili (EpisodeResolutions)
INSERT INTO "EpisodeResolutions" ("REF_EpisodeID", "Resolution") VALUES 
(1, '720p'),
(1, '1080p'),
(2, '1080p'),
(3, '1080p'),
(3, '4K');