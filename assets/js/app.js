$(function() {
    $(".image").hide();

    $("#gallery img").click(function(){
        if(!$(this).hasClass("active")){
            $(".image.active").hide().removeClass("active");
            $("#gallery .active").removeClass("active");

            $(this).addClass("active");
            var index = $("#gallery img").index(this);
            $(".image").eq(index).addClass("active").fadeIn();
        }
    });

    $("#next").click(function(){
        slide(-350);
    });
    $("#prev").click(function(){
        slide(350);
    });
})

function slide(amount){
    var goto = parseFloat($("#inner").css("left")) + amount;
    var max = - $("#inner").width() + $("#gallery").width();
    if(goto >= 0){
        goto = 0;
        $("#prev").fadeOut();
    }else{
        $("#prev").fadeIn();
    }
    if(goto <= max){
        goto = max;
        $("#next").fadeOut();
    }else{
        $("#next").fadeIn();
    }
    $("#inner").animate({
        "left": goto + "px"
    }, 500);
}