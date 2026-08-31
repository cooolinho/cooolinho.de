import './style.scss';

const textToType = "Willkommen auf meiner Seite. Scroll down, um mehr zu erfahren.";
const typingElement = document.getElementById('typing-text');

let index = 0;

function typeWriter() {
    if (index < textToType.length) {
        typingElement.textContent += textToType.charAt(index);
        index++;
        setTimeout(typeWriter, 50); // Geschwindigkeit
    }
}

window.addEventListener('load', () => {
    typeWriter();

    // Einfacher Smooth Scroll für Anker-Links (falls vorhanden)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});