const functions = require('firebase-functions');
const express = require('express');
const path = require('path');
const jsonfile = require('jsonfile');
const bodyParser = require('body-parser');
// TODO: Figure out if there's a way to only get the 'auto' function
const async = require('async');
// TODO: Consolidate?
const engines = require('consolidate');

const app = express();

app.use(bodyParser.urlencoded({ extended: true}));

app.engine('hbs', engines.handlebars);
app.set('views', './views');
app.set('view engine', 'hbs');

app.use(express.static(path.join(__dirname, 'assets')));

app.get('/', (req, res) => {
    res.set('Cache-Control', 'public, max-age=300, s-maxage=600');

    async.auto({
        countriesJson: cb => {
            jsonfile.readFile(path.join(__dirname, 'assets/js/countries.json'), (err, obj) => {
                if (err) {
                    console.log('error retrieving countries json', err);
                    return cb(err);
                }
        
                cb(null, obj);
            });
        },
        quizJson: cb => {
            jsonfile.readFile(path.join(__dirname, 'assets/js/proficiency-test.json'), (err, obj) => {
                if (err) {
                    console.log('error retrieving proficiency-test json', err);
                    return cb(err);
                }
        
                cb(null, obj);
            });
        }
    }, (err, results) => {
        if (err) console.log('something went wrong reading the JSONs', err);

        const pageProperties = {
            title: 'FLS International Proficiency Test',
            countries: results.countriesJson || null,
            proficiencyTest: results.quizJson || null,
            partials: {
                beginTest: path.join(__dirname, 'assets/partials/beginTest'),
                proficiencyTest: path.join(__dirname, 'assets/partials/proficiencyTest'),
                loader: path.join(__dirname, 'assets/partials/loader')
            }
        };
    
        res.render('index', pageProperties)
    });
});

app.post('/proficiency-test', (req, res) => {
    res.status(200).json({ msg: 'this is what success feels like'});
});

app.post('/grade-test', (req, res) => {
    res.status(200).json({ msg: 'i wanna grade you so bad, baby', payload: req.body });
});

exports.app = functions.https.onRequest(app);
