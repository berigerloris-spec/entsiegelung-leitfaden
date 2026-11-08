'use strict';
// Italienische Fassung der Leitfadentexte (daten.js, Rev. 6).
// Übersetzung durch ein Sprachmodell, nicht fachlich geprüft. Massgebend bleibt der deutsche Originaltext in daten.js.
// Zahlen, Einheiten, Quellen, Bedingungen und Entscheidungslogik stammen unverändert aus dem Original (maschinell verglichen).
LFT.it = {
 "fassung": "Versione del 4 novembre 2026, stato di revisione 6 dell’8 novembre 2026",
 "fassungKurz": "Rev. 6 dell’8.11.2026",
 "einleitung": "Questa guida conduce da una superficie sollecitata a un pacchetto di misure motivato; non sostituisce la pianificazione specialistica. Caldo e forti precipitazioni sono trattati insieme perché le superfici sigillate accumulano calore e lasciano defluire la pioggia; chi apre il suolo e trattiene l’acqua in loco agisce contro entrambi, a condizione che le piante possano far evaporare l’acqua. A tal fine occorrono l’accesso ai portali cartografici della Confederazione e del Cantone, la pianificazione del risanamento delle condotte di servizio e delle strade del proprio comune e, dal passo 3, uno specialista per la prova di infiltrazione.",
 "schritte": [
  {
   "nr": 1,
   "titel": "Sollecitazione",
   "frage": "Dove la sollecitazione è più elevata nell’area insediativa?",
   "ergebnis": "Graduatoria delle superfici ricavata dalle carte di valutazione cantonali e dalla carta dei pericoli del deflusso superficiale; grado di sigillatura ricavato dalla copertura del suolo della misurazione ufficiale",
   "stelle": "Pianificazione, supporto GIS"
  },
  {
   "nr": 2,
   "titel": "Occasione",
   "frage": "Su una di queste superfici è comunque previsto un risanamento?",
   "ergebnis": "Confronto con la pianificazione del risanamento delle condotte di servizio e delle strade; definizione della tempistica",
   "stelle": "Genio civile e servizi industriali"
  },
  {
   "nr": 3,
   "titel": "Sottosuolo e fonte d’acqua",
   "frage": "Il sottosuolo assorbe acqua e da dove proviene l’acqua?",
   "ergebnis": "Prova di infiltrazione; in caso di prova negativa prevedere uno scarico a portata limitata con spazio di ritenzione. Chiarire tetto nelle vicinanze, accesso e percorso della condotta",
   "stelle": "Genio civile, specialista per la prova di infiltrazione"
  },
  {
   "nr": 4,
   "titel": "Ammissibilità per misura",
   "frage": "Ogni misura scelta è ammissibile nell’ubicazione?",
   "ergebnis": "Verifica, per ogni misura, del settore di protezione delle acque, della distanza dalla falda e del carico inquinante dell’acqua di risulta; stralciare solo la misura non ammissibile, mantenere le altre componenti; se viene meno l’impianto di destinazione di un’adduzione, verificare dapprima il successivo impianto di destinazione ammissibile, stralciare l’adduzione solo in assenza di un impianto di destinazione",
   "stelle": "Genio civile, se necessario Cantone"
  },
  {
   "nr": 5,
   "titel": "Scelta delle misure",
   "frage": "Quale combinazione è adatta alla superficie?",
   "ergebnis": "Pacchetto di misure secondo l’albero decisionale, comprovato con i dati alle pagine da 6 a 9 e inserito nel progetto di risanamento",
   "stelle": "Genio civile, spazi verdi, pianificazione"
  }
 ],
 "schritt2": "Il passo 2 determina i costi. Se la desigillazione viene inserita in un intervento comunque in programma, la demolizione e il ripristino non si aggiungono. Una desigillazione successiva senza occasione di risanamento è nettamente più costosa e nella pratica raramente attuabile.",
 "schritt3": "Il passo 3 determina la fattibilità. Senza un sottosuolo in grado di assorbire acqua e senza una fonte d’acqua non inquinata le misure più efficaci vengono a mancare. Ciò non può essere compensato con un maggiore impegno in altri punti.",
 "gefaelle": "Nel passo 3 verificare anche la pendenza. Con meno del 3 % l’infiltrazione è di regola possibile senza misure costruttive speciali; a partire da circa il 5 % servono avvallamenti a cascata, il che aumenta la superficie e l’onere.",
 "karten": [
  {
   "name": "Carta di valutazione del clima",
   "ebene": "Cantone",
   "text": "Mostra per ogni superficie insediativa il surriscaldamento notturno e il carico bioclimatico diurno, in ogni caso a livelli da molto favorevole a molto sfavorevole. Da essa si ricava quali quartieri siano più sollecitati di notte. Nel Cantone Argovia si trova nel layer «Bewertungskarte Klima 2026 und 2060 (Tag und Nacht)» (carta di valutazione del clima 2026 e 2060, giorno e notte).",
   "link": "https://www.ag.ch/geoportal/apps/onlinekarten/",
   "linktext": "AGIS Onlinekarten (Cantone Argovia)"
  },
  {
   "name": "Carta dell’analisi climatica",
   "ebene": "Cantone",
   "text": "Mostra la temperatura dell’aria modellizzata alle ore 4 a intervalli di mezzo grado, nonché i corridoi di aria fredda e il deflusso di aria fredda su ampie superfici. Importante per stabilire se una piantumazione prevista bloccherebbe un flusso di aria fredda esistente.",
   "link": "https://www.ag.ch/geoportal/apps/onlinekarten/",
   "linktext": "AGIS Onlinekarten (Cantone Argovia)"
  },
  {
   "name": "Carta dei pericoli del deflusso superficiale",
   "ebene": "Confederazione",
   "text": "Mostra dove, in caso di forti precipitazioni, l’acqua defluisce in superficie e quale profondità raggiunge. Uniforme in tutta la Svizzera e liberamente consultabile per ogni comune. Per la definizione delle priorità delle superfici in questo lavoro si considerano profondità di deflusso superiori a 0,10 m. Anche profondità di deflusso inferiori possono essere rilevanti presso gli edifici.",
   "link": "https://map.geo.admin.ch/?layers=ch.bafu.gefaehrdungskarte-oberflaechenabfluss",
   "linktext": "map.geo.admin.ch"
  },
  {
   "name": "Copertura del suolo della misurazione ufficiale",
   "ebene": "Cantone",
   "text": "Classifica ogni superficie secondo il tipo di oggetto, ad esempio edificio, strada o giardino; ne risulta il grado di sigillatura. In Argovia è disponibile tramite il Geodatenshop AGIS o geodienste.ch. Le quote di superficie e i livelli vengono determinati da uno specialista del comune, se necessario con supporto GIS.",
   "link": "https://www.ag.ch/geoportal/geodatenshop/Datensuche",
   "linktext": "AGIS Geodatenshop"
  }
 ],
 "kartenHinweis": "Per il passo 1 bastano carte e dati accessibili al pubblico; misurazioni o rilevamenti propri non sono necessari a tal fine. Il passo 2 si basa sulla pianificazione dei risanamenti e delle condotte di servizio del proprio comune, il passo 3 richiede una prova di infiltrazione in loco da parte di uno specialista. Gli estratti cartografici possono essere riprodotti in documenti propri indicando la fonte e la data di consultazione. Le carte climatiche cantonali non si chiamano allo stesso modo in ogni Cantone e non sono disponibili ovunque nella stessa forma. La carta dei pericoli della Confederazione è invece identica in tutta la Svizzera. In caso di dubbio chiedere al servizio specializzato cantonale per l’adattamento climatico quali carte valgano per il proprio comune.",
 "rangliste": [
  "Rilevare per ogni superficie il surriscaldamento notturno dalla carta di valutazione e suddividerlo in tre livelli.",
  "Determinare per ogni superficie il grado di sigillatura dalla copertura del suolo della misurazione ufficiale e suddividerlo anch’esso in tre livelli.",
  "Determinare dalla carta dei pericoli la quota di superficie esposta al pericolo di inondazione e suddividerla in tre livelli. Annotare inoltre la superficie esposta al pericolo in valore assoluto, in metri quadrati.",
  "Sommare i tre livelli. Hanno la priorità le superfici che in tutte e tre le sollecitazioni si collocano almeno a livello medio e nella somma a livello alto. Una superficie che spicca soltanto in una sollecitazione non è un’area prioritaria."
 ],
 "ranglisteHinweise": [
  "Dove porre i limiti dei livelli è una decisione del proprio comune e non un limite oggettivo. Annotare come sono stati fissati; altrimenti la graduatoria non sarà più ricostruibile in seguito.",
  "Quota e superficie assoluta portano a ordini diversi. Una superficie piccola raggiunge facilmente il livello più alto tramite la quota, mentre una superficie grande con molta superficie esposta al pericolo può arretrare. Riportare entrambe le grandezze e motivare quale sia determinante nel singolo caso."
 ],
 "abklaerungenIntro": "I cinque punti seguenti decidono quali misure siano in generale a disposizione in una data ubicazione. Vanno chiariti prima della scelta delle misure, non dopo.",
 "abklaerungen": [
  {
   "key": "gws",
   "titel": "Settore di protezione delle acque e falda",
   "text": "In quale settore di protezione delle acque si trova la superficie e a quale profondità si trova la falda? Nelle zone di protezione delle acque sotterranee S1, S2 e Sh l’infiltrazione di acqua piovana è vietata, in S3 e Sm fortemente limitata; l’esecuzione va verificata con il servizio specializzato secondo le disposizioni cantonali. Il settore Au non è una zona di protezione. Va rispettata una distanza minima dal livello della falda. Le carte sono tenute dal Cantone."
  },
  {
   "key": "wasser",
   "titel": "Carico inquinante dell’acqua di risulta",
   "text": "Le acque dei tetti sono considerate non inquinate, a condizione che la copertura non sia costituita su ampie superfici da rame, zinco o piombo privi di rivestimento (valore indicativo di 50 m² su tutte le superfici di contatto, come grondaie e scossaline); alluminio e acciaio al cromo non sono problematici. Ciò vale per ogni misura che accoglie acque dei tetti: trincea alberata (D5), avvallamento (D6) e scollegamento (D8). Le acque stradali possono essere infiltrate soltanto se vengono depurate a sufficienza nel suolo; per le superfici di traffico pubbliche il Cantone Argovia richiede a tal fine un passaggio nel suolo di almeno 20 cm di strato superiore e 30 cm di strato inferiore del suolo, mentre gli accessi e i parcheggi privati vengono disciplinati separatamente."
  },
  {
   "key": "untergrund",
   "titel": "Capacità di assorbimento del sottosuolo",
   "text": "Il suolo assorbe acqua? Lo mostra soltanto una prova di infiltrazione in loco. La sola rimozione della pavimentazione non ripristina la capacità di assorbimento e di accumulo compromessa dalla compattazione. Desigillare significa quindi non solo aprire, ma ripristinare il suolo. Se la prova dà esito negativo, la ritenzione con scarico a portata limitata rimane possibile, ma soltanto con uno spazio di ritenzione e un troppopieno."
  },
  {
   "key": "quelle",
   "titel": "Fonte d’acqua",
   "text": "Da dove proviene l’acqua che le piante devono far evaporare? Nelle vicinanze raggiungibili si producono acque dei tetti il cui proprietario acconsente all’utilizzo, oppure devono prima essere condotte fin lì tramite uno scollegamento? Senza un approvvigionamento idrico garantito il raffrescamento evaporativo nei periodi di calura non è assicurato; l’ombreggiatura rimane efficace."
  },
  {
   "key": "schutz",
   "titel": "Oggetti protetti e spazi di protezione",
   "text": "Nella superficie si trova una siepe protetta dalla pianificazione dell’utilizzazione, un albero isolato protetto o un oggetto naturale? Tali determinazioni figurano nel piano delle zone edificabili e vincolano la progettazione. Verificare al contempo se la superficie si trova in uno spazio prioritario dell’infrastruttura ecologica; lì un’esecuzione di tipo naturale è non solo ammissibile, ma auspicata."
  }
 ],
 "kernregel": [
  "Le misure che dipendono dall’acqua necessitano di una fonte nello stesso pacchetto.",
  "Il principio della città spugna funziona come una catena: l’acqua cade sul tetto, viene trattenuta lì o al suolo, si infiltra, è a disposizione della vegetazione ed evapora. Se manca un anello, l’intera catena non funziona.",
  "Ogni adduzione necessita di un impianto di destinazione ammissibile. Se viene meno un impianto di destinazione, si considera dapprima il successivo ammissibile; solo in assenza di un impianto di destinazione viene meno l’adduzione. La stessa acqua conta una sola volta.",
  "Attribuzione in questa guida: una postazione arborea senza adduzione (D4) non rientra in questa regola; riceve soltanto le precipitazioni presenti sul posto, che il substrato accumula, e la scelta delle specie segue la regola 2 delle regole dalla pratica. Nel percorso standard di questo albero decisionale è considerata trincea alberata (D5) la postazione arborea con allacciamento realizzato in modo permanente a una superficie di tetto; un allacciamento permanente non significa afflusso continuo, bensì afflusso in caso di precipitazioni. Ulteriori adduzioni vanno esaminate separatamente dal punto di vista specialistico (D5)."
 ],
 "baumGrenze": "Ciò che l’albero decisionale non decide: un tetto di ritenzione (D7) viene proposto soltanto insieme allo scollegamento. Se un tetto senza impianto di destinazione al suolo sia comunque idoneo come tetto di ritenzione è oggetto di una verifica specialistica a sé (riserva portante, impermeabilizzazione, scheda tecnica D7). Se l’albero decisionale non porta ad alcuna misura, la superficie resta per il momento esclusa; annotare la motivazione.",
 "randbedingungen": [
  {
   "key": "kaltluft",
   "text": "Mantenere liberi i corridoi di aria fredda"
  },
  {
   "key": "ortsbild",
   "text": "Protezione dell’immagine dell’abitato e dei monumenti"
  },
  {
   "key": "werkleitungen",
   "text": "Condotte di servizio e sottofondo"
  },
  {
   "key": "hangwasser",
   "text": "Acqua di versante"
  },
  {
   "key": "unterhalt",
   "text": "Garantire la manutenzione"
  }
 ],
 "massnahmenIntro": "I dati sull’effetto di raffrescamento e sulla ritenzione provengono dalla valutazione contenuta nel lavoro di diploma. Volume di ritenzione, fabbisogno di superficie, costi e durata di vita sono ivi documentati in parte soltanto come ipotesi dichiarate e perciò non sono riportati qui; le schede tecniche complete con tutti i campi e le fonti si trovano nell’allegato A8 del lavoro. L’effetto di raffrescamento è indicato ovunque come temperatura percepita. I dati sulla temperatura superficiale sono stati omessi intenzionalmente: è determinante ciò che una persona percepisce sulla superficie.",
 "massnahmen": {
  "D1": {
   "name": "Pavimentazione permeabile",
   "was": "Desigillazione parziale con grigliato erboso, pavimentazione con giunti inerbiti o ghiaia compattata. Le precipitazioni si infiltrano attraverso i giunti invece di defluire in superficie; dalla zona dei giunti inerbita evapora acqua che raffredda l’ambiente circostante.",
   "kuehl": "temperatura percepita inferiore fino a 7 °C durante il giorno",
   "rueck": "grigliato erboso fino all’80 %, pavimentazioni permeabili fino al 40 % di deflusso superficiale in meno",
   "zul": "Condizionata. Le acque stradali possono essere infiltrate soltanto se vengono depurate a sufficienza nel suolo, ad esempio tramite un passaggio nel suolo. Su superfici poco gravate come stalli di parcheggio, accessi e piazzali antistanti non critico.",
   "ja": "superfici poco gravate come stalli di parcheggio, accessi, piazzali antistanti, percorsi ciclabili e pedonali; sottosuolo permeabile presente",
   "nein": "superfici con traffico intenso o superfici con elevati requisiti di pulizia e servizio invernale",
   "pruef": "permeabilità del sottosuolo, distanza dalla falda, carico inquinante dell’acqua di risulta",
   "komb": "scollegamento delle superfici dei tetti per l’adduzione di acque dei tetti, postazione arborea per l’ombreggiatura"
  },
  "D2": {
   "name": "Desigillazione completa con inverdimento",
   "was": "Demolizione della superficie pavimentata e successivo inverdimento. Infiltrazione, evaporazione e ombreggiatura agiscono insieme. La guida cantonale designa questa variante come la più efficace per il clima insediativo.",
   "kuehl": "temperatura percepita inferiore fino a 7 °C durante il giorno",
   "rueck": "strato di humus come accumulo d’acqua; deflusso superficiale fortemente ridotto",
   "zul": "Ammissibile. Il passaggio nel suolo funge da stadio di depurazione; non si produce alcuna immissione diretta nel sottosuolo.",
   "ja": "si può rinunciare all’utilizzo della superficie e il suolo non è contaminato",
   "nein": "la superficie è necessaria per il traffico, il parcheggio o le manifestazioni",
   "pruef": "inquinamento del suolo da sostanze nocive, compattazione del sottosuolo, valorizzazione del materiale di scavo secondo l’ordinanza sui rifiuti",
   "komb": "postazione arborea per l’ombreggiatura, avvallamento di ritenzione per una ritenzione supplementare"
  },
  "D3": {
   "name": "Pavimentazione chiara ad albedo elevato",
   "was": "Le superfici chiare riflettono una quota maggiore della radiazione solare, invece di accumulare l’energia e restituirla con ritardo sotto forma di calore. La misura agisce esclusivamente a livello termico.",
   "kuehl": "temperatura percepita inferiore fino a 3 °C",
   "rueck": "nessuna",
   "zul": "Ammissibile. Non avviene alcun intervento nell’evacuazione delle acque.",
   "ja": "la superficie deve rimanere pavimentata ed è fortemente soleggiata durante il giorno",
   "nein": "ci si attende un contributo al bilancio idrico o può verificarsi abbagliamento",
   "pruef": "compatibilità con l’immagine dell’abitato, effetto abbagliante, onere di pulizia",
   "komb": "postazione arborea, perché l’ombreggiatura previene il riscaldamento in modo più efficace della riflessione"
  },
  "D4": {
   "name": "Postazione arborea con substrato per città spugna, senza adduzione",
   "was": "Fossa d’impianto generosa con substrato che accumula acqua. L’albero ombreggia la superficie e raffredda per evaporazione; il substrato accumula acque meteoriche e contribuisce all’approvvigionamento idrico.",
   "kuehl": "temperatura percepita inferiore di oltre 8 °C all’ombra dell’albero",
   "rueck": "un grande albero fa evaporare diverse centinaia di litri al giorno",
   "zul": "Ammissibile. Senza adduzione l’ubicazione riceve soltanto le precipitazioni presenti sul posto. Un’adduzione di acque stradali non fa parte di D4: richiede il passaggio nel suolo secondo la pagina 4 della guida, e il substrato per alberi non lo sostituisce.",
   "ja": "sono presenti spazio radicale e distanza dalle condotte di servizio e l’approvvigionamento idrico può essere garantito",
   "nein": "la superficie ha costruzioni nel sottosuolo o la copertura non è sufficiente",
   "pruef": "se un albero esistente può essere conservato tramite un miglioramento del suolo; condotte di servizio, distanze dal confine, scelta delle specie inclusa l’emissione di isoprene (salici, pioppi)",
   "komb": "desigillazione completa per il collegamento aperto con il suolo; con superficie di tetto allacciata l’ubicazione vale in questa guida come trincea alberata (D5)"
  },
  "D5": {
   "name": "Trincea alberata con adduzione d’acqua",
   "was": "L’acqua piovana viene captata e convogliata nella zona della vegetazione e delle radici, vi si infiltra lentamente ed evapora attraverso l’albero. Il caso normale sono acque dei tetti non inquinate; acque stradali e di piazzali soltanto alle condizioni cantonali, mai in una zona di protezione delle acque sotterranee.",
   "kuehl": "come per la postazione arborea, al limite superiore dell’intervallo",
   "rueck": "alleggerimento della canalizzazione al di fuori dei mesi invernali",
   "zul": "Ammissibile con acque dei tetti non inquinate, ma soltanto al di fuori delle zone di protezione delle acque sotterranee, con 20 cm di strato superiore e 30 cm di strato inferiore del suolo e fusto posizionato in posizione rialzata. Acque stradali soltanto se la classe di carico, il settore di protezione delle acque e la distanza dalla falda lo consentono secondo le disposizioni cantonali; ciò viene chiarito da uno specialista.",
   "ja": "nelle vicinanze raggiungibili si producono acque dei tetti non inquinate e il sottosuolo assorbe acqua",
   "nein": "le acque dei tetti hanno un carico inquinante (rame, zinco o piombo privi di rivestimento su ampie superfici), la superficie si trova in una zona di protezione delle acque sotterranee o sono disponibili soltanto acque stradali che non soddisfano le condizioni cantonali",
   "pruef": "fonte d’acqua, settore di protezione delle acque e zona di protezione delle acque sotterranee, per le acque stradali la classe di carico, capacità di infiltrazione, assenza di ristagno nella zona del fusto",
   "komb": "tetto di ritenzione e scollegamento delle superfici dei tetti come fonte d’acqua"
  },
  "D6": {
   "name": "Avvallamento di ritenzione",
   "was": "Un avvallamento del terreno inverdito accoglie le acque meteoriche, le trattiene e le cede con ritardo al suolo e alla vegetazione. Nei periodi asciutti fa parte della superficie verde utilizzabile.",
   "kuehl": "come una superficie inverdita",
   "rueck": "riduce il deflusso superficiale e taglia i picchi di deflusso",
   "zul": "Ammissibile con acqua non inquinata. In caso di adduzione di acque stradali è necessario un pretrattamento, sulle superfici di traffico pubbliche un passaggio nel suolo di 20 cm di strato superiore e 30 cm di strato inferiore del suolo.",
   "ja": "è disponibile una superficie libera con pendenza verso l’afflusso e il sottosuolo è permeabile",
   "nein": "il livello della falda è elevato o la superficie è utilizzata per altri scopi",
   "pruef": "prova di infiltrazione, rapporto tra superficie allacciata e superficie ricevente, troppopieno di emergenza, limitazione della profondità, inclinazione del pendio (inferiore al 3 % non problematica, a partire da circa il 5 % sono necessarie cascate)",
   "komb": "scollegamento delle superfici dei tetti come adduzione, postazione arborea al bordo dell’avvallamento"
  },
  "D7": {
   "name": "Tetto di ritenzione con inverdimento intensivo",
   "was": "Struttura di tetto inverdita con strato di substrato e, sotto di esso, un elemento di accumulo e drenaggio. Le precipitazioni vengono trattenute nel loro primo punto di impatto, in parte fatte evaporare attraverso la vegetazione e restituite con ritardo.",
   "kuehl": "nessun effetto documentato per lo spazio stradale; raffrescamento evaporativo sopra il tetto",
   "rueck": "coefficiente di deflusso nettamente inferiore a quello di un tetto piano, a seconda dello spessore della struttura",
   "zul": "Ammissibile. Le acque dei tetti non inquinate sono l’adduzione idonea per trincee alberate e avvallamenti di ritenzione.",
   "ja": "l’impermeabilizzazione del tetto viene comunque risanata e la riserva portante è comprovata",
   "nein": "la superficie del tetto è interamente impegnata per il fotovoltaico o la statica non consente un carico aggiuntivo",
   "pruef": "capacità portante in stato saturo d’acqua, impermeabilizzazione, accesso per la manutenzione",
   "komb": "trincea alberata e avvallamento di ritenzione come elementi a valle della cascata"
  },
  "D8": {
   "name": "Scollegamento delle superfici dei tetti verso spazi verdi adiacenti",
   "was": "L’evacuazione delle acque del tetto viene separata dalla canalizzazione e convogliata, tramite una canaletta di scarico o una condotta drenante, su ampia superficie in uno spazio verde adiacente. L’acqua si infiltra attraverso lo strato di suolo biologicamente attivo, è a disposizione della vegetazione e viene fatta evaporare da essa.",
   "kuehl": "indirettamente tramite l’approvvigionamento idrico della vegetazione",
   "rueck": "alleggerisce la canalizzazione nella misura delle acque dei tetti gestite in loco; i troppopieni vanno considerati nel dimensionamento",
   "zul": "Ammissibile per le acque dei tetti, a condizione che la copertura non sia costituita su ampie superfici da rame, zinco o piombo privi di rivestimento (valore indicativo di 50 m² di tutte le superfici di contatto); alluminio e acciaio al cromo sono considerati non problematici.",
   "ja": "una superficie verde sufficientemente grande con pendenza può essere collegata al pluviale",
   "nein": "la copertura del tetto contiene su ampie superfici rame, zinco o piombo privi di rivestimento o può formarsi ristagno d’acqua presso gli edifici",
   "pruef": "zona di protezione delle acque sotterranee e settore di protezione delle acque, distanza dal piano interrato, permeabilità, rapporto tra superficie allacciata e superficie ricevente",
   "komb": "trincea alberata e avvallamento di ritenzione come elementi riceventi"
  }
 },
 "regelnIntro": "Queste regole non sono legate a una singola superficie, ma decidono del successo. Provengono da progetti realizzati e da informazioni specialistiche.",
 "regeln": [
  [
   "Conservare in primo luogo gli alberi esistenti.",
   "Prima di ogni nuova piantagione verificare se un albero esistente possa essere salvato allentando il terreno compattato e con un substrato che accumula acqua."
  ],
  [
   "Orientare la scelta delle specie alla quantità d’acqua garantita.",
   "Le specie con elevato fabbisogno idrico, come i salici, evaporano soltanto finché hanno acqua a disposizione. Dove non esiste un’adduzione permanente vanno scelte specie che non necessitano di irrigazione supplementare."
  ],
  [
   "Scegliere secondo il principio golenale.",
   "Per le ubicazioni che oscillano tra siccità e ristagno sono adatte essenze legnose della golena a legno tenero e a legno duro. I tipi di alberi stradali a chioma stretta forniscono poca ombra e poca evaporazione."
  ],
  [
   "Prestare attenzione all’effetto collaterale.",
   "Singoli generi come salici e pioppi emettono molto isoprene, che nelle giornate calde contribuisce alla formazione di ozono. La diversità nel popolamento aumenta al contempo la robustezza."
  ],
  [
   "Piantare una misura più piccola.",
   "Gli alberi piantati troppo grandi hanno difficoltà a continuare a crescere in qualsiasi substrato; le qualità più piccole attecchiscono meglio."
  ],
  [
   "Non solo aprire il suolo, ma ricostituirlo.",
   "La sola rimozione della pavimentazione non ripristina la capacità di assorbimento e di accumulo compromessa dalla compattazione."
  ],
  [
   "Utilizzare materiali locali.",
   "A partire da circa cinquanta chilometri di percorso di trasporto, l’onere del trasporto supera il valore del materiale. Mettere a concorso il substrato in base alle sue proprietà, ossia a struttura stabile e granulometria grossolana con basso contenuto di humus, e non in base a un prodotto."
  ],
  [
   "Pianificare anche la manutenzione e conoscere le prescrizioni.",
   "Un impianto di infiltrazione va controllato periodicamente nel suo funzionamento, pulito e monitorato per quanto riguarda l’inquinamento del suolo da sostanze nocive; il troppopieno di emergenza deve condurre al di sopra del livello del terreno, e il fondo del bacino e la scarpata sono utilizzabili soltanto come prato da strame. Così prescrive il Cantone Argovia. Senza una cura graduata un avvallamento perde la propria capacità di infiltrazione. Chiarire la competenza prima dell’attuazione."
  ],
  [
   "Coinvolgere precocemente la popolazione.",
   "La partecipazione non aumenta soltanto l’accettazione, ma riduce le opposizioni e accelera così l’attuazione."
  ],
  [
   "Rivolgersi alle superfici private.",
   "Una grande parte delle superfici sigillate si trova su terreno privato. Le prescrizioni tramite la licenza edilizia vi hanno effetto solo in caso di progetti edilizi; chi vuole ottenere di più necessita di uno strumento di incentivazione, ad esempio il rimborso della tassa di allacciamento in caso di scollegamento permanente."
  ]
 ],
 "herkunft": [
  "Questa guida è un risultato del lavoro di diploma «Entsiegelung als Massnahme zur Reduktion urbaner Hitzeinseln in Schweizer Städten» di Loris Beriger, TEKO Olten, 2026, caso di studio area insediativa di Zofingen. Versione del 4 novembre 2026, stato di revisione 6 dell’8 novembre 2026, rielaborata dopo la valutazione di tre test di applicazione; non testata nuovamente. È stata testata la versione del 19 ottobre 2026, supplemento 2; risultati e limiti nel capitolo 9.3 del lavoro.",
  "Basi: guida cantonale sullo sviluppo insediativo adattato al caldo, legge e ordinanza sulla protezione delle acque, pubblicazioni specialistiche sulla ricerca sui substrati per alberi nonché informazioni specialistiche presso la città e il Cantone. I riferimenti completi alle fonti si trovano nel lavoro.",
  "I valori caratteristici relativi a volume di ritenzione, fabbisogno di superficie, costi e durata di vita si basano nel lavoro in parte su ipotesi dichiarate. Questa guida non sostituisce un preventivo di spesa."
 ],
 "baumLesen": [
  "Le domande da 1 a 3 descrivono l’ubicazione (rimanere pavimentata, prova di infiltrazione, acque dei tetti), la domanda 4 verifica il pacchetto. I dati dell’ubicazione non cambiano se in seguito una misura viene stralciata.",
  "La domanda 3 va risposta con Sì soltanto se sono soddisfatte entrambe le condizioni: le acque dei tetti possono essere utilizzate ed esiste un impianto di destinazione ammissibile, ossia una superficie verde ricevente con pendenza, un posto per una trincea alberata (D5) o una superficie libera per un avvallamento (D6). Lo scollegamento (D8) riceve un impianto di destinazione, in quest’ordine; la stessa acqua conta una sola volta.",
  "Una postazione arborea (D4) presuppone in ogni ramo un posto albero disponibile; in caso di prova di infiltrazione negativa, inoltre, uno spazio di ritenzione con troppopieno. Senza spazio di ritenzione rimane in tal caso soltanto la pavimentazione chiara (D3).",
  "La domanda 4 verifica singolarmente ogni misura del pacchetto, anche l’acqua addotta. In caso di No: stralciare soltanto la misura non ammissibile, poi ricominciare dalla domanda 1; i dati dell’ubicazione restano, ciò che è stato stralciato vale come non esistente. Se dopo di ciò manca qualsiasi impianto di destinazione, la domanda 3 è No: vale il pacchetto senza acque dei tetti, D1 e, con posto albero, D4, senza tetto di ritenzione (D7)."
 ]
};
