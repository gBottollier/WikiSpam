// Generate 200 moving star dust
const starContainer = document.querySelector('.background-stars');
const starsCount = 200;

for(let i=0; i<starsCount; i++){
  const star = document.createElement('div');
  star.classList.add('star');

  // Random initial position
  star.style.top = Math.random() * 100 + '%';
  star.style.left = Math.random() * 100 + '%';

  // Random size & opacity
  const size = Math.random() * 2 + 1;
  star.style.width = size + 'px';
  star.style.height = size + 'px';
  star.style.opacity = Math.random() * 0.6 + 0.2;

  // Random animation duration and delay
  const duration = 5 + Math.random() * 15;
  star.style.animationDuration = duration + 's';
  star.style.animationDelay = Math.random() * duration + 's';

  starContainer.appendChild(star);
}

// Randomize orbs initial positions
document.querySelectorAll('.orb').forEach(orb => {
  orb.style.top = Math.random() * 80 + 150 + 'px'; // offset for navbar
  orb.style.left = Math.random() * 90 + 'vw';
});
