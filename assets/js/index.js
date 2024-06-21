console.log('teszt');

let navButton = document.getElementById("navButton");
let navContainer = document.getElementById("navContainer");

navButton.addEventListener("click", function(){
    gsap.to(navContainer, 0.3, {display:'block'});
});