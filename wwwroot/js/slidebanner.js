const swiper = new Swiper('.slide-banner-slider', {  
  loop: false,
  autoplay: {
    delay : 1500,
  }, 
  speed : 600,
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  }
});
