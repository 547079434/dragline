//画方格
for(i=1;i<=160;i++){
    $('.content').append('<div class="rect"></div>');        
}
//参数
var obj_width = $('.object').width();
var obj_height = $('.object').height();
var rect_width = $('.rect').width();
var rect_height = $('.rect').height();

$('.object').click(function(){
    //获取移动格数
    var num = 1;
    //获取范围内方格
    var left = $(this).position().left;
    var top = $(this).position().top;
})

$('.main').on('click','.rect',function(){
    //点击方格移动位置
    var left = $(this).position().left - 1 + (rect_width-obj_width)/2 + 2;
    var top = $(this).position().top - 1 + (rect_height-obj_height)/2 + 2;
    $('.object').animate({left:left});
    $('.object').animate({top:top});
})