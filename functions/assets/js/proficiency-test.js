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
        const postGradeTest = async (testAnswers) => {
            const response = await fetch('/grade-test', { 
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ someFuckingShit: true })
                }),
                parsedResponse = await response.json();

                console.log('the sweet taste of success, for quizzes', parsedResponse);
        }
    
        postGradeTest();
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
