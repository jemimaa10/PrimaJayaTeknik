const swiper = new Swiper('.fullsize-banner-slider', {  
  loop: true,
  autoplay: {
    delay : 2500,
  }, 
  speed : 600,
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  } 
});
