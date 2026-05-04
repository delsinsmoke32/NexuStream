
tabella utenti <- link episodi visti <- link commenti
tabella show <- link episodi
tabella episodi
tabella stagioni

tabella commenti [<-user, <-parent (null se root), <-episodio, timestamp, likes, approved, notApproved]
tabella show [titolo, immagine(file), generi <->, numStagioni, <-stagioni, dati...]
tabella stagioni [titolo, immagine(file), <-episodi, numEpisodi, dati...]
tabella ep [titolo, immagine(file), durata, uscita, link]
tabella utenti [nome, password, isMod, isAdmin, <-> episodi visti, <-> episodiLiked, <-> showFave, lingua, isBanned]

supporto lingua?
