window.onscroll=()=>{
    if(window.scrollY>0){
        document.querySelector('.header').classList.add('active');
    }
    else{
        document.querySelector('.header').classList.remove('active');
    }
};
window.onload=()=>{
    if(window.scrollY>0){
        document.querySelector('.header').classList.add('active');
    }else{
        document.querySelector('.header').classList.remove('active');
    }
};
$("button").click(function() {
    $('html,body').animate({
        scrollTop: $(".second").offset().top+220},
        'slow');
});
$(".nav").click(function() {
    $('html,body').animate({
        scrollTop: $(".first").offset().top},
        'slow');
});
$(".nava").click(function() {
    $('html,body').animate({
        scrollTop: $(".second").offset().top + 220},
        'slow');
});
$(".navp").click(function() {
    $('html,body').animate({
        scrollTop: $(".third").offset().top},
        'slow');
});
$(".navc").click(function() {
    $('html,body').animate({
        scrollTop: $(".fourth").offset().top},
        'slow');
});