let navButton = document.getElementById("navButton");
let navContainer = document.getElementById("navContainer");
let innerCircle = document.getElementById("innerCircle");
let outerCircle = document.getElementById("outerCircle");

let modes = ["production", "development"];
let mode = modes[0];
console.log(mode);

navButton.addEventListener("click", function(){
    let durationMultiplier = mode === "development" ? 10 : 1;

    gsap.fromTo(navContainer,{width:"0%", height:"0%"},{width:"100vw",height:"70vh",display:"block"});
    gsap.fromTo(innerCircle,{width:"0%", height:"0%"},{width:"100%", height:"100%", duration:0.6 * durationMultiplier});
    gsap.fromTo(outerCircle,{width:"0%", height:"0%"},{width:"100%", height:"100%", duration:0.5 * durationMultiplier});   
}); 