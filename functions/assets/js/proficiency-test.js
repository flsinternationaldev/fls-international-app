const mainContentEl = document.querySelector('.pt__main-content'),
    preArrivalTestTemplate = document.querySelector('#pre-arrival-test-template').content,
    preArrivalTestNode = document.importNode(preArrivalTestTemplate, true),
    proficiencyTestTemplate = document.querySelector('#proficiency-test-template').content,
    proficiencyTestNode = document.importNode(proficiencyTestTemplate, true),
    completedTemplate = document.querySelector('#completed-template').content,
    completedNode = document.importNode(completedTemplate, true);

// Always render the pre-arrival-test-template on page load
mainContentEl.appendChild(preArrivalTestNode);

// Catch all handler for delegated click events
mainContentEl.addEventListener('click', e => {
    const clickedEl = e.target;

    if (clickedEl.classList.contains('pt__begin-test-button')) {
        const postPreArrivalTest = async (userInfo) => {
            const response = await fetch('/pre-arrival-test', { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userInfo)
            });

            return response;
        }
    
        const preTestEls = Array.apply(null, document.querySelectorAll('.pt__pretest-item'));

        // TODO: Ensure these inputs are VALIDATED and SANITIZED. This is unknown text input from a user, this is a prime XSS vector.
        // Remember, validate.js is a thing
        const userInfo = preTestEls.reduce((accum, preTestEl) => {
            switch (preTestEl.nodeName) {
                // TODO: Kludgy stop gap for the agency field. Needs to be more robust, and be tied to whether or not the user seleted the agency radio
                case 'INPUT': {
                    let inputValue = preTestEl.value.trim();

                    if (preTestEl.name === 'agencyName' && !inputValue) inputValue = 'No agency provided';

                    accum[preTestEl.name] = inputValue;
                    return accum;
                }

                case 'SELECT': {
                    const formattedOption = preTestEl.options[preTestEl.selectedIndex].text.trim().toLowerCase();

                    accum[preTestEl.name] = formattedOption === 'Select a Country'.toLowerCase() ? '' : formattedOption;
                    return accum;
                }
                    
                // TODO: This may not be the most robust way to get form data
                case 'DIV': {
                    const checkedRadioEl = preTestEl.querySelector('input[type="radio"]:checked');
                  
                    if (checkedRadioEl) accum[checkedRadioEl.name] = checkedRadioEl.dataset.radioOption === 'yes';
                    return accum;
                }
            }

            return accum;
        }, {});

        const isValidUserInfo = (userInfo = {}) => {
            if (!userInfo || Object.keys(userInfo).length ===0) return false;

            for (const prop in userInfo) {
                // TODO: No ... just... no.
                if (typeof userInfo[prop] === 'undefined' || userInfo[prop] === null || userInfo[prop] === '') return false;
            }

            return true;
        }

        if (isValidUserInfo(userInfo)) {
            postPreArrivalTest(userInfo)
            .then(response => {
                if (response.status >= 400) throw Error(response.statusText);

                // TODO: Make a generic function for this rendering behavior
                mainContentEl.innerHTML = '';
                mainContentEl.appendChild(proficiencyTestNode);

                return;
            })
            .catch(err => {
                // TODO: Handle errors from the server ... eventually
                console.log('error with test', err)
            });

        } else {
            console.log('user info is not valid');
            // TODO: Error handling
        }
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

        console.log('questions?', testGlobals.numTestQuestions);
        if (testResponseData.length < testGlobals.numTestQuestions) {
            // TODO: Error handling
            console.log(`user didn't answer all qu1estions`);
        } else {
            postGradeTest(testResponseData)
            .then(response => {
                console.log('we posted!');
                if (response.status >= 400) throw Error(response.statusText);

                // TODO: This doesn't feel particularly elegant
                mainContentEl.innerHTML = '';
                mainContentEl.append(completedNode);

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
