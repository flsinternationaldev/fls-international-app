const functions = require('firebase-functions');
const express = require('express');
// TODO: Consolidate?
const engines = require('consolidate');

const app = express();
app.engine('hbs', engines.handlebars);
app.set('views', './views');
app.set('view engine', 'hbs');

app.get('/', (request, response) => {
    response.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    response.render('proficiency-test', { bullshit: ['this', 'is', 'bullshit'] })
});

app.post('/proficiency-test', (request, response) => {

});

exports.app = functions.https.onRequest(app);
