document.addEventListener('DOMContentLoaded', () => {

    // 1. Generate Stars
    const starsContainer = document.getElementById('stars-container');
    const numStars = 150;
    for (let i = 0; i < numStars; i++) {
        const star = document.createElement('div');
        star.classList.add('star');
        const size = Math.random() * 2 + 1;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.left = `${Math.random() * 100}vw`;
        star.style.top = `${Math.random() * 100}vh`;
        star.style.animationDelay = `${Math.random() * 5}s`;
        starsContainer.appendChild(star);
    }

    // 2. Mobile Menu
    const hamburger = document.querySelector('.hamburger');
    const mobileNav = document.querySelector('.mobile-nav');
    const mobileLinks = document.querySelectorAll('.mobile-link');
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('open');
        mobileNav.classList.toggle('open');
    });
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('open');
            mobileNav.classList.remove('open');
        });
    });

    // 3. Navbar Scrolled
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 4. Reveal Animations
    const revealElements = document.querySelectorAll('.reveal');
    const revealOnScroll = () => {
        let windowHeight = window.innerHeight;
        let elementVisible = windowHeight - 100;
        revealElements.forEach(el => {
            let elementTop = el.getBoundingClientRect().top;
            if (elementTop < elementVisible) {
                el.classList.add('active');
            }
        });
    };
    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll();

    // 5. Cinematic Parallax for Floating People
    const parallaxLayers = document.querySelectorAll('.parallax-layer');
    let currentScroll = 0;
    let targetScroll = 0;
    
    window.addEventListener('scroll', () => { targetScroll = window.scrollY; });

    function smoothParallax() {
        // Linear interpolation (lerp) for buttery smooth transition
        currentScroll += (targetScroll - currentScroll) * 0.1;

        parallaxLayers.forEach(layer => {
            const speed = parseFloat(layer.getAttribute('data-speed'));
            const yPos = -(currentScroll * speed);
            
            // Respect previous horizontal flips: women and child flipped, or specific classes
            // Base CSS has:
            // woman: transform: scaleX(-1);
            // man: transform: scaleX(-1);
            // child: transform: scaleX(-1);
            // girl: filter and none
            let scaleString = '';
            if (layer.classList.contains('floating-person-woman') || 
                layer.classList.contains('floating-person-man') || 
                layer.classList.contains('floating-person-child')) {
                scaleString = ' scaleX(-1)';
            }
            
            layer.style.transform = `translateY(${yPos}px)${scaleString}`;
        });
        
        requestAnimationFrame(smoothParallax);
    }
    smoothParallax();


    // 6. Winners True Infinite Carousel
    const track = document.getElementById('winners-carousel-track');
    const prevButton = document.querySelector('.carousel-control.prev');
    const nextButton = document.querySelector('.carousel-control.next');
    
    if (track) {
        let isTransitioning = false;
        // The card is 300px + 30px gap
        const shiftAmount = '330px'; 

        function slideNext() {
            if (isTransitioning) return;
            isTransitioning = true;
            track.style.transition = 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)';
            track.style.transform = `translateX(-${shiftAmount})`;
            
            track.addEventListener('transitionend', function onEnd() {
                track.removeEventListener('transitionend', onEnd);
                track.style.transition = 'none';
                track.style.transform = 'translateX(0)';
                track.appendChild(track.firstElementChild); // move first element to the end
                setTimeout(() => { isTransitioning = false; }, 50);
            });
        }

        function slidePrev() {
            if (isTransitioning) return;
            isTransitioning = true;
            // Move last element to the start
            track.insertBefore(track.lastElementChild, track.firstElementChild);
            track.style.transition = 'none';
            track.style.transform = `translateX(-${shiftAmount})`;
            
            // Force browser reflow to apply the 'none' transition before overriding
            void track.offsetWidth; 

            track.style.transition = 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)';
            track.style.transform = 'translateX(0)';
            
            track.addEventListener('transitionend', function onEnd() {
                track.removeEventListener('transitionend', onEnd);
                isTransitioning = false;
            });
        }

        if (nextButton) nextButton.addEventListener('click', () => {
            slideNext();
            resetAutoScroll();
        });
        
        if (prevButton) prevButton.addEventListener('click', () => {
            slidePrev();
            resetAutoScroll();
        });

        // Auto Scroll Interval
        let autoScrollTimer = setInterval(slideNext, 4000);

        function resetAutoScroll() {
            clearInterval(autoScrollTimer);
            autoScrollTimer = setInterval(slideNext, 4000);
        }
    }


    // 7. Countdowns
    let countdownDate = new Date();
    countdownDate.setDate(countdownDate.getDate() + 12);
    countdownDate.setHours(countdownDate.getHours() + 7);
    countdownDate.setMinutes(countdownDate.getMinutes() + 4);

    const dfH = document.querySelector('#hero-countdown');
    const dfS = document.querySelector('#sorteo-countdown');

    function flipUnit(unit, newValue) {
        if (!unit) return;
        const top = unit.querySelector('.top');
        const bottom = unit.querySelector('.bottom');
        const flipTop = unit.querySelector('.flip-top');
        const flipBottom = unit.querySelector('.flip-bottom');
        const card = unit.querySelector('.flip-card');

        const currentVal = top.innerText;
        if (currentVal === String(newValue) && currentVal !== "") return;
        
        if (currentVal === "") {
            top.innerText = newValue;
            bottom.innerText = newValue;
            flipTop.innerText = newValue;
            flipBottom.innerText = newValue;
            return;
        }

        // Cancel previous animation
        card.classList.remove('flipping');
        void card.offsetWidth;
        
        top.innerText = newValue;
        flipTop.innerText = currentVal;
        flipBottom.innerText = newValue;
        bottom.innerText = currentVal;
        
        card.classList.add('flipping');
        
        setTimeout(() => {
            bottom.innerText = newValue;
            flipTop.innerText = newValue;
        }, 800);
    }

    function updateTimeElements(container, d, h, m, s) {
        if (!container) return;
        flipUnit(container.querySelector('[data-time="days"]'), d < 10 ? '0' + d : String(d));
        flipUnit(container.querySelector('[data-time="hours"]'), h < 10 ? '0' + h : String(h));
        flipUnit(container.querySelector('[data-time="mins"]'), m < 10 ? '0' + m : String(m));
        flipUnit(container.querySelector('[data-time="secs"]'), s < 10 ? '0' + s : String(s));
    }

    function updateMsElements() {
        const now = new Date().getTime();
        const gap = countdownDate.getTime() - now;
        
        let msVal = '00';
        if (gap > 0) {
            const ms = Math.floor((gap % 1000) / 10);
            msVal = ms < 10 ? '0' + ms : String(ms);
        }
        
        const hMs = dfH?.querySelector('.ms-card');
        const sMs = dfS?.querySelector('.ms-card');
        if (hMs) hMs.innerText = msVal;
        if (sMs) sMs.innerText = msVal;
    }

    function countdown() {
        const now = new Date().getTime();
        const gap = countdownDate.getTime() - now;

        const second = 1000;
        const minute = second * 60;
        const hour = minute * 60;
        const day = hour * 24;

        if (gap < 0) {
            updateTimeElements(dfH, 0, 0, 0, 0);
            updateTimeElements(dfS, 0, 0, 0, 0);
            return;
        }

        const d = Math.floor(gap / day);
        const h = Math.floor((gap % day) / hour);
        const m = Math.floor((gap % hour) / minute);
        const s = Math.floor((gap % minute) / second);

        updateTimeElements(dfH, d, h, m, s);
        updateTimeElements(dfS, d, h, m, s);
    }
    setInterval(countdown, 1000);
    setInterval(updateMsElements, 30);
    countdown();
    updateMsElements();
});
