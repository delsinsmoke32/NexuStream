-- 1. Lingue Supportate
INSERT INTO "SupportedLanguages" ("LanguageID") VALUES ('it'), ('en'), ('jp');

-- 2. Generi cinematografici
INSERT INTO "Genres" ("Name") VALUES 
('Sci-Fi'), ('Fantasy'), ('Thriller'), ('Drama'), 
('Action'), ('Comedy'), ('Romance'), ('Adventure'), 
('Mecha'), ('Isekai'), ('Horror');

-- 3. Immagini Profilo (Avatar)
INSERT INTO "Propics" ("PropicURI", "Bundle") VALUES 
('/static/avatars/avatar-000.png', 'Default'), 
('/static/avatars/avatar-001.png', 'Default'), 
('/static/avatars/avatar-002.png', 'Anime Pack'),
('/static/avatars/avatar-003.png', 'Premium Pack');

-- 4. Serie TV (Shows)
INSERT INTO "Shows" ("DateStarted", "hasEnded", "DateEnded", "Favourited", "Title", "Description", "ThumbnailURI", "BannerURI") VALUES 
('2013-04-07', 1, '2023-11-04', 15400, '{"it":"L''Attacco dei Giganti","en":"Attack on Titan"}', '{"it":"L''umanità combatte per la sopravvivenza contro i temibili Giganti.","en":"Humanity fights for survival against the terrifying Titans."}', '/static/show_thumbnails/aot.png', '/static/banners/aot.png'),
('2020-10-03', 0, NULL, 12300, '{"it":"Jujutsu Kaisen","en":"Jujutsu Kaisen"}', '{"it":"Yuji Itadori si unisce a un''organizzazione segreta di stregoni.","en":"Yuji Itadori joins a secret organization of Jujutsu Sorcerers."}', '/static/show_thumbnails/jjk.png', '/static/banners/jjk.png'),
('2019-04-06', 0, NULL, 18900, '{"it":"Demon Slayer","en":"Demon Slayer"}', '{"it":"Tanjiro cerca una cura per la sorella trasformata in demone.","en":"Tanjiro seeks a cure for his sister who turned into a demon."}', '/static/show_thumbnails/ds.png', '/static/banners/ds.png'),
('2022-10-12', 0, NULL, 9800, '{"it":"Chainsaw Man","en":"Chainsaw Man"}', '{"it":"Denji rinasce come mezzo demone con motoseghe al posto delle braccia.","en":"Denji is reborn as a half-devil with chainsaws for arms."}', '/static/show_thumbnails/csm.png', '/static/banners/csm.png'),
('2024-04-13', 0, NULL, 5400, '{"it":"Kaiju No. 8","en":"Kaiju No. 8"}', '{"it":"Un uomo ottiene il potere di trasformarsi in un Kaiju.","en":"A man gains the power to transform into a Kaiju."}', '/static/show_thumbnails/kaiju.png', '/static/banners/kaiju.png'),
('2023-09-29', 0, NULL, 11200, '{"it":"Frieren - Oltre la fine del viaggio","en":"Frieren: Beyond Journey''s End"}', '{"it":"Un''elfa immortale cerca di comprendere il cuore degli umani.","en":"An immortal elf tries to understand the human heart."}', '/static/show_thumbnails/frieren.png', '/static/banners/frieren.png'),
('2024-01-07', 0, NULL, 14500, '{"it":"Solo Leveling","en":"Solo Leveling"}', '{"it":"Il cacciatore più debole diventa il più forte del mondo.","en":"The weakest hunter becomes the strongest in the world."}', '/static/show_thumbnails/solo.png', '/static/banners/solo.png'),
('1999-10-20', 0, NULL, 35000, '{"it":"One Piece","en":"One Piece"}', '{"it":"L''avventura di Rufy per diventare il Re dei Pirati.","en":"Luffy''s adventure to become the Pirate King."}', '/static/show_thumbnails/op.png', '/static/banners/op.png'),
('2022-04-09', 0, NULL, 8700, '{"it":"Spy x Family","en":"Spy x Family"}', '{"it":"Una spia, un''assassina e una telepate formano una finta famiglia.","en":"A spy, an assassin, and a telepath form a fake family."}', '/static/show_thumbnails/spy.png', '/static/banners/spy.png'),
('2006-10-04', 1, '2007-06-27', 22000, '{"it":"Death Note","en":"Death Note"}', '{"it":"Un quaderno che uccide chiunque vi abbia il nome scritto.","en":"A notebook that kills anyone whose name is written in it."}', '/static/show_thumbnails/deathnote.png', '/static/banners/deathnote.png'),
('2011-04-06', 1, '2011-09-14', 16500, '{"it":"Steins;Gate","en":"Steins;Gate"}', '{"it":"Un gruppo di amici inventa una macchina per inviare messaggi nel passato.","en":"Friends invent a machine to send messages to the past."}', '/static/show_thumbnails/steins.png', '/static/banners/steins.png'),
('1995-10-04', 1, '1996-03-27', 19800, '{"it":"Neon Genesis Evangelion","en":"Neon Genesis Evangelion"}', '{"it":"Adolescenti pilotano mecha giganteschi per salvare il mondo.","en":"Teenagers pilot giant mechas to save the world."}', '/static/show_thumbnails/eva.png', '/static/banners/eva.png'),
('2009-04-05', 1, '2010-07-04', 28000, '{"it":"Fullmetal Alchemist: Brotherhood","en":"Fullmetal Alchemist: Brotherhood"}', '{"it":"Due fratelli alchimisti cercano la Pietra Filosofale.","en":"Two alchemist brothers seek the Philosopher''s Stone."}', '/static/show_thumbnails/fmab.png', '/static/banners/fmab.png'),
('2011-10-02', 1, '2014-09-24', 21000, '{"it":"Hunter x Hunter","en":"Hunter x Hunter"}', '{"it":"Gon esplora il mondo per diventare un Hunter come suo padre.","en":"Gon explores the world to become a Hunter like his father."}', '/static/show_thumbnails/hxh.png', '/static/banners/hxh.png'),
('2016-04-03', 0, NULL, 17400, '{"it":"My Hero Academia","en":"My Hero Academia"}', '{"it":"Un ragazzo senza poteri sogna di diventare il più grande eroe.","en":"A quirkless boy dreams of becoming the greatest hero."}', '/static/show_thumbnails/mha.png', '/static/banners/mha.png'),
('2002-10-03', 1, '2017-03-23', 31000, '{"it":"Naruto","en":"Naruto"}', '{"it":"Un giovane ninja emarginato cerca di diventare il leader del villaggio.","en":"An outcast young ninja seeks to become the village leader."}', '/static/show_thumbnails/naruto.png', '/static/banners/naruto.png'),
('2004-10-05', 0, NULL, 24500, '{"it":"Bleach","en":"Bleach"}', '{"it":"Ichigo ottiene i poteri di un dio della morte.","en":"Ichigo obtains the powers of a Soul Reaper."}', '/static/show_thumbnails/bleach.png', '/static/banners/bleach.png'),
('2012-07-08', 1, '2020-09-20', 13200, '{"it":"Sword Art Online","en":"Sword Art Online"}', '{"it":"Giocatori intrappolati in un videogioco mortale in realtà virtuale.","en":"Players trapped in a deadly virtual reality video game."}', '/static/show_thumbnails/sao.png', '/static/banners/sao.png'),
('2016-04-04', 0, NULL, 11800, '{"it":"Re:Zero","en":"Re:Zero"}', '{"it":"Un ragazzo viene trasportato in un mondo magico con il potere di rinascere.","en":"A boy is transported to a magical world with the power to respawn."}', '/static/show_thumbnails/rezero.png', '/static/banners/rezero.png'),
('2019-01-12', 1, '2022-06-25', 9600, '{"it":"Kaguya-sama: Love is War","en":"Kaguya-sama: Love is War"}', '{"it":"Due geni troppo orgogliosi per confessare il loro amore.","en":"Two geniuses too proud to confess their love."}', '/static/show_thumbnails/kaguya.png', '/static/banners/kaguya.png');

-- 5. Associazioni Serie -> Generi
INSERT INTO "LINKs_Show_Has_Genre" ("REF_ShowID", "REF_GenreID") VALUES 
(1, 5), (1, 4), (2, 5), (2, 2), (3, 5), (3, 2), (4, 5), (4, 11),
(5, 5), (5, 1), (6, 8), (6, 4), (7, 5), (7, 2), (8, 5), (8, 8),
(9, 6), (9, 5), (10, 3), (10, 4), (11, 1), (11, 3), (12, 9), (12, 1),
(13, 5), (13, 8), (14, 5), (14, 8), (15, 5), (15, 1), (16, 5), (16, 8),
(17, 5), (17, 2), (18, 10), (18, 5), (19, 10), (19, 3), (20, 6), (20, 7);

-- ==========================================
-- 6. STAGIONI (Seasons)
-- ==========================================

-- A. Inseriamo dinamicamente la Stagione 1 per TUTTE le 20 serie (Genera gli ID da 1 a 20)
INSERT INTO "Seasons" ("REF_ShowID", "DateStarted", "hasEnded", "DateEnded", "Title", "Description", "SeasonNumber") 
SELECT ShowID, DateStarted, 0, NULL, '{"it":"Stagione 1","en":"Season 1"}', '{"it":"L''inizio dell''avventura","en":"The beginning of the adventure"}', 1 FROM "Shows";

-- B. Inseriamo le stagioni successive per le serie più famose (Genererà gli ID dal 21 in poi)
INSERT INTO "Seasons" ("REF_ShowID", "DateStarted", "hasEnded", "DateEnded", "Title", "Description", "SeasonNumber") VALUES 
-- Attack on Titan (ShowID: 1)
(1, '2017-04-01', 1, '2017-06-17', '{"it":"Stagione 2","en":"Season 2"}', '{"it":"Nuovi misteri si celano all''interno delle mura.","en":"New mysteries lie within the walls."}', 2), -- ID: 21
(1, '2018-07-23', 1, '2019-07-01', '{"it":"Stagione 3","en":"Season 3"}', '{"it":"Scontri politici e la riconquista del Wall Maria.","en":"Political clashes and the retaking of Wall Maria."}', 3), -- ID: 22
(1, '2020-12-07', 1, '2023-11-04', '{"it":"Stagione 4 (Final Season)","en":"Season 4 (Final Season)"}', '{"it":"La guerra totale oltre l''oceano.","en":"The all-out war across the ocean."}', 4), -- ID: 23

-- Jujutsu Kaisen (ShowID: 2)
(2, '2023-07-06', 1, '2023-12-28', '{"it":"Stagione 2 (L''Incidente di Shibuya)","en":"Season 2 (Shibuya Incident)"}', '{"it":"Il piano maledetto entra nel vivo nel cuore di Tokyo.","en":"The cursed plan enters its climax in the heart of Tokyo."}', 2), -- ID: 24

-- Demon Slayer (ShowID: 3)
(3, '2021-10-10', 1, '2022-02-13', '{"it":"Stagione 2 (Il Quartiere a Luci Rosse)","en":"Season 2 (Entertainment District)"}', '{"it":"Tanjiro e Uzui in missione segreta.","en":"Tanjiro and Uzui on a secret mission."}', 2), -- ID: 25
(3, '2023-04-09', 1, '2023-06-18', '{"it":"Stagione 3 (Il Villaggio dei Forgiatori)","en":"Season 3 (Swordsmith Village)"}', '{"it":"La forgia delle nuove spade viene attaccata.","en":"The forge of new swords is under attack."}', 3), -- ID: 26

-- One Piece (ShowID: 8)
(8, '2001-03-21', 1, '2002-09-01', '{"it":"Stagione 2 (Saga di Alabasta)","en":"Season 2 (Alabasta Saga)"}', '{"it":"La ciurma sbarca nel regno del deserto per fermare la Baroque Works.","en":"The crew lands in the desert kingdom to stop Baroque Works."}', 2), -- ID: 27

-- My Hero Academia (ShowID: 15)
(15, '2017-04-01', 1, '2017-09-30', '{"it":"Stagione 2 (Festival dello Sport)","en":"Season 2 (Sports Festival)"}', '{"it":"Gli studenti del liceo Yuei mostrano i loro poteri in diretta TV.","en":"U.A. High students show off their powers on live TV."}', 2); -- ID: 28

-- ==========================================
-- 7. EPISODI (Episodes)
-- ==========================================

-- A. Episodi della Stagione 1 (Per tutte le 20 serie originali, ID Stagioni 1-20)
INSERT INTO "Episodes" ("ReleaseDate", "REF_SeasonID", "Duration", "Likes", "Streams", "Title", "Description", "ThumbnailURI", "EpisodeNumber") VALUES 
('2013-04-07', 1, 24, 8500, 150000, '{"it":"A te, tra 2000 anni","en":"To You, in 2000 Years"}', '{"it":"I giganti sfondano il Wall Maria.","en":"The Titans break through Wall Maria."}', '/static/episode_thumbnails/aot_01.png', 1),
('2013-04-14', 1, 24, 7800, 140000, '{"it":"Quel giorno","en":"That Day"}', '{"it":"Il caos regna a Shiganshina.","en":"Chaos reigns in Shiganshina."}', '/static/episode_thumbnails/aot_01.png', 2),
('2020-10-03', 2, 24, 6200, 110000, '{"it":"Il dito di Ryomen Sukuna","en":"Ryomen Sukuna''s Finger"}', '{"it":"Yuji ingoia una reliquia maledetta.","en":"Yuji swallows a cursed relic."}', '/static/episode_thumbnails/jjk.png', 1),
('2019-04-06', 3, 24, 9100, 180000, '{"it":"Crudeltà","en":"Cruelty"}', '{"it":"Tanjiro torna a casa e trova la tragedia.","en":"Tanjiro returns home to a tragedy."}', '/static/episode_thumbnails/ds.png', 1),
('2022-10-12', 4, 24, 5400, 95000,  '{"it":"Cane e motosega","en":"Dog & Chainsaw"}', '{"it":"Denji fa un patto con Pochita.","en":"Denji makes a pact with Pochita."}', '/static/episode_thumbnails/csm.png', 1),
('2024-04-13', 5, 24, 3200, 80000,  '{"it":"L''uomo diventato Kaiju","en":"The Man Who Became a Kaiju"}', '{"it":"Kafka Hibino ottiene poteri mostruosi.","en":"Kafka Hibino gets monster powers."}', '/static/episode_thumbnails/kaiju.png', 1),
('2023-09-29', 6, 24, 6700, 105000, '{"it":"La fine del viaggio","en":"The Journey''s End"}', '{"it":"Il gruppo degli eroi si scioglie.","en":"The hero party disbands."}', '/static/episode_thumbnails/frieren.png', 1),
('2024-01-07', 7, 24, 8800, 120000, '{"it":"Sono abituato a essere debole","en":"I''m Used to Being Weak"}', '{"it":"Sung Jinwoo entra nel doppio dungeon.","en":"Sung Jinwoo enters the double dungeon."}', '/static/episode_thumbnails/solo.png', 1),
('1999-10-20', 8, 24, 12000, 250000, '{"it":"Sono Rufy! Diventerò il Re dei Pirati!","en":"I''m Luffy! The Man Who Will Become the Pirate King!"}', '{"it":"Inizia il viaggio verso la Rotta Maggiore.","en":"The journey to the Grand Line begins."}', '/static/episode_thumbnails/op.png', 1),
('1999-10-27', 8, 24, 11500, 230000, '{"it":"Appare il cacciatore di pirati Zoro","en":"Enter Zoro: Pirate Hunter"}', '{"it":"Rufy incontra il suo primo compagno.","en":"Luffy meets his first crewmate."}', '/static/episode_thumbnails/op.png', 2),
('2022-04-09', 9, 24, 4500, 88000,  '{"it":"Operazione Strix","en":"Operation Strix"}', '{"it":"Twilight adotta Anya.","en":"Twilight adopts Anya."}', '/static/episode_thumbnails/spy.png', 1),
('2006-10-04', 10, 24, 15000, 190000,'{"it":"Rinascita","en":"Rebirth"}', '{"it":"Light Yagami trova il Death Note.","en":"Light Yagami finds the Death Note."}', '/static/episode_thumbnails/deathnote.png', 1),
('2011-04-06', 11, 24, 7300, 92000,  '{"it":"Il Prologo del Principio e della Fine","en":"Turning Point"}', '{"it":"Okabe scopre una cospirazione temporale.","en":"Okabe discovers a time conspiracy."}', '/static/episode_thumbnails/steins.png', 1),
('1995-10-04', 12, 24, 11000, 140000,'{"it":"L''Attacco dell''Angelo","en":"Angel Attack"}', '{"it":"Shinji viene chiamato a Neo Tokyo-3.","en":"Shinji is summoned to Neo Tokyo-3."}', '/static/episode_thumbnails/eva.png', 1),
('2009-04-05', 13, 24, 14500, 185000,'{"it":"L''Alchimista d''Acciaio","en":"Fullmetal Alchemist"}', '{"it":"Ed e Al arrivano a Liore.","en":"Ed and Al arrive in Liore."}', '/static/episode_thumbnails/fmab.png', 1),
('2011-10-02', 14, 24, 13200, 175000,'{"it":"Partenza e Amici","en":"Departure x And x Friends"}', '{"it":"Gon lascia l''Isola Balena.","en":"Gon leaves Whale Island."}', '/static/episode_thumbnails/hxh.png', 1),
('2016-04-03', 15, 24, 9500, 130000, '{"it":"Izuku Midoriya: Origini","en":"Izuku Midoriya: Origin"}', '{"it":"Izuku incontra il suo idolo All Might.","en":"Izuku meets his idol All Might."}', '/static/episode_thumbnails/mha.png', 1),
('2002-10-03', 16, 24, 16000, 210000,'{"it":"Arriva Naruto Uzumaki!","en":"Enter: Naruto Uzumaki!"}', '{"it":"Il ninja ribelle ruba il rotolo segreto.","en":"The rebel ninja steals the secret scroll."}', '/static/episode_thumbnails/naruto.png', 1),
('2004-10-05', 17, 24, 12500, 165000,'{"it":"Il giorno in cui divenni Shinigami","en":"The Day I Became a Shinigami"}', '{"it":"Ichigo incontra Rukia.","en":"Ichigo meets Rukia."}', '/static/episode_thumbnails/bleach.png', 1),
('2012-07-08', 18, 24, 8200, 115000, '{"it":"Il mondo delle spade","en":"The World of Swords"}', '{"it":"Il log-out è sparito dal menu.","en":"The log-out button is missing."}', '/static/episode_thumbnails/sao.png', 1),
('2016-04-04', 19, 24, 7600, 102000, '{"it":"La fine dell''inizio","en":"The End of the Beginning"}', '{"it":"Subaru muore per la prima volta.","en":"Subaru dies for the first time."}', '/static/episode_thumbnails/rezero.png', 1),
('2019-01-12', 20, 24, 6900, 98000,  '{"it":"Mi farò invitare al cinema","en":"I Will Make Him Invite Me"}', '{"it":"Inizia la guerra psicologica.","en":"The psychological war begins."}', '/static/episode_thumbnails/kaguya.png', 1);

-- B. Episodi Aggiuntivi per le Stagioni successive (ID Stagioni 21 - 28)
INSERT INTO "Episodes" ("ReleaseDate", "REF_SeasonID", "Duration", "Likes", "Streams", "Title", "Description", "ThumbnailURI", "EpisodeNumber") VALUES 
-- AOT Stagione 2 (SeasonID 21)
('2017-04-01', 21, 24, 9800, 160000, '{"it":"Il gigante bestia","en":"Beast Titan"}', '{"it":"Una nuova anomala minaccia si profila all''orizzonte.","en":"A new anomalous threat appears on the horizon."}', '/static/episode_thumbnails/aot_01.png', 1),
('2017-04-08', 21, 24, 8900, 155000, '{"it":"Sono a casa","en":"I''m Home"}', '{"it":"Sasha corre per salvare il suo villaggio natale.","en":"Sasha races to save her home village."}', '/static/episode_thumbnails/aot_01.png', 2),

-- AOT Stagione 3 (SeasonID 22)
('2018-07-23', 22, 24, 12000, 180000, '{"it":"Segnali di fumo","en":"Smoke Signal"}', '{"it":"La squadra Levi inizia una nuova e pericolosa missione.","en":"Levi squad begins a new dangerous mission."}', '/static/episode_thumbnails/aot_01.png', 1),

-- AOT Stagione 4 (SeasonID 23)
('2020-12-07', 23, 24, 25000, 300000, '{"it":"Al di là del mare","en":"The Other Side of the Sea"}', '{"it":"I guerrieri di Marley in azione sul campo di battaglia.","en":"Marley warriors in action on the battlefield."}', '/static/episode_thumbnails/aot_01.png', 1),

-- JJK Stagione 2 (SeasonID 24)
('2023-07-06', 24, 24, 15000, 210000, '{"it":"Talento Nascosto","en":"Hidden Inventory"}', '{"it":"Il passato di Satoru Gojo e Suguru Geto.","en":"The past of Satoru Gojo and Suguru Geto."}', '/static/episode_thumbnails/jjk.png', 1),

-- Demon Slayer Stagione 2 (SeasonID 25)
('2021-12-05', 25, 46, 14000, 190000, '{"it":"Il Pilastro del Suono, Tengen Uzui","en":"Sound Hashira Tengen Uzui"}', '{"it":"Tanjiro e i ragazzi si infiltrano nel quartiere dei piaceri.","en":"Tanjiro and the boys infiltrate the entertainment district."}', '/static/episode_thumbnails/ds.png', 1),

-- Demon Slayer Stagione 3 (SeasonID 26)
('2023-04-09', 26, 45, 18000, 250000, '{"it":"Il sogno di qualcuno","en":"Someone''s Dream"}', '{"it":"Tanjiro si risveglia nel villaggio dei forgiatori di spade.","en":"Tanjiro wakes up in the swordsmith village."}', '/static/episode_thumbnails/ds.png', 1),

-- One Piece Stagione 2 - Alabasta (SeasonID 27)
('2001-03-21', 27, 24, 11000, 230000, '{"it":"Verso Alabasta!","en":"Towards Alabasta!"}', '{"it":"La ciurma sbarca per aiutare la principessa Bibi.","en":"The crew lands to help Princess Vivi."}', '/static/episode_thumbnails/op.png', 1),

-- My Hero Academia Stagione 2 (SeasonID 28)
('2017-04-01', 28, 24, 15000, 190000, '{"it":"L''inizio del festival!","en":"That''s the Idea, Ochaco"}', '{"it":"Gli eroi della Yuei si preparano per il torneo sportivo.","en":"U.A. heroes prepare for the sports tournament."}', '/static/episode_thumbnails/mha.png', 1);

-- 8. Discussioni (Discussions)
INSERT INTO "Discussions" ("REF_EpisodeID", "OpenDate", "CloseDate", "ForceClosed", "Type") 
SELECT EpisodeID, '2026-01-01 00:00', '2028-01-01 00:00', 0, 'standard' FROM "Episodes";

-- 9. Setup Lingue, Sub, e Tempi (Allargato ai nuovi episodi)
INSERT INTO "EpisodeLanguage" ("REF_EpisodeID", "REF_LanguageID") SELECT EpisodeID, 'jp' FROM "Episodes";
-- Mettiamo l'italiano per i primi episodi delle varie serie, così da testare i metadata
INSERT INTO "EpisodeLanguage" ("REF_EpisodeID", "REF_LanguageID") SELECT EpisodeID, 'it' FROM "Episodes" WHERE EpisodeID IN (1, 3, 5, 8, 12, 23, 24, 25, 27);

INSERT INTO "EpisodeSubtitles" ("REF_EpisodeID", "REF_LanguageID") SELECT EpisodeID, 'it' FROM "Episodes";
INSERT INTO "EpisodeSubtitles" ("REF_EpisodeID", "REF_LanguageID") SELECT EpisodeID, 'en' FROM "Episodes";

INSERT INTO "EpisodeResolutions" ("REF_EpisodeID", "Resolution") SELECT EpisodeID, '1080p' FROM "Episodes";