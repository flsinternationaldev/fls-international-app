const functions = require('firebase-functions');
const express = require('express');
const path = require('path');
const jsonfile = require('jsonfile');
// TODO: Consolidate?
const engines = require('consolidate');

const app = express();
app.engine('hbs', engines.handlebars);
app.set('views', './views');
app.set('view engine', 'hbs');

app.use(express.static(path.join(__dirname, 'assets')));

console.log('static directory', path.join(__dirname, 'assets'));
app.get('/', (req, res) => {
    res.set('Cache-Control', 'public, max-age=300, s-maxage=600');

    jsonfile.readFile(path.join(__dirname, 'assets/js/countries.json'), (err, obj) => {
        if (err) console.log('error retrieving countries', err);

        const pageProperties = {
            title: 'FLS International Proficiency Test',
            countries: obj || null
        };
    
        res.render('proficiency-test', pageProperties)
    });
});

app.post('/proficiency-test', (request, res) => {
    res.status(200).json({ msg: 'this is what success feels like'});
});

exports.app = functions.https.onRequest(app);
