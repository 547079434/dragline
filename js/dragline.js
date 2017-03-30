// 构造函数体
var DragLine = function(){

};

// 创建画布
DragLine.CreateBoard = function(that){
    $(that).append('<div id="dragline_board"><svg class="lines" xmlns="http://www.w3.org/2000/svg"></svg></div>');
    // 获取左边距方法
    function get_left(that){
        return $(that).offset().left+parseInt($(that).css('borderLeftWidth').split('px')[0]); 
    }
    // 获取上边距方法
    function get_top(that){
        return $(that).offset().top+parseInt($(that).css('borderTopWidth').split('px')[0]); 
    }
    // 初始化
    var draw_path_id = 1;                              //初始化线条id
    var draw_obj_id = 1;                               //初始化物体id
    var action_status = 0;                             //操作状态码, 0-无操作,1-移动,2-画线,3-删除
    var stroke_style = 0;                              //线条状态码, 0-实线,1-虚线
    var stroke_color = 'black';                        //线条颜色
    var xx = 0;                                        //鼠标x轴
    var yy = 0;                                        //鼠标y轴
    var select_obj = {'obj':'','type':''};             //选中物体,type：object-物体,point-切点
    var draw_id = '';                                  //右击初始物体id
    var draw_start_x = 0;                              //选中物体起始x轴
    var draw_start_y = 0;                              //选中物体起始y轴
    var main_left = get_left($('#dragline_board'));    //画布左边距
    var main_top = get_top($('#dragline_board'));      //画布上边距
    // 绑定选中移动物体事件
    $('#dragline_board').on('mousedown','.movebody',function(e) {
        xx = e.pageX;
        yy = e.pageY; 
        var array = get_center(this);
        draw_start_x = array[0];
        draw_start_y = array[1];
        if(action_status==1){
            select_obj.obj = this;
            select_obj.type = 'object';
        }else if(action_status==2){
            if($(this).hasClass('selected')){
                $(this).removeClass('selected');
            }else{
                draw_id = $(this).attr('id');
                $(this).addClass('selected');
            }
        }
    }); 
    // 获取物体定位点坐标方法(无定位点，则选取中心点)
    function get_center(that){
        var x,y;
        var left = $(that).position().left;
        var top = $(that).position().top;
        var width = $(that).width();
        var height = $(that).height();
        if($(that).hasClass('fix_point')){
            x = left+parseInt($(that).attr('fix-x'))-main_left;
            y = top+parseInt($(that).attr('fix-y'))-main_top;
        }else{
            x = left+width/2-main_left;
            y = top+height/2-main_top;
        }
        return [x,y]
    }

    // 获取C曲线两切点坐标方法(默认切点为1/3与2/3点)
    function get_points_xy(start_x,start_y,end_x,end_y){
        var point1_x = (end_x-start_x)/3+start_x
        var point1_y = (end_y-start_y)/3+start_y
        var point2_x = 2*(end_x-start_x)/3+start_x
        var point2_y = 2*(end_y-start_y)/3+start_y
        return {'point1_x':point1_x,'point1_y':point1_y,'point2_x':point2_x,'point2_y':point2_y}
    }

    // 线条随物体移动方法,type:1(已知起始点)2(已知结束点)
    function move_line(that,center_x,center_y,type){
        var select_path_id = $(that).attr('id');
        var $point1 = $('.point1[for="'+select_path_id+'"]');
        var $point2 = $('.point2[for="'+select_path_id+'"]');
        var start_x,start_y,end_x,end_y;
        if(type==1){
            // 获取结束点坐标
            var $link2 = $('#'+$(that).attr('link2'));
            var link_array = get_center($link2);
            start_x = center_x;
            start_y = center_y;
            end_x = link_array[0];
            end_y = link_array[1];
        }else if(type==2){
            // 获取起始点坐标
            var $link1 = $('#'+$(that).attr('link1'));
            var link_array = get_center($link1);
            var start_x = link_array[0];
            var start_y = link_array[1];
            end_x = center_x;
            end_y = center_y;
        }
        // 获取point1与point2坐标，切点未移动过则保持默认值移动，移动过则不再动
        var result = get_points_xy(start_x,start_y,end_x,end_y);
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
        var new_path = 'M '+start_x+','+start_y+' C '+point1_x+','+point1_y+' '+point2_x+','+point2_y+' '+end_x+','+end_y;
        $(that).attr('d',new_path);
        //切线动
        var $line1 = $('.line1[for="'+select_path_id+'"]');
        var $line2 = $('.line2[for="'+select_path_id+'"]');
        $line1.attr({'x1':start_x,'y1':start_y,'x2':point1_x,'y2':point1_y});
        $line2.attr({'x1':end_x,'y1':end_y,'x2':point2_x,'y2':point2_y});
    }

    // 删除线条及相关切线切点方法
    function delete_line(id){
        $('#'+id).attr({'d':'','link1':'','link2':'','stroke':'black','stroke-dasharray':''});
        $('.point1[for="'+id+'"]').attr({'cx':'','cy':''}).css('display','none');
        $('.point2[for="'+id+'"]').attr({'cx':'','cy':''}).css('display','none');
        $('.line1[for="'+id+'"]').attr({'x1':'','y1':'','x2':'','y2':''}).css('display','none');
        $('.line2[for="'+id+'"]').attr({'x1':'','y1':'','x2':'','y2':''}).css('display','none');
    }

    // 删除物体方法
    function delete_obj(id){
        $('path[link1="'+id+'"]').each(function(){
            var link1_id = $(this).attr('id'); 
            $('.point1[for="'+link1_id+'"]').remove();
            $('.point2[for="'+link1_id+'"]').remove();
            $('.line1[for="'+link1_id+'"]').remove();
            $('.line2[for="'+link1_id+'"]').remove();
            $(this).remove();
        })
        $('path[link2="'+id+'"]').each(function(){
            var link2_id = $(this).attr('id'); 
            $('.point1[for="'+link2_id+'"]').remove();
            $('.point2[for="'+link2_id+'"]').remove();
            $('.line1[for="'+link2_id+'"]').remove();
            $('.line2[for="'+link2_id+'"]').remove();
            $(this).remove();
        })
        $('#'+id).remove();
    }
    // 绑定画线事件
    $('#dragline_board').on('mouseup','.movebody',function(e) { 
        var end_xx = e.pageX;
        var end_yy = e.pageY;
        if(action_status==1){
            select_obj = {'obj':'','type':''};
        }else if(action_status==2){
            if($(this).hasClass('selected')){
                $(this).removeClass('selected');
            }else{
                // 判断是否画过线
                var obj1_id = draw_id;
                var obj2_id = $(this).attr('id');
                var alreay = $('path[link1="'+obj1_id+'"][link2="'+obj2_id+'"]').length+$('path[link1="'+obj2_id+'"][link2="'+obj1_id+'"]').length;
                if(!alreay){
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
                    $line.attr({'d':path,'link1':obj1_id,'link2':obj2_id,'stroke':stroke_color});
                    if(stroke_style==1){
                        $line.attr('stroke-dasharray','5,5');
                    }
                    //画切点、切线
                    var select_path_id = $line.attr('id');
                    $('.point1[for="'+select_path_id+'"]').attr({'cx':point1_x,'cy':point1_y});
                    $('.point2[for="'+select_path_id+'"]').attr({'cx':point2_x,'cy':point2_y});
                    $('.line1[for="'+select_path_id+'"]').attr({'x1':draw_start_x,'y1':draw_start_y,'x2':point1_x,'y2':point1_y});
                    $('.line2[for="'+select_path_id+'"]').attr({'x1':draw_end_x,'y1':draw_end_y,'x2':point2_x,'y2':point2_y});
                }
                $('.movebody').removeClass('selected');
            }   
        }
    }); 
    // 绑定选中切点事件
    $('#dragline_board').on('mousedown','.point1,.point2',function(e) {
        var select_path_id = $(this).attr('for');
        select_obj.obj = this;
        select_obj.type = 'point';
        xx = e.pageX;
        yy = e.pageY;
    })
    // 绑定画板内鼠标移动事件
    $('#dragline_board').mousemove(function(e) {
        if(select_obj.type == 'object'){        //物体移动
            var $object = $(select_obj.obj);
            var new_xx = e.pageX;
            var new_yy = e.pageY;
            var move_x = $object.position().left - main_left + new_xx - xx;
            var move_y = $object.position().top - main_top+ new_yy - yy;
            $object.css('left',move_x).css('top',move_y);
            //线条移动
            var array = get_center(select_obj.obj);
            var center_x = array[0];
            var center_y = array[1];
            var obj_id = $(select_obj.obj).attr('id');
            //起始点为移动物体线条处理
            $('path[link1="'+obj_id+'"]').each(function(){
                move_line(this,center_x,center_y,1);
            })
            //结束点为移动物体线条处理
            $('path[link2="'+obj_id+'"]').each(function(){
                move_line(this,center_x,center_y,2);
            })
            //参数重新调整
            xx = new_xx;
            yy = new_yy;
            draw_start_x = center_x
            draw_start_y = center_y
        }else if(select_obj.type == 'point'){   //切点移动
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
                //切线动
                var $line1 = $('.line1[for="'+select_path_id+'"]')
                $line1.attr({'x2':new_xx,'y2':new_yy});
            }else if($point.hasClass('point2')){
                new_path = head+'C '+c_array[1]+' '+new_xx+','+new_yy+' '+c_array[3];
                //切线动
                var $line2 = $('.line2[for="'+select_path_id+'"]')
                $line2.attr({'x2':new_xx,'y2':new_yy});
            }
            $path.attr('d',new_path);
            //参数重新调整
            xx = end_xx;
            yy = end_yy;
        }
    })
    // 绑定鼠标抬起重新初始化事件
    $('#dragline_board').mouseup(function(e) {  
        select_obj = {'obj':'','type':''};
        $('.movebody').removeClass('selected');
        $('.point1,.point2,.line1,.line2').css('display','none');
    })
    // 绑定删线条事件
    $('#dragline_board').on('click','.line',function() {
        if(action_status == 3){
            var id = $(this).attr('id');
            delete_line(id);
        }
    })
    // 绑定删物体事件
    $('#dragline_board').on('click','.movebody',function() {
        if(action_status == 3){
            var id = $(this).attr('id');
            delete_obj(id);
        }
    })
    // 绑定切点显示事件
    $('#dragline_board').on('mouseenter','.line',function(e) { 
       var id = $(this).attr('id');
       $('.point1[for="'+id+'"]').css('display','block');
       $('.point2[for="'+id+'"]').css('display','block');
       $('.line1[for="'+id+'"]').css('display','block');
       $('.line2[for="'+id+'"]').css('display','block');
    }); 

    // 添加初始线条与切线切点方法
    function CreateLine(that){
        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');   //创建svg元素
        $(path).addClass('line').attr({'stroke':'black','stroke-width':'2','fill':'none','d':'','id':'path_'+draw_path_id});
        var point1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');   
        $(point1).addClass('point1').attr({'cx':'','cy':'','r':'4','fill':'red','for':'path_'+draw_path_id});
        var p_line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');   
        $(p_line1).addClass('line1').attr({'x1':'','y1':'','x2':'','y2':'','stroke':'red','stroke-width':'1','for':'path_'+draw_path_id});
        var point2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');   
        $(point2).addClass('point2').attr({'cx':'','cy':'','r':'4','fill':'red','for':'path_'+draw_path_id});
        var p_line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');   
        $(p_line2).addClass('line2').attr({'x1':'','y1':'','x2':'','y2':'','stroke':'red','stroke-width':'1','for':'path_'+draw_path_id});
        $(that).children('.lines').append(path,point1,point2,p_line1,p_line2);
        draw_path_id += 1;
    }

    // 添加返回对象方法
    var $board = $('#dragline_board');
    $board.extend({
        // 设置画板宽高方法
        setSize:function(x,y){
            $(this).css({'width':x,'height':y});
            main_left = get_left(this);
            main_top = get_top(this);
        },
        // 设置画板边框方法
        setBorder:function(width,color='#333'){
            $(this).css({'border-width':width,'border-color':color});
            main_left = get_left(this);
            main_top = get_top(this);
        },
        // 状态切换方法:0-无操作,1-移动,2-画线,3-删除
        setStatus:function(s){
            $('.movebody').css('cursor','Default');
            $('.line').css('cursor','Default');
            if(s==0){
                action_status = 0;
            }else if(s==1){
                $('.movebody').css('cursor','Move');
                action_status = 1;
            }else if(s==2){
                $('.movebody').css('cursor','Crosshair');
                action_status = 2;
            }else if(s==3){
                $('.movebody').css('cursor','pointer');
                $('.line').css('cursor','pointer');
                action_status = 3;
            }
        },
        // 线条类型切换方法:0-实线,1-虚线
        setLineStyle:function(style){
            stroke_style = style;
        },
        // 线条颜色切换
        setLineColor:function(color){
            stroke_color = color;
        },
        // 添加物体方法 (num为每个物体添加线条数,默认2)
        createMoveObj:function(svg,num=2){
            $(this).prepend('<svg class="movebody" xmlns="http://www.w3.org/2000/svg" id="obj_'+draw_obj_id+'">'+svg+'</svg>');
            for(var i=0;i<num;i++){
                CreateLine(this);
            }
            var $obj = $('#obj_'+draw_obj_id);
            $obj.extend({
                // 设置物体宽高方法
                setSize:function(x,y){
                    $(this).css({'width':x,'height':y});
                },
                // 设置定位点位置方法
                setFix:function(x,y){
                    $(this).addClass('fix_point');
                    $(this).attr({'fix-x':x,'fix-y':y});
                }
            })
            draw_obj_id += 1;
            return $obj;
        }
    })
    return $board;
}

