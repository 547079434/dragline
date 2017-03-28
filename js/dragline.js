//条件：主体id：main,移动对象class：movebody,线条class：line

//取消右击菜单
$(document).ready(function(){
    $(document).bind("contextmenu",function(e){
        return false;
    });
});
//初始化
var xx = 0;                                  //鼠标x轴
var yy = 0;                                  //鼠标y轴
var select_obj = '';                         //选中物体
var draw_start_x = 0;                        //选中物体起始x轴
var draw_start_y = 0;                        //选中物体起始y轴
var main_left = $('#main').offset().left
var main_top = $('#main').offset().top
//获取物体中心点坐标方法
function get_center(that){
    var left = $(that).position().left;
    var top = $(that).position().top;
    var width = $(that).width();
    var height = $(that).height();
    var x = left+width/2-main_left;
    var y = top+height/2-main_top;
    return [x,y]
}
//选中移动物体
$('#main').on('mousedown','.movebody',function(e) {
    xx = e.pageX;
    yy = e.pageY; 
    var array = get_center(this);
    draw_start_x = array[0];
    draw_start_y = array[1];
    if(e.which==1){
        select_obj = this;
    }else if(e.which==3){
        if($(this).hasClass('selected')){
            $(this).removeClass('selected');
        }else{
            $(this).addClass('selected');
        }
    }
}); 
//移动
$('#main').on('mousemove','.movebody',function(e) { 
    if(select_obj==this){
        var new_xx = e.pageX;
        var new_yy = e.pageY;
        var move_x = $(this).position().left - main_left + new_xx - xx;
        var move_y = $(this).position().top - main_top+ new_yy - yy;
        $(this).css('left',move_x).css('top',move_y);
        //选择过中心线条移动
        var array = get_center(this);
        var center_x = array[0];
        var center_y = array[1];
        var oldstr = draw_start_x+','+draw_start_y;
        var newstr = center_x+','+center_y;
        $('.line[d*="'+oldstr+'"]').each(function(){
            var d_array = $(this).attr('d').split(oldstr);
            $(this).attr('d',d_array[0]+newstr+d_array[1]);
        })
        //参数重新调整
        xx = new_xx;
        yy = new_yy;
        draw_start_x = center_x
        draw_start_y = center_y
    }
}); 
//画线
$('#main').on('mouseup','.movebody',function(e) { 
    var end_xx = e.pageX;
    var end_yy = e.pageY;
    if(e.which==1){
        select_obj = '';
    }else if(e.which==3){
        if($(this).hasClass('selected')){
            $(this).removeClass('selected');
        }else{
            var array = get_center(this);
            draw_end_x = array[0];
            draw_end_y = array[1];
            //未画线则选中初始线条
            var path = 'M '+draw_start_x+','+draw_start_y+' L '+draw_end_x+','+draw_end_y;
            if(!$('path[d="'+path+'"]').length){
                var $line = $('path[d=""]').eq(0);
                $line.attr('d',path)
            }
            $('.movebody').removeClass('selected');
        }   
    }
}); 


$('body').mouseup(function(e) {  
    select_obj = '';
    $('.movebody').removeClass('selected');
}); 