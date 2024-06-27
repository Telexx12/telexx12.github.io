let navButton = document.getElementById("navButton");
let navContainer = document.getElementById("navContainer");
let innerCircle = document.getElementById("innerCircle");
let outerCircle = document.getElementById("outerCircle");
let navCloseButtonContainer = document.getElementById("navCloseButtonContainer");
let navCloseButton = document.getElementById("navCloseButton");

let modes = ["production", "development"];
let mode = modes[0];
let durationMultiplier = mode === "development" ? 10 : 1;



navButton.addEventListener("click", function(){

    gsap.fromTo(navContainer,{width:"0%", height:"0%"},{width:"100vw",height:"70vh",display:"block"});
    gsap.fromTo(innerCircle,{width:"0%", height:"0%"},{width:"100%", height:"100%", duration:0.6 * durationMultiplier});
    gsap.fromTo(outerCircle,{width:"0%", height:"0%"},{width:"100%", height:"100%", duration:0.5 * durationMultiplier});   

    gsap.fromTo(navCloseButtonContainer,{bottom:"-3.5rem"},{bottom:"3.5rem", display:"flex", duration:0.5 * durationMultiplier});
    gsap.to(navCloseButton,{rotation:450, duration:0.6 * durationMultiplier});
    gsap.from(".menu_item", {duration: 1,scale: 0.5,y: 50,opacity: 0,ease: "power2.out"});
}); 

navCloseButton.addEventListener("click", function(){
    // gsap.fromTo(innerCircle, { width: "100%", height: "100%" }, { width: "0%", height: "0%", duration: 0.6 * durationMultiplier });
    // gsap.fromTo(outerCircle, { width: "100%", height: "100%" }, { width: "0%", height: "0%", duration: 0.5 * durationMultiplier });
    // gsap.fromTo(navContainer, { width: "100vw", height: "70vh" }, { width: "0%", height: "0%", display: "none" });

    // gsap.fromTo(navCloseButtonContainer, { bottom: "3.5rem" }, { bottom: "-3.5rem", display: "none", duration: 0.5 * durationMultiplier });
    // gsap.to(navCloseButton, { rotation: 0, duration: 0.6 * durationMultiplier });

    gsap.timeline()
    .fromTo(innerCircle, { width: "100%", height: "100%" }, { width: "0%", height: "0%", duration: 0.6 * durationMultiplier })
    .fromTo(navContainer, { width: "100vw", height: "70vh" }, { width: "0%", height: "0%", display: "none" }, "+=0.1") // start after innerCircle and outerCircle complete
    
    gsap.fromTo(outerCircle, { width: "100%", height: "100%" }, { width: "0%", height: "0%", duration: 0.5 * durationMultiplier })
    gsap.fromTo(navCloseButtonContainer, { bottom: "3.5rem" }, { bottom: "-3.5rem", display: "none", duration: 0.5 * durationMultiplier })
    gsap.to(navCloseButton, { rotation: 0, duration: 0.6 * durationMultiplier }); 
});