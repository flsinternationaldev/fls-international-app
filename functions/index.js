const functions = require('firebase-functions'),
    express = require('express'),
    path = require('path'),
    jsonfile = require('jsonfile'),
    bodyParser = require('body-parser'),
    nodemailer = require('nodemailer'),
// TODO: Figure out if there's a way to only get the 'auto' function
    async = require('async'),
    engines = require('consolidate');

const app = express();

// Enable the ability to read env files
require('dotenv').config();

app.use(bodyParser.urlencoded({ extended: true}));

app.engine('hbs', engines.handlebars);
app.set('views', './views');
app.set('view engine', 'hbs');

app.use(express.static(path.join(__dirname, 'assets')));

// Variables to hold on to very simple state
// TODO: May need to rethink this, eventually
let globals = {
    numTestQuestions: null,
    userData: null
}

app.get('/', (req, res) => {
    res.set('Cache-Control', 'public, max-age=300, s-maxage=600');

    return async.auto({
        countriesJson: cb => {
            jsonfile.readFile(path.join(__dirname, 'assets/js/countries.json'), (err, obj) => {
                if (err) {
                    console.log('error retrieving countries json', err);
                    return cb(err);
                }
        
                cb(null, obj);
            });
        },
        testJson: cb => {
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

        globals.numTestQuestions = results.testJson.length;

        const pageProperties = {
            title: 'FLS International Proficiency Test',
            countries: results.countriesJson || null,
            ptQuestions: results.testJson || null,
            numTestQuestions: globals.numTestQuestions,
            // TODO: Investigate a better method for importing partials
            partials: {
                preArrivalTest: path.join(__dirname, 'assets/partials/preArrivalTest'),
                proficiencyTest: path.join(__dirname, 'assets/partials/proficiencyTest'),
                completed: path.join(__dirname, 'assets/partials/completed'),
                loader: path.join(__dirname, 'assets/partials/loader'),
                scripts: path.join(__dirname, 'assets/partials/scripts')
            }
        };
    
        return res.render('index', pageProperties)
    });
});

app.post('/pre-arrival-test', (req, res) => {
    res.status(200).json({ msg: 'this is what success feels like', payload: req.body });
});

app.post('/grade-test', (req, res) => {
    // TODO: Implement caching for JSON files
    return jsonfile.readFile(path.join(__dirname, 'assets/js/proficiency-test-answers.json'), (err, testAnswers) => {
        if (err) {
            console.log('error retrieving proficiency-test-answers json', err);
            return res.status(400).send( { err });
        }

        const testResponseData = req.body;

        if (testResponseData.length !== globals.numTestQuestions) return res.status(400).send({ err: 'Please answer all test questions' });
    
        // TODO: Should really include logic that ensures the correct test questions are being compared to the correct answers
        const gradeTest = (testResponseData, testAnswers) => {
            let numCorrect = 0;

            for (let i = 0; i < testResponseData.length; i++) {
                if (testResponseData[i].selectedOptionId == testAnswers[i].correctOptionId) numCorrect++;
            }

            return numCorrect;
        }

        // TODO: This very obviously needs to be extracted, likely into another file
        const emailTestResults = async () => {
            console.log('constructing email', process.env.EMAIL_PASSWORD);
            const transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 587,
                // TODO: Does this need to be true?
                secure: false,
                auth: {
                    user: process.env.EMAIL_USERNAME,
                    pass: process.env.EMAIL_PASSWORD
                }
            });

            const info = await transporter.sendMail({
                from: 'gabriel gonzalvez',
                to: 'akingdebased@gmail.com',
                subject: 'Test Results',
                // TODO: This, rather obviously, needs finessing
                html: `<h2>Proficiency Test Results</h2></p>Correct responses: <strong>${gradeTest(testResponseData, testAnswers)}/${globals.numTestQuestions}</strong></p>`
            });

            console.log(`email has been sent with messageID ${info.messageId}`);
        }

        emailTestResults()
        .catch(err => console.log('error sending email', err));

        return res.status(200).json({ msg: 'successfully graded test', gradedTest: gradeTest(testResponseData, testAnswers) });
    });
});

exports.app = functions.https.onRequest(app);