//条件：主体id:main,移动对象class:movebody,线条画板class:lines,线条class:line

//取消右击菜单
$(document).ready(function(){
    $(document).bind("contextmenu",function(e){
        return false;
    });
});
//初始化
var xx = 0;                                     //鼠标x轴
var yy = 0;                                     //鼠标y轴
var select_obj = {'obj':'','type':''};          //选中物体,type：object-物体,point-切点
var draw_start_x = 0;                           //选中物体起始x轴
var draw_start_y = 0;                           //选中物体起始y轴
var main_left = $('#main').offset().left        //画板起始x
var main_top = $('#main').offset().top          //画板起始y
// 获取物体中心点坐标方法
function get_center(that){
    var left = $(that).position().left;
    var top = $(that).position().top;
    var width = $(that).width();
    var height = $(that).height();
    var x = left+width/2-main_left;
    var y = top+height/2-main_top;
    return [x,y]
}
// 获取C曲线两切点坐标方法(暂定1/3与2/3点)
function get_points_xy(start_x,start_y,end_x,end_y){
    var point1_x = (end_x-start_x)/3+start_x
    var point1_y = (end_y-start_y)/3+start_y
    var point2_x = 2*(end_x-start_x)/3+start_x
    var point2_y = 2*(end_y-start_y)/3+start_y
    return {'point1_x':point1_x,'point1_y':point1_y,'point2_x':point2_x,'point2_y':point2_y}
}
//选中移动物体
$('#main').on('mousedown','.movebody',function(e) {
    xx = e.pageX;
    yy = e.pageY; 
    var array = get_center(this);
    draw_start_x = array[0];
    draw_start_y = array[1];
    if(e.which==1){
        select_obj.obj = this;
        select_obj.type = 'object';
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
    if(select_obj.obj==this){
        var new_xx = e.pageX;
        var new_yy = e.pageY;
        var move_x = $(this).position().left - main_left + new_xx - xx;
        var move_y = $(this).position().top - main_top+ new_yy - yy;
        $(this).css('left',move_x).css('top',move_y);
        //选择过中心线条移动
        var array = get_center(this);
        var center_x = array[0];
        var center_y = array[1];
        var xystr = draw_start_x+','+draw_start_y;
        var move_x = center_x-draw_start_x;
        var move_y = center_y-draw_start_y;
        //起始点为移动物体线条处理
        $('.line[d^="M '+xystr+'"]').each(function(){
            var select_path_id = $(this).attr('id');
            var $point1 = $('.point1[for="'+select_path_id+'"]');
            var $point2 = $('.point2[for="'+select_path_id+'"]');
            // 获取尾部未移动坐标
            var old_d = $(this).attr('d');
            var x2y2 = $point2.attr('cx')+','+$point2.attr('cy');
            var end_str = old_d.split(x2y2)[1];
            var end_x = parseFloat(end_str.split(',')[0]);
            var end_y = parseFloat(end_str.split(',')[1]);
            // 获取point1与point2坐标，切点未移动过则保持默认值移动，移动过则不再动
            var result = get_points_xy(center_x,center_y,end_x,end_y);
            var point1_x = result.point1_x;
            var point1_y = result.point1_y;
            var point2_x = result.point2_x;
            var point2_y = result.point2_y;
            if($point1.hasClass('moved')){
                point1_x = $point1.attr('cx');
                point1_y = $point1.attr('cy');
            }
            if($point2.hasClass('moved')){
                point2_x = $point2.attr('cx');
                point2_y = $point2.attr('cy');
            }
            $point1.attr({'cx':point1_x,'cy':point1_y});
            $point2.attr({'cx':point2_x,'cy':point2_y});
            var new_path = 'M '+center_x+','+center_y+' C '+point1_x+','+point1_y+' '+point2_x+','+point2_y+end_str;
            $(this).attr('d',new_path);
        })
        //结束点为移动物体线条处理
        $('.line[d$="'+xystr+'"]').each(function(){
            var select_path_id = $(this).attr('id');
            var $point1 = $('.point1[for="'+select_path_id+'"]');
            var $point2 = $('.point2[for="'+select_path_id+'"]');
            // 获取头部未移动坐标
            var old_d = $(this).attr('d');
            var start_str = old_d.split('C')[0];
            var start_x = parseFloat(start_str.split(',')[0].split('M')[1]);
            var start_y = parseFloat(start_str.split(',')[1]);
            // 获取point1与point2坐标，切点未移动过则保持默认值移动，移动过则不再动
            var result = get_points_xy(start_x,start_y,center_x,center_y);
            var point1_x = result.point1_x;
            var point1_y = result.point1_y;
            var point2_x = result.point2_x;
            var point2_y = result.point2_y;
            if($point1.hasClass('moved')){
                point1_x = $point1.attr('cx');
                point1_y = $point1.attr('cy');
            }
            if($point2.hasClass('moved')){
                point2_x = $point2.attr('cx');
                point2_y = $point2.attr('cy');
            }
            $point1.attr({'cx':point1_x,'cy':point1_y});
            $point2.attr({'cx':point2_x,'cy':point2_y});
            var new_path = start_str+' C '+point1_x+','+point1_y+' '+point2_x+','+point2_y+' '+center_x+','+center_y;
            $(this).attr('d',new_path);
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
        select_obj = {'obj':'','type':''};
    }else if(e.which==3){
        if($(this).hasClass('selected')){
            $(this).removeClass('selected');
        }else{
            //有空线条则选中
            if(!$('path[d="'+path+'"]').length){
                var array = get_center(this);
                var draw_end_x = array[0];
                var draw_end_y = array[1];
                var result = get_points_xy(draw_start_x,draw_start_y,draw_end_x,draw_end_y);
                var point1_x = result.point1_x;
                var point1_y = result.point1_y;
                var point2_x = result.point2_x;
                var point2_y = result.point2_y;
                var path = 'M '+draw_start_x+','+draw_start_y+' C '+point1_x+','+point1_y+' '+point2_x+','+point2_y+' '+draw_end_x+','+draw_end_y;
                var $line = $('path[d=""]').eq(0);
                $line.attr('d',path);
                //画切点
                var select_path_id = $line.attr('id');
                $('.point1[for="'+select_path_id+'"]').attr({'cx':point1_x,'cy':point1_y,'r':'5'});
                $('.point2[for="'+select_path_id+'"]').attr({'cx':point2_x,'cy':point2_y,'r':'5'});
            }
            $('.movebody').removeClass('selected');
        }   
    }
}); 

// 选中切点
$('#main').on('mousedown','.point1,.point2',function(e) {
    var select_path_id = $(this).attr('for');
    select_obj.obj = this;
    select_obj.type = 'point';
    xx = e.pageX;
    yy = e.pageY;
})

// 切点移动
$('#main').mousemove(function(e) {
    if(select_obj.type == 'point'){
        var end_xx = e.pageX;
        var end_yy = e.pageY;
        //点动
        var $point = $(select_obj.obj);
        var old_cx = parseFloat($point.attr('cx'));
        var old_cy = parseFloat($point.attr('cy'));
        var new_xx = end_xx-xx+old_cx;
        var new_yy = end_yy-yy+old_cy;
        $point.attr({'cx':new_xx,'cy':new_yy});
        $point.addClass('moved');
        //线动
        var select_path_id = $point.attr('for');
        var $path = $('#'+select_path_id)
        var old_d = $path.attr('d');
        var head = old_d.split('C')[0];
        var c_array = old_d.split('C')[1].split(' ');
        var new_path;
        if($point.hasClass('point1')){
            new_path = head+'C '+new_xx+','+new_yy+' '+c_array[2]+' '+c_array[3];
        }else if($point.hasClass('point2')){
            new_path = head+'C '+c_array[1]+' '+new_xx+','+new_yy+' '+c_array[3];
        }
        $path.attr('d',new_path);
        xx = end_xx;
        yy = end_yy;
    }
})

// 鼠标抬起重新初始化
$('body').mouseup(function(e) {  
    select_obj = {'obj':'','type':''};
    $('.movebody').removeClass('selected');
}); 

//动态添加svg方法
var path_id = 1;
function addsvg(){
    $('#main').prepend('<svg class="movebody" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" style="fill:blue;"/></svg>');
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');   //创建svg元素
    $(path).addClass('line').attr({'stroke':'black','stroke-width':'2','fill':'none','d':'','id':'path_'+path_id});
    var point1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');   
    $(point1).addClass('point1').attr({'cx':'','cy':'','r':'','fill':'red','for':'path_'+path_id});
    var point2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');   
    $(point2).addClass('point2').attr({'cx':'','cy':'','r':'','fill':'red','for':'path_'+path_id});
    $('.lines').append(path).append(point1).append(point2);
    path_id += 1;
}