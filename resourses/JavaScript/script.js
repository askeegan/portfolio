/* Typed Name*/
var typed = new Typed(".auto-type", {
    strings: [
      " I'm Alex Keegan",
      " A Self Taught Developer",
      " Based in Germany",
    ],
    typeSpeed: 120,
    backSpeed: 20,
    loop: true,
  });

/* Hamburger Menu*/
const bar = document.getElementById('bar');
const nav = document.getElementById('navbar-1');
const close = document.getElementById('close');
    
    if (bar) {
        bar.addEventListener('click', () => {
          nav.classList.add('active');
        });
    }

    if (close) {
        close.addEventListener('click', () => {
          nav.classList.remove('active');
        });
    } 

/* Contact Form */