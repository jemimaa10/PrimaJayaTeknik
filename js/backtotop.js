// Back To Top Button
let mybutton = null;
window.onscroll = function() {scrollFunction()};

function scrollFunction() {
  // This file loads from <head> on several templates, so the element does not exist yet when the
  // script runs; it is resolved on the first scroll instead, then kept.
  if (!mybutton) mybutton = document.getElementById("backtotop");
  if (!mybutton) return; // Not every page renders a #backtotop element.
  if (document.body.scrollTop > 50 || document.documentElement.scrollTop > 20) {
    mybutton.style.display = "block";
  } else {
    mybutton.style.display = "none";
  }
}
function topFunction() {
  document.body.scrollTop = 0; // For Safari
  document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}
