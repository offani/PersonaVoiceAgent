const startBtn = document.getElementById('start-btn');
const statusText = document.getElementById('status');
const responseText = document.getElementById('response-text');
const visualizerBars = document.querySelectorAll('.bar');

// Check browser support
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const synthesis = window.speechSynthesis;

if (!SpeechRecognition) {
    statusText.textContent = "Browser not supported. Please use Chrome.";
    startBtn.disabled = true;
} else {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    startBtn.addEventListener('click', () => {
        recognition.start();
        statusText.textContent = "Listening...";
        startBtn.disabled = true;
        setVisualizer(true);
        responseText.classList.remove('visible');
    });

    recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        statusText.textContent = `You said: "${transcript}"`;
        setVisualizer(false);

        // Send to backend
        try {
            const response = await fetch('http://127.0.0.1:4032/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: transcript }),
            });

            const data = await response.json();
            const botResponse = data.response;

            responseText.textContent = botResponse;
            responseText.classList.add('visible');
            speak(botResponse);

        } catch (error) {
            console.error('Error:', error);
            statusText.textContent = "Error connecting to backend.";
            startBtn.disabled = false;
        }
    };

    recognition.onspeechend = () => {
        recognition.stop();
        statusText.textContent = "Processing...";
        setVisualizer(false);
    };

    recognition.onerror = (event) => {
        statusText.textContent = `Error: ${event.error}`;
        startBtn.disabled = false;
        setVisualizer(false);
    };
}

function speak(text) {
    if (synthesis.speaking) {
        console.error('speechSynthesis.speaking');
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.onstart = () => {
        statusText.textContent = "Speaking...";
        setVisualizer(true);
    };

    utterance.onend = () => {
        statusText.textContent = "Click to speak again";
        startBtn.disabled = false;
        setVisualizer(false);
    };

    utterance.onerror = (event) => {
        console.error('SpeechSynthesisUtterance.onerror');
        startBtn.disabled = false;
        setVisualizer(false);
    };

    synthesis.speak(utterance);
}

function setVisualizer(active) {
    visualizerBars.forEach((bar, index) => {
        if (active) {
            bar.style.animationDelay = `${index * 0.1}s`;
            bar.classList.add('active');
        } else {
            bar.classList.remove('active');
            bar.style.height = '10px';
        }
    });
}
