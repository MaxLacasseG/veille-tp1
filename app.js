/*jshint esversion: 6 */
const express = require('express');
const app = express();

// Middleware
const bodyParser = require('body-parser');
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())
const cookieParser = require('cookie-parser');
const peupler = require('./component/peupler/index.js');

// Configuration de la traduction
const i18n = require("i18n");
i18n.configure({
    locales: ['fr', 'en'],
    cookie: 'langueChoisie',
    directory: __dirname + '/locales'
});


//Connection à la bdd
const BDD = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
let db;

//Assignation du moteur de rendu et middleware
app.use(express.static(__dirname + '/public/'));
app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(i18n.init);


//====================================================
// ROUTES
//==============================================

//=== ACCUEIL
app.get('/', (req, res) => {
    db.collection('adresse').find().toArray(function (err, resultat) {
        if (err) return console.log(err);
        if (req.cookies.langueChoisie == null) {
            res.cookie('langueChoisie', 'fr ', {
                maxAge: 900000,
                httpOnly: true
            });
            res.setLocale('fr')
        }
        res.render('membres', {
            data: resultat,
            direction: 1,
            cle: null,
            texte: {
                titre: res.__("Gestionnaire d'utilisateurs"),
                nav: {
                    liste: res.__("Liste des membres"),
                    vider: res.__("Vider la liste"),
                    peupler: res.__("Peupler la liste")
                },
                soustitre: res.__("Les membres"),
                entete: {
                    nom: res.__("nom"),
                    prenom: res.__("prénom"),
                    tel: res.__("téléphone"),
                    courriel: res.__("courriel"),
                }
            }
        });
    });
});

//====================
//lien francais
app.get('/fr', (req, res) => {
    res.setLocale('fr')
    res.cookie('langueChoisie', 'fr');
    res.redirect(req.headers.referer);

})

app.get('/en', (req, res) => {
    res.setLocale('en')
    res.cookie('langueChoisie', 'en');
    res.redirect(req.headers.referer);
})
//===================== MODIFIER PAR POST
app.post('/modifier', (req, res) => {
    let adresse = {
        _id : ObjectID(req.body.id),
        prenom: req.body.prenom,
        nom: req.body.nom,
        tel: req.body.tel,
        courriel: req.body.courriel
    };

    db.collection('adresse').save(adresse, (err, enreg) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.redirect('/');
        }
    });
});

// ============ AJOUTER
app.get('/ajouter', (req, res) => {
    db.collection('adresse').insert({}, (err, enreg) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.redirect('/');
        }
    });
});


//============================
//Detruire
//=========================
app.get('/detruireMembre/:id', (req, res) => {
    let id = ObjectID(req.params.id);
    db.collection('adresse').findOneAndDelete({
        _id: id
    }, (err, resultat) => {
        res.redirect('/');
    });
});


//======================
//Trier
//======================
app.get('/trier/:cle/:ordre', (req, res) => {
    let ordre = req.params.ordre == "asc" ? 1 : -1;
    let cle = req.params.cle;
    db.collection('adresse').find().sort(cle, ordre).toArray((err, resultat) => {
        ordre *= -1;
        let direction = (ordre == 1 ? "asc" : "desc");
        return res.render('membres', {
            data: resultat,
            ordre: direction,
            texte: {
                titre: res.__("Gestionnaire d'utilisateurs"),
                nav: {
                    liste: res.__("Liste des membres"),
                    vider: res.__("Vider la liste"),
                    peupler: res.__("Peupler la liste")
                },
                soustitre: res.__("Les membres"),
                entete: {
                    nom: res.__("nom"),
                    prenom: res.__("prénom"),
                    tel: res.__("téléphone"),
                    courriel: res.__("courriel"),
                }
            }
        })
    });
});


//=========================
// Peupler
//==================
app.get('/peuplement', (req, res) => {
    let nouvelleListe = peupler();
    db.collection('adresse').insert(nouvelleListe, (err, enreg) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.redirect('/');
        }
    });
})

//==========================
//Vider liste
//==========================
app.get('/effacer-liste', (req, res) => {
    db.collection('adresse').drop((err, resultat) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.redirect('/');
        }
    });
})

//==========================
//Rechercher membres
//==========================
app.post('/rechercherMembre', (req, res) => {
    console.log(req.body.recherche);
    let recherche = req.body.recherche;
    var requete = {
        $or: [{
            prenom: {
                '$regex': '^' + recherche,
                '$options': 'i'
            }
        }, {
            nom: {
                '$regex': '^' + recherche,
                '$options': 'i'
            }
        }, {
            courriel: {
                '$regex': '^' + recherche,
                '$options': 'i'
            }
        }, {
            tel: {
                '$regex': '^' + recherche,
                '$options': 'i'
            }
        }]
    };

    db.collection('adresse').find(requete).toArray((err, resultat) => {
        if (err) return console.log(err)
        
        res.render('membres', {
            data: resultat,
            direction: 1,
            cle: null,
            texte: {
                titre: res.__("Gestionnaire d'utilisateurs"),
                nav: {
                    liste: res.__("Liste des membres"),
                    vider: res.__("Vider la liste"),
                    peupler: res.__("Peupler la liste")
                },
                soustitre: res.__("Les membres"),
                entete: {
                    nom: res.__("nom"),
                    prenom: res.__("prénom"),
                    tel: res.__("téléphone"),
                    courriel: res.__("courriel"),
                }
            }
        });
    });

});
//==========================
//SECTION PROFIL
//==========================
app.get('/profil/:id', (req, res) => {
    let reqId = ObjectID(req.params.id);
    db.collection('adresse').find({_id: reqId}).toArray((err, resultat) => {
        if (err) return console.log(err)
        res.render('profil', {
            texte: {
                titre: res.__("Gestionnaire d'utilisateurs"),
                nav: {
                    liste: res.__("Liste des membres"),
                    vider: res.__("Vider la liste"),
                    peupler: res.__("Peupler la liste")
                },
                soustitre: res.__("Les membres"),
                entete: {
                    nom: res.__("nom"),
                    prenom: res.__("prénom"),
                    tel: res.__("téléphone"),
                    courriel: res.__("courriel"),
                }
            },
            membreInfos: resultat[0]
        })
    });
})

//=============
//Page 404

app.use((req, res) => {
    res.status(404).render('404', {
        texte: {
            titre: res.__("Gestionnaire d'utilisateurs"),
            nav: {
                liste: res.__("Liste des membres"),
                vider: res.__("Vider la liste"),
                peupler: res.__("Peupler la liste")
            },
            soustitre: res.__("Les membres"),
            entete: {
                nom: res.__("nom"),
                prenom: res.__("prénom"),
                tel: res.__("téléphone"),
                courriel: res.__("courriel"),
            }
        }
    });
});



BDD.connect('mongodb://127.0.0.1:27017', (err, database) => {
    if (err) return console.log(err)
    db = database.db('carnet_adresse')
    // lancement du serveur Express sur le port 8081
    app.listen(8081, () => {
        console.log('connexion à la BD et on écoute sur le port 8081');
    });
});