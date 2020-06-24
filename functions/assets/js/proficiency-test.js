const mainContentEl = document.querySelector('.pt__main-content'),
    beginTestTemplate = document.querySelector('#begin-test-template').content,
    beginTestNode = document.importNode(beginTestTemplate, true);

// Always render the begin-test-template on page load
// mainContentEl.appendChild(beginTestNode);

// Catch all handler for delegated click events
mainContentEl.addEventListener('click', e => {
    const clickedEl = e.target;

    if (clickedEl.classList.contains('pt__begin-test-button')) {
        const postBeginTest = async () => {
            const response = await fetch('/proficiency-test', { method: 'POST' }),
                parsedResponse = await response.json();

                console.log('the sweet taste of success', parsedResponse);
        }
    
        postBeginTest();
    }

    if (clickedEl.classList.contains('pt__submit-grade-button')) {    
        // Convert the nodeList querySelectorAll returns into an array
        const testQuestionsEls = Array.apply(null, document.querySelectorAll('.pt__test-question-container')),
            testGlobals = document.querySelector('.pt__test-globals').dataset;

        let testResponseData = [];

        testQuestionsEls.forEach(testQuestionEl => {
            const testQuestionOptions = Array.apply(null, testQuestionEl.querySelectorAll('.pt__test-options-container input')),
                selectedOption = testQuestionOptions.find(testQuestionOption => testQuestionOption.checked);

            if (selectedOption)  {
                testResponseData.push({
                    questionId: testQuestionEl.dataset.questionId,
                    selectedOptionId: selectedOption.dataset.optionId
                })
            } 
        });

        // TODO: The function definitions should be pulled out of here, maybe put in another file
        const postGradeTest = async (testResponses) => {
            const response = await fetch('/grade-test', { 
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(testResponses)
                });

            return response;
        }

        if (testResponseData.length < testGlobals.numTestQuestions) {
            // TODO: Error handling
            console.log(`user didn't answer all qu1estions`);
        } else {
            postGradeTest(testResponseData)
            .then(response => {
                if (response.status >= 400) throw Error(response.statusText);

                return response.json();
            })
            .then(parsedResponse => {
                console.log('the parsed response!', parsedResponse);

                return;
            })
            .catch(err => {
                // TODO: Handle errors from the server ... eventually
                console.log('error with test', err)
            });
        }
    }
});

// Navbar color change logic
const navbarEl = document.querySelector('.navbar'),
    colorChangePoint = navbarEl.offsetTop;

window.addEventListener('scroll', () => {
    if (window.pageYOffset > colorChangePoint) {
        navbarEl.classList.add('navbar--scrolled');
    } else {
        navbarEl.classList.remove('navbar--scrolled');
    }
})
