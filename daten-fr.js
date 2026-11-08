'use strict';
// Französische Fassung der Leitfadentexte (daten.js, Rev. 6).
// Übersetzung durch ein Sprachmodell, nicht fachlich geprüft. Massgebend bleibt der deutsche Originaltext in daten.js.
// Zahlen, Einheiten, Quellen, Bedingungen und Entscheidungslogik stammen unverändert aus dem Original (maschinell verglichen).
LFT.fr = {
 "fassung": "Version du 4 novembre 2026, état de révision 6 du 8 novembre 2026",
 "fassungKurz": "Rév. 6 du 8.11.2026",
 "einleitung": "Le présent guide conduit d’une surface soumise à des contraintes à un paquet de mesures motivé ; il ne remplace pas une planification spécialisée. La chaleur et les fortes pluies sont traitées ensemble, parce que les surfaces imperméabilisées stockent la chaleur et laissent ruisseler la pluie ; celui qui ouvre le sol et retient l’eau sur place agit contre les deux, pour autant que les plantes puissent évaporer l’eau. Pour cela, vous avez besoin d’un accès aux portails cartographiques de la Confédération et du canton, de la planification des conduites des services industriels et de l’assainissement des routes de votre commune et, dès l’étape 3, d’un spécialiste pour l’essai d’infiltration.",
 "schritte": [
  {
   "nr": 1,
   "titel": "Contraintes",
   "frage": "Où les contraintes sont-elles les plus élevées sur le territoire urbanisé ?",
   "ergebnis": "Classement des surfaces établi à partir des cartes d’évaluation cantonales et de la carte de danger du ruissellement de surface ; degré d’imperméabilisation tiré de la couverture du sol de la mensuration officielle",
   "stelle": "Planification, soutien SIG"
  },
  {
   "nr": 2,
   "titel": "Occasion",
   "frage": "Un assainissement est-il de toute façon prévu sur l’une de ces surfaces ?",
   "ergebnis": "Comparaison avec la planification des conduites des services industriels et de l’assainissement des routes ; fixation de la date",
   "stelle": "Génie civil et services industriels"
  },
  {
   "nr": 3,
   "titel": "Sous-sol et source d’eau",
   "frage": "Le sous-sol absorbe-t-il l’eau, et d’où vient l’eau ?",
   "ergebnis": "Essai d’infiltration ; en cas d’essai négatif, prévoir une évacuation à débit limité avec un espace de rétention. Clarifier la toiture à proximité, l’accès et le tracé de la conduite",
   "stelle": "Génie civil, spécialiste pour l’essai d’infiltration"
  },
  {
   "nr": 4,
   "titel": "Admissibilité de chaque mesure",
   "frage": "Chaque mesure choisie est-elle admissible sur le site ?",
   "ergebnis": "Contrôle, pour chaque mesure, du secteur de protection des eaux, de la distance à la nappe phréatique et de la pollution des eaux générées ; ne supprimer que la mesure inadmissible, conserver les autres composantes ; si l’installation cible d’une amenée d’eau disparaît, examiner d’abord l’installation cible admissible suivante, et ne supprimer l’amenée d’eau que s’il n’y a plus d’installation cible",
   "stelle": "Génie civil, canton en cas de besoin"
  },
  {
   "nr": 5,
   "titel": "Choix des mesures",
   "frage": "Quelle combinaison convient à la surface ?",
   "ergebnis": "Paquet de mesures établi selon l’arbre de décision, étayé par les indications des pages 6 à 9 et intégré dans le projet d’assainissement",
   "stelle": "Génie civil, espaces verts, planification"
  }
 ],
 "schritt2": "L’étape 2 détermine les coûts. Si la désimperméabilisation est intégrée dans une intervention de toute façon prévue, la démolition du revêtement et la remise en état n’entraînent pas de coûts supplémentaires. Une désimperméabilisation ultérieure, sans motif d’assainissement, est nettement plus chère et rarement réalisable dans la pratique.",
 "schritt3": "L’étape 3 détermine la faisabilité. Sans sous-sol capable d’absorber l’eau et sans source d’eau non polluée, les mesures les plus efficaces sont exclues. Cela ne peut pas être compensé par un effort accru ailleurs.",
 "gefaelle": "À l’étape 3, vérifiez aussi la pente. En dessous de 3 %, l’infiltration est en règle générale possible sans mesures de construction spéciales ; à partir d’environ 5 %, il faut des noues en cascade, ce qui augmente la surface et l’effort nécessaires.",
 "karten": [
  {
   "name": "Carte d’évaluation climatique",
   "ebene": "Canton",
   "text": "Montre, pour chaque surface urbanisée, la surchauffe nocturne et la contrainte bioclimatique diurne, chacune en niveaux allant de très favorable à très défavorable. Vous pouvez en lire quels quartiers sont les plus fortement touchés la nuit. Dans le canton d’Argovie, elle se trouve dans la couche « Bewertungskarte Klima 2026 und 2060 (Tag und Nacht) » (carte d’évaluation climatique 2026 et 2060, jour et nuit).",
   "link": "https://www.ag.ch/geoportal/apps/onlinekarten/",
   "linktext": "AGIS, cartes en ligne (canton d’Argovie)"
  },
  {
   "name": "Carte d’analyse climatique",
   "ebene": "Canton",
   "text": "Montre la température de l’air modélisée à 4 heures, par paliers d’un demi-degré, ainsi que les couloirs d’air froid et l’écoulement d’air froid en nappe. Importante pour savoir si une plantation prévue barrerait un flux d’air froid existant.",
   "link": "https://www.ag.ch/geoportal/apps/onlinekarten/",
   "linktext": "AGIS, cartes en ligne (canton d’Argovie)"
  },
  {
   "name": "Carte de danger du ruissellement de surface",
   "ebene": "Confédération",
   "text": "Montre où l’eau ruisselle en surface lors de fortes pluies et à quelle hauteur elle se situe. Uniforme à l’échelle suisse et librement accessible pour chaque commune. Pour la priorisation des surfaces dans le présent travail, les profondeurs d’écoulement supérieures à 0,10 m sont prises en compte. Des profondeurs d’écoulement plus faibles peuvent aussi être pertinentes au niveau des bâtiments.",
   "link": "https://map.geo.admin.ch/?layers=ch.bafu.gefaehrdungskarte-oberflaechenabfluss",
   "linktext": "map.geo.admin.ch"
  },
  {
   "name": "Couverture du sol de la mensuration officielle",
   "ebene": "Canton",
   "text": "Classe chaque surface selon le genre d’objet, par exemple bâtiment, route ou jardin ; le degré d’imperméabilisation en découle. En Argovie, elle est disponible via la boutique de géodonnées AGIS ou geodienste.ch. Les parts de surface et les niveaux sont déterminés par un spécialiste de la commune, au besoin avec un soutien SIG.",
   "link": "https://www.ag.ch/geoportal/geodatenshop/Datensuche",
   "linktext": "Boutique de géodonnées AGIS"
  }
 ],
 "kartenHinweis": "Pour l’étape 1, les cartes et données accessibles au public suffisent ; des mesures ou relevés propres ne sont pas nécessaires à cet effet. L’étape 2 s’appuie sur la planification de l’assainissement et des conduites des services industriels de votre commune, l’étape 3 exige un essai d’infiltration sur place par un spécialiste. Les extraits de cartes peuvent être reproduits dans vos propres documents, avec indication de la source et de la date de consultation. Les cartes climatiques cantonales ne portent pas le même nom dans chaque canton et n’existent pas partout sous la même forme. La carte de danger de la Confédération est en revanche identique dans toute la Suisse. En cas de doute, demandez au service cantonal spécialisé en adaptation au changement climatique quelles cartes s’appliquent à votre commune.",
 "rangliste": [
  "Relever pour chaque surface la surchauffe nocturne sur la carte d’évaluation et la répartir en trois niveaux.",
  "Déterminer pour chaque surface le degré d’imperméabilisation à partir de la couverture du sol de la mensuration officielle et le répartir également en trois niveaux.",
  "Déterminer la part de la surface exposée au danger d’inondation à partir de la carte de danger et la répartir en trois niveaux. Consignez en outre la surface absolue exposée au danger, en mètres carrés.",
  "Additionner les trois niveaux. Les surfaces qui se situent au moins au niveau moyen pour chacune des trois contraintes et au niveau élevé dans la somme ont la priorité. Une surface qui n’est remarquable que pour une seule contrainte n’est pas une zone prioritaire."
 ],
 "ranglisteHinweise": [
  "L’endroit où vous placez les limites entre les niveaux relève d’une décision de votre commune et non d’une limite objective. Consignez la manière dont vous les avez fixées ; sinon le classement ne sera plus compréhensible par la suite.",
  "La part et la surface absolue conduisent à des ordres différents. Une petite surface atteint facilement le niveau le plus élevé via la part, tandis qu’une grande surface comportant beaucoup de surface exposée peut reculer dans le classement. Indiquez les deux grandeurs et justifiez laquelle est déterminante dans le cas particulier."
 ],
 "abklaerungenIntro": "Les cinq points suivants déterminent quelles mesures entrent seulement en considération sur un site. Ils doivent être clarifiés avant le choix des mesures, non après.",
 "abklaerungen": [
  {
   "key": "gws",
   "titel": "Secteur de protection des eaux et eaux souterraines",
   "text": "Dans quel secteur de protection des eaux la surface se situe-t-elle, et à quelle profondeur se trouve la nappe phréatique ? Dans les zones de protection des eaux souterraines S1, S2 et Sh, l’infiltration des eaux pluviales est interdite, dans S3 et Sm elle est fortement restreinte ; l’exécution doit être examinée avec le service spécialisé selon les prescriptions cantonales. Le secteur Au n’est pas une zone de protection. Une distance minimale par rapport au niveau de la nappe phréatique doit être respectée. Les cartes sont tenues par le canton."
  },
  {
   "key": "wasser",
   "titel": "Pollution des eaux générées",
   "text": "Les eaux de toiture sont considérées comme non polluées, pour autant que la couverture ne soit pas constituée, sur de grandes surfaces, de cuivre, de zinc ou de plomb non revêtus (valeur indicative de 50 m² sur l’ensemble des surfaces de contact, telles que gouttières et solins) ; l’aluminium et l’acier au chrome ne posent pas de problème. Cela vaut pour chaque mesure qui reçoit des eaux de toiture : fosse d’arbre avec amenée d’eau (D5), noue (D6) et déconnexion (D8). Les eaux de chaussée ne peuvent être infiltrées que si elles sont suffisamment épurées dans le sol ; pour les surfaces de circulation publiques, le canton d’Argovie exige à cet effet un passage à travers le sol d’au moins 20 cm de couche supérieure du sol et 30 cm de couche inférieure du sol, tandis qu’il règle séparément les accès privés et les places de stationnement."
  },
  {
   "key": "untergrund",
   "titel": "Capacité d’absorption du sous-sol",
   "text": "Le sol absorbe-t-il l’eau ? Seul un essai d’infiltration sur place permet de le savoir. Le seul fait d’enlever le revêtement ne rétablit pas la capacité d’absorption et de stockage altérée par le compactage. Désimperméabiliser ne signifie donc pas seulement ouvrir, mais rétablir le sol. Si l’essai est négatif, la rétention avec évacuation à débit limité reste possible, mais uniquement avec un espace de rétention et un trop-plein."
  },
  {
   "key": "quelle",
   "titel": "Source d’eau",
   "text": "D’où vient l’eau que les plantes doivent évaporer ? Des eaux de toiture sont-elles produites à une proximité accessible, dont les propriétaires consentent à l’utilisation, ou faut-il d’abord les y amener par une déconnexion ? Sans alimentation en eau assurée, le refroidissement par évaporation n’est pas garanti pendant les périodes de chaleur ; l’ombrage reste efficace."
  },
  {
   "key": "schutz",
   "titel": "Objets protégés et espaces protégés",
   "text": "La surface comprend-elle une haie protégée par la planification d’affectation, un arbre isolé protégé ou un objet naturel ? De telles dispositions figurent dans le plan des zones à bâtir et s’imposent à la conception. Vérifiez en même temps si la surface se situe dans un espace prioritaire de l’infrastructure écologique ; dans ce cas, une réalisation proche de l’état naturel est non seulement admissible, mais souhaitée."
  }
 ],
 "kernregel": [
  "Les mesures qui dépendent de l’eau ont besoin d’une source dans le même paquet.",
  "Le principe de la ville-éponge fonctionne comme une chaîne : l’eau tombe sur le toit, y est retenue ou retenue au sol, s’infiltre, est à la disposition de la végétation et s’évapore. Si un maillon manque, la chaîne entière est inefficace.",
  "Chaque amenée d’eau a besoin d’une installation cible admissible. Si une installation cible disparaît, c’est d’abord la suivante admissible qui entre en considération ; l’amenée n’est supprimée que s’il n’y a plus aucune installation cible. La même eau ne compte qu’une seule fois.",
  "Classification dans le présent guide : un emplacement d’arbre sans amenée d’eau (D4) n’est pas soumis à cette règle ; il ne reçoit que les précipitations tombant sur le site, que le substrat stocke, et le choix des espèces suit la règle 2 des règles issues de la pratique. Dans la voie standard de cet arbre de décision, est considéré comme fosse d’arbre avec amenée d’eau (D5) l’emplacement d’arbre doté d’un raccordement durable à une surface de toiture ; un raccordement durable ne signifie pas un apport continu, mais un apport lors de précipitations. D’autres amenées d’eau doivent faire l’objet d’un examen spécialisé séparé (D5)."
 ],
 "baumGrenze": "Ce que l’arbre de décision ne tranche pas : il ne propose une toiture de rétention (D7) qu’en combinaison avec la déconnexion. La question de savoir si une toiture sans installation cible au sol convient malgré tout comme toiture de rétention relève d’un examen spécialisé distinct (réserve de portance, étanchéité, fiche technique D7). Si l’arbre de décision ne conduit à aucune mesure, la surface reste exclue pour le moment ; consignez la justification.",
 "randbedingungen": [
  {
   "key": "kaltluft",
   "text": "Maintenir libres les couloirs d’air froid"
  },
  {
   "key": "ortsbild",
   "text": "Protection des sites construits et des monuments"
  },
  {
   "key": "werkleitungen",
   "text": "Conduites des services industriels et sous-structure"
  },
  {
   "key": "hangwasser",
   "text": "Eaux de versant"
  },
  {
   "key": "unterhalt",
   "text": "Assurer l’entretien"
  }
 ],
 "massnahmenIntro": "Les indications relatives à l’effet de refroidissement et à la rétention proviennent de l’évaluation réalisée dans le travail de diplôme. Le volume de rétention, les besoins en surface, les coûts et la durée de vie n’y sont documentés qu’en partie sous forme d’hypothèses déclarées et ne figurent donc pas ici ; les fiches techniques complètes avec tous les champs et toutes les sources figurent dans l’annexe A8 du travail. L’effet de refroidissement est indiqué partout sous forme de température ressentie. Les indications relatives à la température de surface sont délibérément omises : ce qui compte, c’est ce qu’une personne ressent sur la surface.",
 "massnahmen": {
  "D1": {
   "name": "Revêtement perméable",
   "was": "Désimperméabilisation partielle avec dalles-gazon, pavés à joints enherbés ou revêtement en gravier compacté. Les précipitations s’infiltrent par les joints au lieu de ruisseler en surface ; l’eau s’évapore de la zone de joints végétalisée et rafraîchit les environs.",
   "kuehl": "température ressentie jusqu’à 7 °C plus basse en journée",
   "rueck": "dalles-gazon jusqu’à 80 %, revêtements perméables jusqu’à 40 % de ruissellement de surface en moins",
   "zul": "Sous conditions. Les eaux de chaussée ne peuvent être infiltrées que si elles sont suffisamment épurées dans le sol, par exemple par un passage à travers le sol. Sur des surfaces faiblement polluées telles que places de stationnement, accès et parvis, non critique.",
   "ja": "surfaces faiblement polluées telles que places de stationnement, accès, parvis, chemins cyclables et piétons ; sous-sol perméable existant",
   "nein": "surfaces à fort trafic ou surfaces soumises à de fortes exigences de nettoyage et de service hivernal",
   "pruef": "perméabilité du sous-sol, distance à la nappe phréatique, pollution des eaux générées",
   "komb": "déconnexion des surfaces de toiture pour l’amenée d’eaux de toiture, emplacement d’arbre pour l’ombrage"
  },
  "D2": {
   "name": "Désimperméabilisation complète avec végétalisation",
   "was": "Dépose de la surface revêtue puis végétalisation. L’infiltration, l’évaporation et l’ombrage agissent ensemble. Le guide cantonal désigne cette variante comme la plus efficace pour le climat urbain.",
   "kuehl": "température ressentie jusqu’à 7 °C plus basse en journée",
   "rueck": "couche d’humus comme réservoir d’eau ; ruissellement de surface fortement réduit",
   "zul": "Admissible. Le passage à travers le sol fait office d’étape d’épuration ; il n’y a aucun rejet direct dans le sous-sol.",
   "ja": "l’on peut renoncer à l’usage de la surface et le sol n’est pas pollué",
   "nein": "la surface est nécessaire pour la circulation, le stationnement ou des manifestations",
   "pruef": "charge en polluants du sol, compactage du sous-sol, valorisation des déblais selon l’ordonnance sur les déchets",
   "komb": "emplacement d’arbre pour l’ombrage, noue de rétention pour une rétention supplémentaire"
  },
  "D3": {
   "name": "Revêtement clair à albédo élevé",
   "was": "Les surfaces claires réfléchissent une part plus importante du rayonnement solaire, au lieu de stocker l’énergie et de la restituer avec décalage dans le temps sous forme de chaleur. La mesure agit exclusivement sur le plan thermique.",
   "kuehl": "température ressentie jusqu’à 3 °C plus basse",
   "rueck": "aucune",
   "zul": "Admissible. Il n’y a aucune intervention dans l’évacuation des eaux.",
   "ja": "la surface doit rester revêtue et est fortement ensoleillée en journée",
   "nein": "une contribution au bilan hydrique est attendue ou un éblouissement peut se produire",
   "pruef": "compatibilité avec le site construit, effet d’éblouissement, frais de nettoyage",
   "komb": "emplacement d’arbre, parce que l’ombrage empêche l’échauffement plus efficacement que la réflexion"
  },
  "D4": {
   "name": "Emplacement d’arbre avec substrat ville-éponge, sans amenée d’eau",
   "was": "Fosse de plantation généreuse avec substrat retenant l’eau. L’arbre ombrage la surface et rafraîchit par évaporation ; le substrat stocke les eaux de précipitations et contribue à l’alimentation en eau.",
   "kuehl": "température ressentie de plus de 8 °C plus basse à l’ombre de l’arbre",
   "rueck": "un grand arbre évapore plusieurs centaines de litres par jour",
   "zul": "Admissible. Sans amenée d’eau, l’emplacement ne reçoit que les précipitations tombant sur le site. Une amenée d’eaux de chaussée ne fait pas partie de D4 : elle nécessite le passage à travers le sol selon la page 4 du guide, et le substrat pour arbres ne le remplace pas.",
   "ja": "l’espace racinaire et la distance aux conduites des services industriels sont disponibles et l’alimentation en eau peut être assurée",
   "nein": "des ouvrages souterrains se trouvent sous la surface ou le recouvrement est insuffisant",
   "pruef": "si un arbre existant peut être conservé par amélioration du sol ; conduites des services industriels, distances aux limites, choix des espèces y c. émission d’isoprène (saules, peupliers)",
   "komb": "désimperméabilisation complète pour la liaison avec le sol ouvert ; avec une surface de toiture raccordée, l’emplacement est considéré dans ce guide comme fosse d’arbre avec amenée d’eau (D5)"
  },
  "D5": {
   "name": "Fosse d’arbre avec amenée d’eau",
   "was": "Les eaux pluviales sont captées et conduites dans la zone de végétation et de racines, s’y infiltrent lentement et s’évaporent par l’arbre. Le cas normal est celui des eaux de toiture non polluées ; les eaux de chaussée et de place uniquement aux conditions cantonales, jamais dans une zone de protection des eaux souterraines.",
   "kuehl": "comme pour l’emplacement d’arbre, en haut de la fourchette",
   "rueck": "décharge des canalisations en dehors des mois d’hiver",
   "zul": "Admissible avec des eaux de toiture non polluées, mais uniquement en dehors des zones de protection des eaux souterraines, avec 20 cm de couche supérieure du sol et 30 cm de couche inférieure du sol et un tronc planté en position surélevée. Eaux de chaussée uniquement si la classe de pollution, le secteur de protection des eaux et la distance à la nappe phréatique le permettent selon les prescriptions cantonales ; cela est clarifié par un spécialiste.",
   "ja": "des eaux de toiture non polluées sont produites à proximité accessible et le sous-sol absorbe l’eau",
   "nein": "les eaux de toiture sont polluées (cuivre, zinc ou plomb non revêtus sur de grandes surfaces), la surface se situe dans une zone de protection des eaux souterraines ou seules des eaux de chaussée sont disponibles et ne remplissent pas les conditions cantonales",
   "pruef": "source d’eau, secteur de protection des eaux et zone de protection des eaux souterraines, pour les eaux de chaussée la classe de pollution, capacité d’infiltration, absence de submersion dans la zone du tronc",
   "komb": "toiture de rétention et déconnexion des surfaces de toiture comme source d’eau"
  },
  "D6": {
   "name": "Noue de rétention",
   "was": "Une noue végétalisée reçoit les eaux de précipitations, les retient et les restitue avec retard au sol et à la végétation. En période sèche, elle fait partie de l’espace vert utilisable.",
   "kuehl": "comme une surface végétalisée",
   "rueck": "réduit le ruissellement de surface et écrête les pointes de débit",
   "zul": "Admissible avec de l’eau non polluée. En cas d’amenée d’eaux de chaussée, un prétraitement est nécessaire, et sur les surfaces de circulation publiques un passage à travers le sol de 20 cm de couche supérieure du sol et 30 cm de couche inférieure du sol.",
   "ja": "une surface libre avec pente vers l’arrivée d’eau est disponible et le sous-sol est perméable",
   "nein": "le niveau de la nappe phréatique est élevé ou la surface est utilisée à d’autres fins",
   "pruef": "essai d’infiltration, rapport entre surface raccordée et surface réceptrice, trop-plein de secours, limitation de la profondeur, pente du terrain (inférieure à 3 % : sans problème, à partir d’environ 5 % : cascades nécessaires)",
   "komb": "déconnexion des surfaces de toiture comme amenée d’eau, emplacement d’arbre en bordure de noue"
  },
  "D7": {
   "name": "Toiture de rétention à végétalisation intensive",
   "was": "Complexe de toiture végétalisé avec couche de substrat et, en dessous, élément de stockage et de drainage. Les précipitations sont retenues à leur premier point d’impact, partiellement évaporées par la végétation et restituées avec retard.",
   "kuehl": "aucun effet documenté pour l’espace routier ; refroidissement par évaporation au-dessus de la toiture",
   "rueck": "coefficient de ruissellement nettement inférieur à celui d’un toit plat, selon l’épaisseur de la structure",
   "zul": "Admissible. Les eaux de toiture non polluées constituent l’amenée d’eau appropriée pour les fosses d’arbre avec amenée d’eau et les noues de rétention.",
   "ja": "l’étanchéité de la toiture est de toute façon assainie et la réserve de portance est démontrée",
   "nein": "la surface de toiture est entièrement occupée par le photovoltaïque ou la statique ne permet aucune charge supplémentaire",
   "pruef": "capacité portante à l’état saturé d’eau, étanchéité, accès pour l’entretien",
   "komb": "fosse d’arbre avec amenée d’eau et noue de rétention comme éléments situés en aval dans la cascade"
  },
  "D8": {
   "name": "Déconnexion des surfaces de toiture vers les espaces verts adjacents",
   "was": "L’évacuation des eaux de toiture est séparée des canalisations et conduite, par un caniveau ou une conduite d’infiltration, sur une large surface dans un espace vert adjacent. L’eau s’infiltre à travers la couche de sol vivante, est à la disposition de la végétation et est évaporée par celle-ci.",
   "kuehl": "indirectement par l’alimentation en eau de la végétation",
   "rueck": "décharge les canalisations à hauteur des eaux de toiture gérées sur place ; les trop-pleins doivent être pris en compte lors du dimensionnement",
   "zul": "Admissible pour les eaux de toiture, pour autant que la couverture ne soit pas constituée, sur de grandes surfaces, de cuivre, de zinc ou de plomb non revêtus (valeur indicative de 50 m² pour l’ensemble des surfaces de contact) ; l’aluminium et l’acier au chrome sont considérés comme ne posant pas de problème.",
   "ja": "un espace vert suffisamment grand, avec pente, peut être raccordé à la descente d’eaux pluviales",
   "nein": "la couverture de toiture contient du cuivre, du zinc ou du plomb non revêtus sur de grandes surfaces ou de l’eau stagnante peut se former contre les bâtiments",
   "pruef": "zone de protection des eaux souterraines et secteur de protection des eaux, distance à l’étage souterrain, perméabilité, rapport entre surface raccordée et surface réceptrice",
   "komb": "fosse d’arbre avec amenée d’eau et noue de rétention comme éléments récepteurs"
  }
 },
 "regelnIntro": "Ces règles ne sont pas liées à une surface particulière, mais décident du succès. Elles proviennent de projets réalisés et de renseignements fournis par des spécialistes.",
 "regeln": [
  [
   "Conserver d’abord les arbres existants.",
   "Avant toute nouvelle plantation, vérifiez si un arbre existant peut être sauvé en ameublissant le sol compacté et au moyen d’un substrat retenant l’eau."
  ],
  [
   "Adapter le choix des espèces à la quantité d’eau assurée.",
   "Les espèces gourmandes en eau, comme les saules, n’évaporent que tant que de l’eau est à leur disposition. Là où il n’existe pas d’amenée d’eau durable, il faut choisir des espèces qui se passent d’arrosage supplémentaire."
  ],
  [
   "Choisir selon le principe de la zone alluviale.",
   "Pour les sites qui alternent entre sécheresse et submersion temporaire, les ligneux de la forêt alluviale à bois tendre et à bois dur conviennent. Les types d’arbres de rue à couronne étroite donnent peu d’ombre et peu d’évaporation."
  ],
  [
   "Prêter attention à l’effet secondaire.",
   "Certains genres, comme les saules et les peupliers, émettent beaucoup d’isoprène, qui contribue à la formation d’ozone les jours de chaleur. En même temps, la diversité du peuplement accroît la robustesse."
  ],
  [
   "Planter une taille en dessous.",
   "Les arbres plantés trop grands ont du mal à poursuivre leur croissance, quel que soit le substrat ; les qualités plus petites reprennent mieux."
  ],
  [
   "Ne pas seulement ouvrir le sol, mais le reconstituer.",
   "Le seul fait d’enlever le revêtement ne rétablit pas la capacité d’absorption et de stockage altérée par le compactage."
  ],
  [
   "Utiliser des matériaux locaux.",
   "À partir d’environ cinquante kilomètres de transport, l’effort de transport dépasse la valeur du matériau. Mettez le substrat en soumission sur la base de ses propriétés, c’est-à-dire à structure stable et à gros grains, avec une faible proportion d’humus, et non sur la base d’un produit."
  ],
  [
   "Planifier l’entretien d’emblée et connaître les exigences.",
   "Une installation d’infiltration doit être contrôlée périodiquement quant à son fonctionnement, nettoyée et surveillée quant à la charge en polluants du sol ; le trop-plein de secours doit être conduit au-dessus du niveau du terrain, et le fond du bassin et le talus ne sont utilisables que comme prairie à litière. Le canton d’Argovie le prescrit ainsi. Sans entretien différencié, une noue perd sa capacité d’infiltration. Clarifiez la responsabilité avant la mise en œuvre."
  ],
  [
   "Associer la population dès le début.",
   "La participation n’accroît pas seulement l’acceptation, elle réduit les oppositions et accélère ainsi la mise en œuvre."
  ],
  [
   "Cibler les surfaces privées.",
   "Une grande partie des surfaces imperméabilisées se trouve sur des terrains privés. Les prescriptions imposées par le permis de construire ne s’y appliquent que lors de projets de construction ; quiconque veut aller plus loin a besoin d’un instrument incitatif, par exemple le remboursement de la taxe de raccordement en cas de déconnexion durable."
  ]
 ],
 "herkunft": [
  "Le présent guide est un résultat du travail de diplôme « Entsiegelung als Massnahme zur Reduktion urbaner Hitzeinseln in Schweizer Städten » de Loris Beriger, TEKO Olten, 2026, étude de cas du territoire urbanisé de Zofingen. Version du 4 novembre 2026, état de révision 6 du 8 novembre 2026, remaniée après évaluation de trois tests d’application ; non retestée. La version testée était celle du 19 octobre 2026, complément 2 ; résultats et limites au chapitre 9.3 du travail.",
  "Bases : guide cantonal sur le développement urbain adapté à la chaleur, loi et ordonnance sur la protection des eaux, publications spécialisées sur la recherche relative aux substrats pour arbres ainsi que renseignements fournis par des spécialistes de la ville et du canton. Les références complètes figurent dans le travail.",
  "Les valeurs caractéristiques relatives au volume de rétention, aux besoins en surface, aux coûts et à la durée de vie reposent en partie, dans le travail, sur des hypothèses déclarées. Le présent guide ne remplace pas un devis."
 ],
 "baumLesen": [
  "Les questions 1 à 3 décrivent le site (rester revêtue, essai d’infiltration, eaux de toiture), la question 4 contrôle le paquet de mesures. Les indications sur le site ne changent pas lorsqu’une mesure est supprimée ultérieurement.",
  "On ne peut répondre par oui à la question 3 que si les deux conditions sont remplies : les eaux de toiture peuvent être utilisées, et il existe une installation cible admissible, c’est-à-dire un espace vert récepteur avec pente, une place pour une fosse d’arbre avec amenée d’eau (D5) ou une surface libre pour une noue (D6). La déconnexion (D8) se voit attribuer une installation cible, dans cet ordre ; la même eau ne compte qu’une seule fois.",
  "Un emplacement d’arbre (D4) suppose, dans chaque branche, une place d’arbre disponible ; en cas d’essai d’infiltration négatif, en plus un espace de rétention avec trop-plein. Sans espace de rétention, il ne reste là que le revêtement clair (D3).",
  "La question 4 contrôle chaque mesure du paquet individuellement, y compris l’eau amenée. Si non : ne supprimer que la mesure inadmissible, puis recommencer à la question 1 ; les indications sur le site sont conservées, ce qui a été supprimé est considéré comme inexistant. S’il ne reste ensuite aucune installation cible, la réponse à la question 3 est non : le paquet sans eaux de toiture s’applique, D1 et, en présence d’une place d’arbre, D4, sans toiture de rétention (D7)."
 ]
};
