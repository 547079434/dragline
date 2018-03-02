// 构造函数体
var DragLine = function(){

};

var force_timer;
// 创建画布
DragLine.CreateBoard = function(that){
    $(that).append('<div id="dragline_board"><div id="inside_board"><svg class="lines" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="remark_bakground" x="0" y="0" width="1" height="1"><rect x="0" y="0" width="12" height="12" fill="#C26B26"></rect><rect x="2" y="5" width="8" height="2" fill="#fff"></rect></pattern></defs></svg><ul class="rightMenu"><li id="addTag">添加标签</li><li id="delTag">删除标签</li></ul></div></div>');

    // 初始化
    var $board = $('#dragline_board');                 //画布
    var draw_path_id = 1;                              //初始化线条id
    var draw_obj_id = 1;                               //初始化物体id
    var action_status = 0;                             //操作状态码, 0-无,1-移动,2-画线,3-删除,4-备注
    var stroke_style = 0;                              //线条状态码, 0-实线,1-虚线
    var stroke_color = 'black';                        //线条颜色
    var xx = 0;                                        //鼠标x轴
    var yy = 0;                                        //鼠标y轴
    var select_obj = {'obj':'','type':''};             //选中物体,type：object-物体,point-切点
    var draw_id = '';                                  //右击初始物体id
    var line_obj = '';                                 //画线线条
    var draw_start_x = 0;                              //选中物体起始x轴
    var draw_start_y = 0;                              //选中物体起始y轴
    var main_left = get_left($board);                  //画布左边距
    var main_top = get_top($board);                    //画布上边距
    var link_move = false;                             //是否跟随主链接物体移动
    var right_menu = false;                            //右击菜单是否显示(标签)
    var tag_position = 'right';                        //标签位置
    var tag_color = '#F67D23';                         //标签颜色
    var tag_font_color = '#fff';                       //标签字体颜色
    var tag_text = '标签名';                           //标签名
    var remark_status = true;                          //是否开启备注功能
    var zoom = true;                                   //是否开启缩放/移动画板功能
    var wheelnum = 1;                                  //缩放倍数

    // 获取px数值
    function get_px_num(px){
        return parseFloat(px.split('px')[0]);
    }
    // 获取左边距方法
    function get_left(that){
        var position_left = $(that).offset().left;
        var border_left = get_px_num($(that).css('borderLeftWidth'));
        return position_left+border_left;
    }
    // 获取上边距方法
    function get_top(that){
        var position_top = $(that).offset().top;
        var border_top = parseInt($(that).css('borderTopWidth').split('px')[0]);
        return position_top+border_top;
    }
    // 获取内画板移动值
    function get_inside_margin(){
        var left,top;
        if($('#inside_board').css('margin-left')){
            left = get_px_num($('#inside_board').css('margin-left'));
        }else{
            left = 0;
        }
        if($('#inside_board').css('margin-top')){
            top = get_px_num($('#inside_board').css('margin-top'));
        }else{
            top = 0;
        }
        return [left,top];
    }
    // 获取物体相对定位点坐标方法(无定位点，则选取中心点)
    function get_center(that){
        var x,y;
        var left = $(that).offset().left;
        var top = $(that).offset().top;
        var width = $(that).width()*wheelnum;
        var height = $(that).height()*wheelnum;
        var padding_left = get_px_num($(that).css('padding-left'));
        var padding_top = get_px_num($(that).css('padding-top'));
        if($(that).hasClass('fix_point')){
            x = left+parseInt($(that).attr('fix-x'))-main_left+padding_left;
            y = top+parseInt($(that).attr('fix-y'))-main_top+padding_top;
        }else{
            x = left+width/2-main_left+padding_left;
            y = top+height/2-main_top+padding_top;
        }
        // 画板拖动后处理
        var array = get_inside_margin();
        var inside_left = array[0];
        var inside_top = array[1];
        x -= inside_left;
        y -= inside_top;
        return [x,y]
    }
    // 获取物体绝对定位点
    function get_absolute_center(that){
        var x,y;
        var left = get_px_num($(that).css('left'));
        var top = get_px_num($(that).css('top'));
        var width = $(that).width();
        var height = $(that).height();
        var padding_left = get_px_num($(that).css('padding-left'));
        var padding_top = get_px_num($(that).css('padding-top'));
        if($(that).hasClass('fix_point')){
            x = left+parseInt($(that).attr('fix-x'))+padding_left;
            y = top+parseInt($(that).attr('fix-y'))+padding_top;
        }else{
            x = left+width/2+padding_left;
            y = top+height/2+padding_top;
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
    // 添加初始线条与切线切点方法
    function CreateLine(that){
        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');   //创建svg元素
        $(path).attr({'class':'line','stroke':'black','stroke-width':'2','fill':'none','d':'','id':'path_'+draw_path_id});
        var point1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        $(point1).attr({'class':'point1','cx':-10,'cy':-10,'r':'4','fill':'red','for':'path_'+draw_path_id});
        var p_line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        $(p_line1).attr({'class':'line1','x1':0,'y1':0,'x2':0,'y2':0,'stroke':'red','stroke-width':'1','for':'path_'+draw_path_id});
        var point2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        $(point2).attr({'class':'point2','cx':-10,'cy':-10,'r':'4','fill':'red','for':'path_'+draw_path_id});
        var p_line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        $(p_line2).attr({'class':'line2','x1':0,'y1':0,'x2':0,'y2':0,'stroke':'red','stroke-width':'1','for':'path_'+draw_path_id});
        $(that).children('#inside_board').children('.lines').append(path,point1,point2,p_line1,p_line2);
        var $line = $('#path_'+draw_path_id);
        draw_path_id += 1;
        return $line
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
            var link_array = get_absolute_center($link2);
            start_x = center_x;
            start_y = center_y;
            end_x = link_array[0];
            end_y = link_array[1];
        }else if(type==2){
            // 获取起始点坐标
            var $link1 = $('#'+$(that).attr('link1'));
            var link_array = get_absolute_center($link1);
            var start_x = link_array[0];
            var start_y = link_array[1];
            end_x = center_x;
            end_y = center_y;
        }
        // console.log(start_x,start_y)
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
        // 备注点动
        if(remark_status){
            addRemark(that);
        }
        //切线动
        var $line1 = $('.line1[for="'+select_path_id+'"]');
        var $line2 = $('.line2[for="'+select_path_id+'"]');
        $line1.attr({'x1':start_x,'y1':start_y,'x2':point1_x,'y2':point1_y});
        $line2.attr({'x1':end_x,'y1':end_y,'x2':point2_x,'y2':point2_y});
    }
    // 画线方法 type 1-物体连线(end_id) 2-移动画线([end_x,end_y])
    function draw_line(start_id,line,type,end_data){
        var start = get_absolute_center($('#'+start_id));
        var start_x = start[0];
        var start_y = start[1];
        var end_id = '';
        var end_x,end_y;
        if(type==1){
            end_id = end_data;
            var end = get_absolute_center($('#'+end_id));
            end_x = end[0];
            end_y = end[1];
        }else if(type==2){
            end_x = end_data[0];
            end_y = end_data[1];
        }
        var result = get_points_xy(start_x,start_y,end_x,end_y);
        var point1_x = result.point1_x;
        var point1_y = result.point1_y;
        var point2_x = result.point2_x;
        var point2_y = result.point2_y;

        var path = 'M '+start_x+','+start_y+' C '+point1_x+','+point1_y+' '+point2_x+','+point2_y+' '+end_x+','+end_y;
        line.attr({'d':path,'link1':start_id,'link2':end_id,'stroke':stroke_color});
        if(stroke_style==1){
            line.attr('stroke-dasharray','5,5');
        }
        //画切点、切线
        if(type==1){
            var select_path_id = line.attr('id');
            $('.point1[for="'+select_path_id+'"]').attr({'cx':point1_x,'cy':point1_y});
            $('.point2[for="'+select_path_id+'"]').attr({'cx':point2_x,'cy':point2_y});
            $('.line1[for="'+select_path_id+'"]').attr({'x1':start_x,'y1':start_y,'x2':point1_x,'y2':point1_y});
            $('.line2[for="'+select_path_id+'"]').attr({'x1':end_x,'y1':end_y,'x2':point2_x,'y2':point2_y});
        }

        // 备注点动
        if(remark_status){
            addRemark(line);
        }
        return line;
    }
    // 删除线条及相关切线切点方法
    function delete_line(id){
        $('#'+id).remove();
        $('.point1[for="'+id+'"]').remove();
        $('.point2[for="'+id+'"]').remove();
        $('.line1[for="'+id+'"]').remove();
        $('.line2[for="'+id+'"]').remove();
        $('.remark_point[for="'+id+'"]').remove();
        $('.remark_text[for="'+id+'"]').remove();
    }
    // 删除物体方法
    function delete_obj(id){
        $('path[link1="'+id+'"]').each(function(){
            var link1_id = $(this).attr('id');
            delete_line(link1_id);
        })
        $('path[link2="'+id+'"]').each(function(){
            var link2_id = $(this).attr('id');
            delete_line(link2_id);
        })
        $('#'+id).remove();
    }
    // 生成定位点
    function createFix(that,x,y){
        $(that).addClass('fix_point');
        $(that).attr({'fix-x':x,'fix-y':y});
    }
    // 删除定位点
    function delFix(that){
        $(that).removeClass('fix_point');
        $(that).attr({'fix-x':'','fix-y':''});
    }
    // 添加标签
    function addTag(obj){
        var alreay = obj.children('.tag').length;
        if(!alreay){
            var tag = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            var tag_width = 46;
            var tag_height = 18;
            var obj_width = obj.width();
            var obj_height = obj.height();
            if(tag_position=='right'){
                var x = obj_width;
                var y = obj_height/2;
            }else if(tag_position=='left'){
                var x = 0;
                var y = obj_height/2;
            }else if(tag_position=='top'){
                var x = obj_width/2;
                var y = 0;
            }else if(tag_position=='bottom'){
                var x = obj_width/2;
                var y = obj_height;
            }else{
                var x = obj_width;
                var y = obj_height/2;
            }
            $(tag).attr({'class':'tag','width':tag_width,'height':tag_height,'x':x-tag_width/2,'y':y-tag_height/2,'rx':'8','ry':'8','fill':tag_color,'stroke':'none'});
            $(text).attr({'class':'tag_text','x':x,'y':y+1,'stroke':'none','fill':tag_font_color,'style':'font-size:12px;','text-anchor':"middle",'dominant-baseline': 'middle'}).text(tag_text);
            var new_left = get_px_num(obj.css('left'))-tag_width/2;
            var new_top = get_px_num(obj.css('top'))-tag_width/2;
            obj.css({'padding':tag_width/2,'left':new_left,'top':new_top});
            obj.append(tag,text);
            createFix(obj,x,y)
        }
    }
    // 删除标签
    function delTag(obj){
        delFix(obj);
        obj.children('.tag').each(function(){
            $(this).remove();
        })
        obj.children('.tag_text').each(function(){
            $(this).remove();
        })
        var new_left = get_px_num(obj.css('left'))+get_px_num(obj.css('padding-left'));
        var new_top = get_px_num(obj.css('top'))+get_px_num(obj.css('padding-top'));
        obj.css({'padding':0,'left':new_left,'top':new_top});
    }
    // 添加备注点
    function addRemark(that){
        var id = $(that).attr('id');
        $('.remark_point[for="'+id+'"]').remove();
        var path = $(that).attr('d');
        var remark_point = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        var r = 6;
        $(remark_point).attr({'class':'remark_point hide_point','cx':'0','cy':'0','r':r,'fill':'url(#remark_bakground)','for':$(that).attr('id')});
        var motion = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
        $(motion).attr({'path':path,'begin':'0s','dur':"0.1s",'end':'0.05s','fill':'freeze'}) ;
        $(remark_point).append(motion);
        $('.lines').append(remark_point);

        setTimeout(setPoint,100);
        function setPoint(){
            var point = $('.remark_point[for="'+id+'"]');
            if(point.length){
                var left = point.position().left+r+35/wheelnum;
                var top = point.position().top-main_top+r;
                if(left>0&&top>0){
                    $(that).attr({'half_x':left,'half_y':top});
                    $('.remark_text[for="'+id+'"]').offset({'left':left,'top':top});
                }
            }
        }
    }
    // 抖动动画效果
    function shaking(obj,x,y){
        var rnum = Math.random();
        var move1 = rnum*10;
        var move2 = rnum*5;
        var move3 = rnum*3;
        var speed = 50;
        obj.animate({'left':x+move1,'top':y+move1},speed).animate({'left':x-move1,'top':y-move1},speed).animate({'left':x+move2,'top':y+move2},speed+10).animate({'left':x-move2,'top':y-move2},speed+10).animate({'left':x+move3,'top':y+move3},speed+20).animate({'left':x-move3,'top':y-move3},speed+20).animate({'left':x,'top':y},speed+30);
    }

    // 绑定选中移动物体事件
    $board.on('mousedown','.movebody',function(e) {
        xx = e.pageX;
        yy = e.pageY;
        var array = get_absolute_center(this);
        draw_start_x = array[0];
        draw_start_y = array[1];
        if(e.which==1){
            if(action_status==1){
                select_obj.obj = this;
                select_obj.type = 'object';
            }else if(action_status==2){
                select_obj.obj = this;
                select_obj.type = 'drawline';
                if($(this).hasClass('selected')){
                    $(this).removeClass('selected');
                }else{
                    draw_id = $(this).attr('id');
                    line_obj = CreateLine($board);
                    $(this).addClass('selected');
                }
            }
        }else if(e.which==3 && right_menu){
            $('.rightMenu').css({'left':draw_start_x,'top':draw_start_y});
            $('.rightMenu').show();
            draw_id = $(this).attr('id');
        }
    });
    // 绑定画线事件
    $board.on('mouseup','.movebody',function(e) {
        var end_xx = e.pageX;
        var end_yy = e.pageY;
        if(e.which==1){
            if(action_status==1){
                //link1跟随link2移动
                if(link_move&&select_obj.obj){
                    var obj_id = $(select_obj.obj).attr('id');
                    var array = get_absolute_center(select_obj.obj);
                    var draw_end_x = array[0];
                    var draw_end_y = array[1];
                    $('path[link2="'+obj_id+'"]').each(function(){
                        var $link1 = $('#'+$(this).attr('link1'));
                        if(!(draw_end_x - draw_start_x)==0 || !(draw_end_y - draw_start_y)==0){
                            var mx =parseInt($link1.css('left').split('px')[0]) + draw_end_x - draw_start_x;
                            var my =parseInt($link1.css('top').split('px')[0]) + draw_end_y - draw_start_y;
                            $link1.css({'left':mx,'top':my});
                            var l_array = get_absolute_center($link1);
                            var lx = l_array[0];
                            var ly = l_array[1];
                            move_line(this,lx,ly,1);
                            shaking($link1,mx,my);
                        }
                    })
                }
            }else if(action_status==2&&select_obj.type=="drawline"){
                if($(this).hasClass('selected')){
                    $(this).removeClass('selected');
                }else{
                    // 判断是否画过线
                    var obj2_id = $(this).attr('id');
                    var alreay = $('path[link1="'+draw_id+'"][link2="'+obj2_id+'"]').length+$('path[link1="'+obj2_id+'"][link2="'+draw_id+'"]').length;
                    if(!alreay){
                        draw_line(draw_id,line_obj,1,obj2_id);
                    }
                    $('.movebody').removeClass('selected');
                }
            }
        }
    });
    // 绑定选中切点事件
    $board.on('mousedown','.point1,.point2',function(e) {
        var select_path_id = $(this).attr('for');
        select_obj.obj = this;
        select_obj.type = 'point';
        xx = e.pageX;
        yy = e.pageY;
    })
    // 绑定画板内鼠标移动事件
    $board.mousemove(function(e) {
        var now_xx = e.pageX;
        var now_yy = e.pageY;
        if(select_obj.type == 'object'){        //物体移动
            var $object = $(select_obj.obj);
            var move_x =get_px_num($object.css('left')) + (now_xx - xx)/wheelnum;
            var move_y =get_px_num($object.css('top')) + (now_yy - yy)/wheelnum;
            $object.css('left',move_x).css('top',move_y);
            //线条移动
            var array = get_absolute_center($object);
            var center_x = array[0];
            var center_y = array[1];
            var obj_id = $object.attr('id');
            //起始点为移动物体线条处理
            $('path[link1="'+obj_id+'"]').each(function(){
                move_line(this,center_x,center_y,1);
            })
            //结束点为移动物体线条处理
            $('path[link2="'+obj_id+'"]').each(function(){
                move_line(this,center_x,center_y,2);
            })
        }else if(select_obj.type == 'point'){   //切点移动
            //点动
            var $point = $(select_obj.obj);
            var old_cx = parseFloat($point.attr('cx'));
            var old_cy = parseFloat($point.attr('cy'));
            var new_xx = (now_xx-xx)/wheelnum+old_cx;
            var new_yy = (now_yy-yy)/wheelnum+old_cy;
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
            // 备注点动
            if(remark_status){
                addRemark($path);
            }
        }else if(select_obj.type == 'board' && zoom){   //画板移动
            var array = get_inside_margin();
            var old_x = array[0];
            var old_y = array[1];
            var new_xx = now_xx-xx+old_x;
            var new_yy = now_yy-yy+old_y;
            select_obj.obj.css({'margin-left':new_xx,'margin-top':new_yy});
        }
        //线条移动
        if(action_status==2){
            if(draw_id&&line_obj){
                // 画板拖动后处理
                var array = get_center(select_obj.obj);
                var center_x = array[0];
                var center_y = array[1];
                var a_array = get_absolute_center(select_obj.obj);
                var a_center_x = a_array[0];
                var a_center_y = a_array[1];
                var i_array = get_inside_margin();
                var inside_left = i_array[0];
                var inside_top = i_array[1];
                var mouse_x = xx-main_left-inside_left;
                var mouse_y = yy-main_top-inside_top;
                draw_line(draw_id,line_obj,2,[a_center_x-(center_x-mouse_x)/wheelnum,a_center_y-(center_y-mouse_y)/wheelnum]);
            }
        }
        xx = now_xx;
        yy = now_yy;
    })
    // 绑定鼠标按住画板事件
    $board.mousedown(function(e) {
        if(!select_obj.obj&&zoom){
            select_obj.obj = $(this).children('#inside_board');
            select_obj.type = 'board';
        }
    })
    // 绑定鼠标抬起重新初始化事件
    $board.mouseup(function(e) {
        select_obj = {'obj':'','type':''};
        $('.movebody').removeClass('selected');
        $('.point1,.point2,.line1,.line2').css('display','none');
        if(line_obj){
            var link2 = line_obj.attr('link2');
            if(!link2){
                var line_id = line_obj.attr('id');
                delete_line(line_id);
                $('.remark_point[for="'+line_id+'"]').remove();
            }
            line_obj = '';
        }
        $('.remark_point').addClass('hide_point');
    })
    // 绑定鼠标点击重新初始化事件
    $board.click(function(e) {
        $('.rightMenu').hide();
    })
    // 绑定删线条事件
    $board.on('click','.line',function() {
        if(action_status == 3){
            var id = $(this).attr('id');
            delete_line(id);
        }
    })
    // 绑定删物体事件
    $board.on('click','.movebody',function(e) {
        if(action_status == 3){
            var id = $(this).attr('id');
            delete_obj(id);
        }
    })
    // 绑定鼠标进入线条事件
    $board.on('mouseenter','.line',function(e) {
        var id = $(this).attr('id');
        if(action_status==2){
            $('.point1[for="'+id+'"]').css('display','block');
            $('.point2[for="'+id+'"]').css('display','block');
            $('.line1[for="'+id+'"]').css('display','block');
            $('.line2[for="'+id+'"]').css('display','block');
        }
        $('.remark_point[for="'+id+'"]').removeClass('hide_point');
    });
    // 取消右键菜单
    $board.bind("contextmenu",function(){
        return false;
    });
    // 鼠标滚轮缩放(chrome)
    $board.bind("mousewheel",function(e){
        if(zoom){
            var detail = event.wheelDelta;
            if(detail>0){
                wheelnum += 0.1;
                $('#inside_board').css({'-moz-transform':'scale('+wheelnum+','+wheelnum+')','-webkit-transform':'scale('+wheelnum+','+wheelnum+')','-o-transform':'scale('+wheelnum+','+wheelnum+')'})
            }else{
                wheelnum -= 0.1;
                $('#inside_board').css({'-moz-transform':'scale('+wheelnum+','+wheelnum+')','-webkit-transform':'scale('+wheelnum+','+wheelnum+')','-o-transform':'scale('+wheelnum+','+wheelnum+')'})
            }
        }
    })
    // 添加标签
    $board.on('click','#addTag',function(){
        var obj = $('#'+draw_id);
        addTag(obj);
    })
    // 删除标签
    $board.on('click','#delTag',function(){
        var obj = $('#'+draw_id);
        delTag(obj);
    })
    // 添加备注输入框
    $board.on('click','.remark_point',function(){
        var id = $(this).attr('for');
        if(!$('.remark_text[for="'+id+'"]').length){
            var line = $('#'+id);
            var x = parseInt(line.attr('half_x'));
            var y = parseInt(line.attr('half_y'));
            $board.children('#inside_board').append('<textarea class="remark_text" for="'+id+'"></textarea>');
            $('.remark_text[for="'+id+'"]').offset({'left':x,'top':y});
        }else{
            $('.remark_text[for="'+id+'"]').attr('disabled',false);
        }
    })
    // 添加备注
    $board.on('keydown','.remark_text',function(e){
        if(e.which==13){
            var val = $(this).val();
            if(val){
                $(this).attr('disabled',true);
            }else{
               $(this).remove();
            }
        }
    })
    // 添加返回对象方法
    $board.extend({
        // 获取画板左边距
        main_left:function(){
            return get_left(this);
        },
        // 获取画板右边距
        main_top:function(){
            return get_top(this);
        },
        // 设置画板宽高方法
        setSize:function(x,y){
            $(this).css({'width':x,'height':y});
            main_left = get_left(this);
            main_top = get_top(this);
        },
        // 设置画板边框方法
        setBorder:function(width,color){
            color = color || '#333';
            $(this).css({'border-width':width,'border-color':color});
            main_left = get_left(this);
            main_top = get_top(this);
        },
        // 设置跟随主物体移动状态
        setMoveTogether:function(m){
            link_move = m;
        },
        // 设置右击菜单是否显示
        setRightMenu:function(m){
            right_menu = m;
        },
        // 设置备注功能是否开启
        setRemarkStatus:function(m){
            remark_status = m;
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
        // 设置标签位置
        setTagPosition:function(position){
            tag_position = position;
        },
        // 设置标签名
        setTagText:function(text){
            tag_text = text;
        },
        // 设置标签颜色
        setTagColor:function(color){
            tag_color = color;
        },
        // 设置标签字体颜色
        setTagFontColor:function(font_color){
            tag_font_color = font_color;
        },
        // 设置缩放/拖拽画板功能是否开启
        setZoom:function(z){
            zoom = z;
        },
        // 设置当前操作对象
        setSelectObj:function(obj,type){
            select_obj.obj = obj;
            select_obj.type = type;
        },
        // 添加物体方法
        createMoveObj:function(svg,cx,cy,id){
            cx = cx || '';
            cy = cy || '';
            id = id || '';
            var obj_id = 'obj_'+draw_obj_id;
            if(id){
                obj_id = id;
            }
            $(this).children('#inside_board').append('<svg class="movebody" xmlns="http://www.w3.org/2000/svg" id="'+obj_id+'">'+svg+'</svg>');
            var $obj = $('#'+obj_id);
            if(cx === '' && cy === ''){
                var cx = ($(this).width()-$obj.width())/2;
                var cy = ($(this).height()-$obj.height())/2;
            }
            $obj.css({'left':cx,'top':cy});
            $obj.extend({
                // 设置物体宽高方法
                setSize:function(x,y){
                    $(this).css({'width':x,'height':y});
                },
                // 设置定位点位置方法
                setFix:function(x,y){
                    createFix(this,x,y);
                }
            })
            if(!id){
                draw_obj_id += 1;
            }
            return $obj;
        },
        // 画线方法
        drawLine:function(start_id,end_id){
            var l = CreateLine($board);
            var line = draw_line(start_id,l,1,end_id);
            return line;
        },
        // 设置自定义物体点击双击事件
        setClickFuc:function(fuc,fuc2){
            fuc = fuc || '';
            fuc2 = fuc2 || '';
            var timer = null;
            $board.on('dblclick','.movebody',function(){
                clearTimeout(timer);
                if(fuc2){
                    return fuc2($(this).attr('id'));
                }
            })
            $board.on('click','.movebody',function(){
                var clock;
                if(fuc2){
                    clock = 300;
                }else{
                    clock = 0;
                }
                clearTimeout(timer);
                var id = $(this).attr('id');
                timer = setTimeout(function(){
                    if(fuc){
                        return fuc(id);
                    }
                },clock)
            })
        },
        // 清空画板
        clear:function(){
            window.clearTimeout(force_timer);
            $('.movebody').each(function(){
                var id = $(this).attr('id');
                delete_obj(id);
            })
        }
    })
    return $board;
}

// 创建菜单
DragLine.CreateMenu = function($board){
    var status_li = '<div class="menu_part"><div class="menu_head"><span></span>操作</div><li id="dragMove" class="li_status" title="移动">移动</li><li id="dragDraw" class="li_status" title="连线">连线</li><li id="dragDelete" class="li_status" title="删除">删除</li></div>';
    var icon_li = '<div class="menu_part"><div class="menu_head"><span></span>主体</div><li id="addPeople" class="li_icon">个人</li><li id="addCar" class="li_icon">车</li><li id="addCase" class="li_icon">案件</li><li id="addQQ" class="li_icon">QQ</li><li id="addPhone" class="li_icon">手机</li><li id="addLabel" class="li_icon">标签</li><li id="addDatabase" class="li_icon">数据源</li><li id="addInfo" class="li_icon">信息提取</li><li id="addTrajectory" class="li_icon">轨迹</li></div>';
    var style_select = '<div class="menu_part"><div class="menu_head"><span></span>配置</div><li class="li_select"><label>线条样式：</label><select id="strokeStyle" title=""><option value="0">—</option><option value="1">- -</option></select></li><li class="li_select"><label>线条颜色：</label><select id="strokeColor"><option value="black" style="color:black">——</option><option value="red" style="color:red">——</option><option value="green" style="color:green">——</option><option value="yellow" style="color:yellow">——</option></select></li><li class="li_select"><label>填充颜色：</label><input type="color" id="fillColor" style="width:46%;height:20px;" value="#ffffff"/></div></li>';
    var tag_li = '<div class="menu_part"><div class="menu_head"><span></span>标签</div><li class="li_select"><label>标签位置：</label><select id="tagPosition"><option value="right">右标签</option><option value="left">左标签</option><option value="top">上标签</option><option value="bottom">下标签</option></select></li><li class="li_select"><label>标签颜色：</label><input type="color" id="tagColor" style="width:46%;height:20px;" value="#F67D23" /></li><li class="li_select"><label>标签内容：</label><input type="text" id="tagText" value=""/></li><li class="li_select"><label>字体颜色：</label><select id="tagFontColor" style="color:#fff"><option value="#fff" style="color:#fff">A</option><option value="#000" style="color:#000">A</option><option value="red" style="color:red">A</option><option value="blue" style="color:blue">A</option></select></li></div>';
    $board.append('<div class="dragline_menu"><ul>'+status_li+icon_li+style_select+tag_li+'</ul></div>');
    $board.setRightMenu(true);

    // 初始化
    var main_left = $board.main_left();                     //画布左边距
    var main_top = $board.main_top();                       //画布上边距
    var move_obj = '';                                      //移动物体
    var btn_obj = '';                                       //已点击按钮
    var xx = 0;                                             //鼠标x轴
    var yy = 0;                                             //鼠标y轴
    var stroke_style = '';                                  //初始边框样式
    var stroke_color = 'black';                             //初始边框颜色
    var fill_color = '#2C3E50';                             //初始填充色

    // 添加共用方法
    function commonAdd(e,obj,that){
        xx = e.pageX;
        yy = e.pageY;
        obj.css({'left':xx-main_left-obj.width()/2,'top':yy-main_top-obj.height()/2,'opacity':0.5,'cursor':'Move','fill':fill_color,'stroke':stroke_color,'stroke-width':1,'stroke-dasharray':stroke_style});
        $(that).css('border-color','#2C3E50');
        move_obj = obj;
        btn_obj = $(that);
        if(!$('#dragMove').hasClass('clicked')){
            $('#dragMove').trigger('click');
        }
        $board.setSelectObj(obj,'object');
    }

    // 状态切换
    $board.on('click','.li_status',function(){
        if($(this).hasClass('clicked')){
            $(this).removeClass('clicked');
            $board.setStatus(0);
        }else{
            $('.li_status').removeClass('clicked');
            if($(this).attr('id')=='dragMove'){
                $(this).addClass('clicked');
                $board.setStatus(1);
            }else if($(this).attr('id')=='dragDraw'){
                $(this).addClass('clicked');
                $board.setStatus(2);
            }else if($(this).attr('id')=='dragDelete'){
                $(this).addClass('clicked');
                $board.setStatus(3);
            }
        }
    })
    // 添加人
    $board.on('mousedown','#addPeople',function(e) {
        var inside = '<g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g fill="'+fill_color+'" fill-rule="nonzero"><path d="M22.3124978,16.5975679 C20.4375111,18.2759792 18,19.3949318 15.1874844,19.3949318 C12.3749689,19.3949318 9.93749333,18.2759792 7.87498667,16.5975679 C3.18748444,19.0219476 0,22.1922604 0,27.9734627 L30,27.9734627 C30,22.1922604 26.8125156,19.208422 22.3124978,16.5975679 Z M15,17.1570619 C19.6875022,17.1570619 23.4375111,13.2407806 23.4375111,8.57853093 C23.4375111,3.91628125 19.6875022,0 15,0 C10.3124978,0 6.56248889,3.91628125 6.56248889,8.57853093 C6.56248889,13.427255 10.4999822,17.1570619 15,17.1570619 Z"></path></g></g>';
        var obj = $board.createMoveObj(inside);
        obj.setSize(30,28);
        commonAdd(e,obj,this);
    })
    // 添加车
    $board.on('mousedown','#addCar',function(e) {
        var inside = '<g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g fill="'+fill_color+'" fill-rule="nonzero"><path d="M11.7767961,0.242839063 C13.9031216,-0.0809463543 16.0648795,-0.0809463543 18.191205,0.242839063 C19.6864052,0.54748751 21.1816054,0.791206267 22.5870936,1.18724925 C23.6328722,1.45870298 24.4685325,2.25826563 24.7999899,3.30455595 C25.4080379,5.05120705 26.04599,6.78262572 26.7138461,8.49881197 C26.8334621,8.78822799 27.1923102,9.21473582 27.4016382,9.18427097 C28.587606,8.98010686 29.7164847,9.77837721 29.9434785,10.9816968 C30.0188405,11.2918191 30.0188405,11.6159847 29.9434785,11.926107 L28.2389503,12.3983121 C28.3445373,13.0027972 28.4144388,13.6131901 28.4482783,14.2262028 L28.4482783,22.6649647 C28.4290366,23.1752045 28.2509994,23.6659873 27.9399103,24.0663476 C26.3620091,24.3764377 24.743472,24.4073545 23.1552696,24.1577421 C22.0488215,23.4418183 22.7366136,22.2384569 22.3777655,21.2635819 L7.84441962,21.2635819 C7.56033158,22.2993866 7.39585956,24.0358828 7.06691552,24.1577421 C5.44452782,24.4474193 3.78504656,24.4474193 2.16265887,24.1577421 C1.81840025,23.6920001 1.62974708,23.1261035 1.6243868,22.5431054 C1.53467479,21.3245116 1.53467479,20.1668475 1.53467479,18.9787185 C1.53467479,16.7700173 1.53467479,14.5613161 1.6243868,12.3373824 L0.0394745893,11.9108746 C-0.0131581964,11.6649673 -0.0131581964,11.4103931 0.0394745893,11.1644859 C0.488034649,9.94589209 1.08611473,9.00148191 2.62617093,9.13857371 C2.80559496,9.13857371 3.149491,8.77299557 3.25415501,8.49881197 C3.82571968,7.14111217 4.32484748,5.75293774 4.74935521,4.34036067 C5.32442328,2.25353822 7.1142514,0.752275665 9.23495581,0.577952354 C10.0573159,0.425628131 10.90958,0.319001175 11.7319401,0.181909374 L11.7767961,0.242839063 Z M5.16801127,9.65647607 C11.6156933,11.0464726 18.2775478,11.0464726 24.7252299,9.65647607 C24.1720058,7.96567719 23.6187817,6.45766738 23.2300297,4.93442514 C22.9918348,3.73688016 21.9471485,2.88417462 20.7479973,2.90851297 C17.6529329,2.77142117 14.5429165,2.66479421 11.4478521,2.63432937 C10.4366069,2.67471578 9.43324752,2.83315323 8.4574517,3.10653446 C8.00780533,3.20034432 7.61429564,3.47492641 7.36595556,3.86815558 C6.52864345,5.71127868 5.90065936,7.61533147 5.16801127,9.65647607 Z M6.43893144,16.8461794 C6.97389583,16.8756429 7.51041829,16.8449933 8.03879565,16.7547849 C8.4519916,16.6576478 8.80526657,16.3863382 9.01067578,16.0083962 C9.08543579,15.7799098 8.74153974,15.2163102 8.4424997,15.0792184 C7.22627054,14.4987068 5.97819942,13.9901155 4.70449921,13.5559762 C4.07651512,13.3427223 3.35881903,13.3884195 3.20929901,14.2871325 C2.91025897,15.6123532 3.20929901,16.3435095 4.18117914,16.5567634 C4.94373124,16.7090876 5.67637933,16.7395525 6.51369145,16.8157146 L6.43893144,16.8461794 Z M23.6785897,16.8461794 C24.4660073,16.7889489 25.2497005,16.687243 26.026054,16.541531 C27.1474542,16.2825798 26.9082221,15.353402 26.8783181,14.5460836 C26.8484141,13.7387653 26.4297581,13.3579547 25.816726,13.5407438 C24.2814678,14.005883 22.7821608,14.5863049 21.3311254,15.2772399 C20.6732373,15.5971208 20.9124693,16.4806013 21.6600694,16.6481579 C22.3286965,16.7503228 23.0027573,16.811363 23.6785897,16.830947 L23.6785897,16.8461794 Z"></path></g></g>';
        var obj = $board.createMoveObj(inside);
        obj.setSize(30,28);
        commonAdd(e,obj,this);
    })
    // 添加案件
    $board.on('mousedown','#addCase',function(e) {
        var inside = '<g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g fill="'+fill_color+'" fill-rule="nonzero"><path d="M29.9253809,10.939359 C29.7495802,10.4016895 29.2821054,10.0082861 28.7167423,9.92725532 L20.1661061,8.44075144 L16.34232,0.826303387 C16.0926225,0.320251556 15.5711238,0 14.9998229,0 C14.428419,0 13.9089796,0.320217605 13.6532757,0.826303387 L9.83144599,8.44075144 L1.28283483,9.9786382 C0.717437415,10.0597029 0.248006198,10.4530724 0.0741618498,10.9907418 C-0.103629598,11.5264415 0.0441981657,12.1174976 0.45377064,12.510867 L6.63899108,18.1663468 L5.02277067,26.385639 C4.9268731,26.941104 5.15460405,27.5084892 5.62012248,27.8366197 C6.06436085,28.276176 6.98063895,28.06589 7.1983477,27.9532415 L14.9998229,24.1816086 L22.7513242,27.9532415 C22.969033,28.06589 23.8302232,28.3306833 24.3295151,27.8366197 C24.7910521,27.5084892 25.0267459,26.9411379 24.928892,26.385639 L23.3626111,18.1663468 L29.5498223,12.4574805 C29.957404,12.0661147 30.1032067,11.4750587 29.9253809,10.939359 Z"></path></g></g>';
        var obj = $board.createMoveObj(inside);
        obj.setSize(30,28);
        commonAdd(e,obj,this);
    })
    // 添加QQ
    $board.on('mousedown','#addQQ',function(e) {
        var inside = '<g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g fill="'+fill_color+'" fill-rule="nonzero"><path d="M0.996734122,17.8796162 C-0.146230633,20.6055338 -0.332341702,23.2064908 0.586075993,23.6926765 C1.21925823,24.0272706 2.21185064,23.2652155 3.14038309,21.8660659 C3.50855936,23.3894933 4.41888527,24.7702061 5.71896555,25.877098 C4.35549961,26.3871833 3.46472886,27.2195715 3.46472886,28.1639463 C3.46472886,29.7153703 5.87473243,30.9704396 8.84981239,30.9704396 C11.5329137,30.9704396 13.7554576,29.9509519 14.1654414,28.610527 C14.2760292,28.6084784 14.6994993,28.6084784 14.8060412,28.610527 C15.2180479,29.9489034 17.4419404,30.9704396 20.1236931,30.9704396 C23.0980988,30.9704396 25.5087767,29.7140046 25.5087767,28.1639463 C25.5087767,27.22162 24.6186802,26.3871833 23.2538657,25.877098 C24.5525973,24.7688404 25.4656205,23.3894933 25.8317738,21.8660659 C26.7609805,23.2652155 27.7508757,24.0272706 28.3847323,23.6926765 C29.30315,23.2064908 29.1224334,20.604851 27.9747485,17.8796162 C27.0765602,15.7375311 25.8573978,14.1601589 24.9254938,13.8119079 C24.9396544,13.6760217 24.9457232,13.5374042 24.9457232,13.3994694 C24.9457232,12.5718612 24.7184789,11.8063918 24.3307475,11.1829542 C24.3374907,11.1351551 24.3374907,11.0853074 24.3374907,11.0375082 C24.3374907,10.6564806 24.2478067,10.2993527 24.0954114,9.99002383 C23.8594009,4.42210488 20.27946,0 14.4864156,0 C8.6899996,0 5.10871001,4.42210488 4.87539685,9.99002386 C4.7209786,10.3007184 4.63196897,10.6578464 4.63196897,11.0375082 C4.63196897,11.0853074 4.63534056,11.1351551 4.63736351,11.1829542 C4.25232931,11.8063918 4.02508502,12.5704955 4.02508502,13.3994695 C4.02508502,13.5367213 4.03047955,13.6739732 4.04194292,13.8119079 C3.11678205,14.1601589 1.89357373,15.7388968 0.996734122,17.8796162 L0.996734122,17.8796162 Z"></path></g></g>';
        var obj = $board.createMoveObj(inside);
        obj.setSize(29,31);
        commonAdd(e,obj,this);
    })
    // 添加手机
    $board.on('mousedown','#addPhone',function(e) {
        var inside = '<g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g fill="'+fill_color+'" fill-rule="nonzero"><path d="M0.0106447348,15.9757628 C0.0106447348,10.8749925 0.015822103,5.77391651 0.00304677894,0.673282031 C0.0022062971,0.22114738 0.00919910607,-0.00252563241 0.597469161,2.15093924e-05 C7.01901943,0.0294664686 13.4404688,0.0267834793 19.8618846,0.00154979447 C20.3822438,2.15093924e-05 20.4396991,0.143782193 20.4393629,0.610554419 C20.4249066,10.8676907 20.4227886,21.1251666 20.4444394,31.3817595 C20.4454144,31.9073877 20.3046505,31.9662096 19.8420157,31.9651229 C13.4204654,31.9483797 6.99901597,31.9451533 0.57760017,31.9705228 C0.0572410485,31.9720511 -0.00129010739,31.8284602 2.10442907e-05,31.3615182 C0.01827631,26.2326614 0.0114179781,21.1043819 0.0114179781,15.9761024 L0.0106447348,15.9757628 Z M1.95003979,14.5344881 C1.95003979,17.8049503 1.97017773,21.0756841 1.93450768,24.3459765 C1.92704421,25.0497008 2.07150623,25.3037357 2.8263934,25.2986415 C7.73732884,25.2652909 12.6485669,25.2737134 17.5596704,25.2930717 C18.176147,25.2948038 18.426308,25.1518582 18.4239547,24.4664053 C18.4003203,17.8425121 18.4030435,11.2178717 18.418542,4.59370685 C18.4195169,3.9969285 18.2741808,3.78062522 17.6384067,3.7838516 C12.6723021,3.80942491 7.70643273,3.81146262 2.74036168,3.78222143 C2.05852919,3.77933467 1.93235605,4.01812072 1.93746618,4.64020068 C1.96395817,7.93817196 1.95027512,11.2369244 1.94997255,14.5349636 L1.95003979,14.5344881 Z M10.1689101,2.33836561 C11.1535177,2.33836561 12.1377556,2.33850146 13.1226995,2.33826372 C13.513927,2.33816184 13.8600374,2.2325064 13.8776875,1.77004733 C13.8979935,1.24163427 13.5217266,1.15866537 13.0986281,1.15893707 C11.1569469,1.16019366 9.21529936,1.16104271 7.27405525,1.15638993 C6.84709047,1.15540503 6.45586298,1.25297754 6.46836935,1.75360977 C6.48053952,2.24272893 6.87573409,2.34458064 7.29836198,2.34254292 C8.25489756,2.33731279 9.21224001,2.34155803 10.1692799,2.34002974 L10.1689101,2.33836561 Z M11.755807,28.0582488 C11.7504616,27.1663417 11.0758572,26.4675418 10.205387,26.4533797 C9.32947041,26.4390478 8.56221134,27.2020696 8.5668508,28.083075 C8.57226351,28.9796689 9.31780453,29.6913403 10.2283153,29.6690953 C11.1225544,29.6474616 11.7608499,28.974201 11.7555045,28.0584187 L11.755807,28.0582488 Z"></path></g></g>';
        var obj = $board.createMoveObj(inside);
        obj.setSize(20,31);
        commonAdd(e,obj,this);
    })
    // 添加标签
    $board.on('mousedown','#addLabel',function(e) {
        var inside = '<g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g fill="'+fill_color+'" fill-rule="nonzero"><path d="M23.9337931,14.1682759 C23.9337931,13.6165517 23.7462069,13.142069 23.36,12.7227586 L12.0606896,1.44551725 C11.6634483,1.04827587 11.1117241,0.706206918 10.4496552,0.419310356 C9.76551721,0.132413793 9.15862067,0 8.60689652,0 L2.03034482,3.23275861e-08 C1.47862067,3.23275861e-08 1.00413792,0.209655194 0.606896541,0.606896573 C0.209655162,1.00413795 0,1.4786207 0,2.03034485 L0,8.58482761 C0,9.13655176 0.132413793,9.76551727 0.419310356,10.4275862 C0.706206918,11.1117242 1.0262069,11.6413794 1.44551725,12.0386207 L12.7448276,23.3379311 C13.142069,23.7351724 13.6165517,23.9117242 14.1682759,23.9117242 C14.72,23.9117242 15.1944828,23.7241379 15.6137931,23.3379311 L23.36,15.5917242 C23.7241379,15.1944828 23.9337931,14.72 23.9337931,14.1682759 Z M6.47724139,6.49931037 C6.08000001,6.89655175 5.60551726,7.08413796 5.05379311,7.08413796 C4.50206897,7.08413796 4.02758622,6.89655175 3.63034484,6.49931037 C3.23310346,6.10206899 3.04551724,5.62758624 3.04551724,5.07586209 C3.04551724,4.52413794 3.23310346,4.04965519 3.63034484,3.65241381 C4.02758622,3.25517244 4.50206897,3.06758622 5.05379311,3.06758622 C5.60551726,3.06758622 6.08000001,3.25517244 6.47724139,3.65241381 C6.87448277,4.04965519 7.05103448,4.52413794 7.05103448,5.07586209 C7.08413793,5.63862071 6.87448277,6.10206899 6.47724139,6.49931037 Z M29.417931,12.7117242 L18.1186207,1.44551725 C17.7213793,1.04827587 17.1696552,0.706206918 16.5075862,0.419310356 C15.8234483,0.132413825 15.2165517,3.23275859e-08 14.6648276,3.23275859e-08 L11.1117241,3.23275859e-08 C11.6634483,3.23275859e-08 12.2924138,0.132413825 12.9544828,0.419310388 C13.6386207,0.70620695 14.1682759,1.02620693 14.5655173,1.44551728 L25.8648276,12.7117242 C26.262069,13.1310345 26.4496552,13.6055173 26.4496552,14.1572414 C26.4496552,14.7089656 26.262069,15.1834483 25.8648276,15.5806897 L18.4606897,23.0068966 C18.7806897,23.3268966 19.0675862,23.5586207 19.2993103,23.7131035 C19.5310345,23.8675862 19.8510345,23.9227586 20.2262069,23.9227586 C20.777931,23.9227586 21.2524138,23.7351724 21.6717241,23.337931 L29.417931,15.5696552 C29.8151724,15.1724138 29.9917241,14.697931 29.9917241,14.1462069 C29.9917241,13.5944827 29.8041379,13.142069 29.417931,12.7117242 Z"></path></g></g>';
        var obj = $board.createMoveObj(inside);
        obj.setSize(30,28);
        commonAdd(e,obj,this);
    })
    // 添加数据源
    $board.on('mousedown','#addDatabase',function(e) {
        var inside = '<g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g fill="'+fill_color+'" fill-rule="nonzero"><path d="M15.0514341,23.0249157 C15.3128371,22.2304537 15.9955604,21.6620917 16.8331881,21.5418309 L18.8951661,21.2460216 L19.8172731,19.4015168 C20.1917868,18.6522627 20.9502862,18.1867341 21.79674,18.1867341 C22.6431016,18.1867341 23.401601,18.6521716 23.7762069,19.4014561 L24.6983139,21.2460216 L24.7826087,21.2581053 L24.7826087,0.736988214 C24.7826087,0.329996082 24.4484126,6.07224367e-05 24.0361646,6.07224367e-05 L21.0922741,6.07224367e-05 L21.0922741,8.68212435 C21.0922434,8.97550481 20.8513835,9.21329387 20.5542452,9.21338495 C20.5542144,9.21338495 20.5541529,9.21338495 20.5541221,9.21338495 C20.4262499,9.21338495 20.3088646,9.16933082 20.2165432,9.09579595 L18.2268661,7.52041306 L16.2361742,9.09661571 C16.1448369,9.16948263 16.0273286,9.21359748 15.8993333,9.21359748 C15.6021949,9.21359748 15.3613658,8.97583878 15.3613658,8.68248869 C15.3613658,8.6823976 15.3613658,8.68230652 15.3613658,8.68212435 L15.3613658,6.07224367e-05 L5.93996923,6.07224367e-05 L5.93996923,27.826087 L16.9054276,27.826087 L17.1019411,26.6947369 L15.6099755,25.2589852 C15.0038895,24.6756855 14.789908,23.8196509 15.0514648,23.0249461 L15.0514341,23.0249157 Z M0,0.736957852 L0,27.0890987 C0,27.4960909 0.334196116,27.8260262 0.746444109,27.8260262 L3.8650133,27.8260262 L3.8650133,0 L0.746444109,0 C0.334196116,0 0,0.32993536 0,0.736927491 L0,0.736957852 Z"></path><path d="M26.9224577,23.7687789 C26.8374773,23.512682 26.6147741,23.3250953 26.3443873,23.2927724 L23.5981933,22.8933644 L22.3626096,20.3878749 C22.2464986,20.1562224 22.010984,20 21.7390107,20 C21.4670374,20 21.2315527,20.1562224 21.1172377,20.3838907 L19.8798281,22.8934243 L17.1170212,23.2951689 C16.7784165,23.345915 16.5217391,23.6349938 16.5217391,23.9840153 C16.5217391,24.1792708 16.60205,24.3557736 16.7314812,24.4821295 L18.7308412,26.4325578 L18.258884,29.1863555 C18.2525382,29.221704 18.2488863,29.2624147 18.2488863,29.3039342 C18.2488863,29.6883341 18.5602218,29.9999101 18.9443249,29.9999101 C19.062651,29.9999101 19.1741223,29.9703133 19.2716448,29.9181293 L21.7390706,28.619761 L24.210238,29.9199267 C24.3040787,29.9703432 24.41555,30 24.5339359,30 C24.6875832,30 24.8295265,29.9501227 24.9445599,29.8656757 C25.1171848,29.7390202 25.2293147,29.5345681 25.2293147,29.3039641 C25.2293147,29.2624147 25.2256629,29.221674 25.2187183,29.1821616 L24.7473598,26.4325278 L26.7465402,24.4822494 C26.876181,24.3557437 26.9565217,24.1791809 26.9565217,23.9838655 C26.9565217,23.9069975 26.9440695,23.8330053 26.9210808,23.763896 L26.9224577,23.7687789 Z"></path></g></g>';
        var obj = $board.createMoveObj(inside);
        obj.setSize(27,30);
        commonAdd(e,obj,this);
    })
    // 添加信息提取
    $board.on('mousedown','#addInfo',function(e) {
        var inside = '<g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g fill="'+fill_color+'" fill-rule="nonzero"><path d="M18.3680878,0 L18.3680878,7.33082706 L25.7142857,7.33082706 L18.3680878,0 Z M16.5308901,0 L3.67374721,0 C1.64494092,0.000357129514 0.000357909903,1.64135429 0,3.66573696 L0,25.6575713 C0.000357909903,27.681954 1.64494092,29.3229511 3.67374721,29.3233083 L22.0398902,29.3233083 C24.0689497,29.3233083 25.7139277,27.6822066 25.7142857,25.6575713 L25.7142857,9.16337213 L16.5308901,9.16337213 L16.5308901,0 Z M18.3680878,23.8250262 L7.34749443,23.8250262 L7.34749443,21.9924812 L18.3680878,21.9924812 L18.3680878,23.8250262 Z M18.3680878,18.3273911 L7.34749443,18.3273911 L7.34749443,16.494846 L18.3680878,16.494846 L18.3680878,18.3273911 Z M18.3680878,10.9959172 L18.3680878,12.8284622 L7.34749443,12.8284622 L7.34749443,10.9959172 L18.3680878,10.9959172 Z"></path></g></g>';
        var obj = $board.createMoveObj(inside);
        obj.setSize(26,30);
        commonAdd(e,obj,this);
    })
    // 添加轨迹
    $board.on('mousedown','#addTrajectory',function(e) {
        var inside = '<g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g fill-rule="nonzero"><path d="M7.60580094,4.55636123 C8.03974011,4.55636123 8.36519447,4.23090686 8.36519447,3.79696769 L8.36519447,0.759393533 C8.36519447,0.325454363 8.03974011,0 7.60580094,0 C7.17186177,0 6.8464074,0.325454363 6.84640737,0.759393533 L6.84640737,3.79696769 C6.84640737,4.23090686 7.17186174,4.55636123 7.60580094,4.55636123 Z M16.7185234,4.55636123 C17.1524626,4.55636123 17.4779169,4.23090686 17.4779169,3.79696769 L17.4779169,0.759393533 C17.4779169,0.325454363 17.1524626,0 16.7185234,0 C16.2845842,0 15.9591299,0.325454363 15.9591299,0.759393533 L15.9591299,3.79696769 C15.9591299,4.23090686 16.2845842,4.55636123 16.7185234,4.55636123 Z" fill="#000000"></path><path d="M22.7936717,2.27818063 L18.2373105,2.27818063 L18.2373105,3.79696769 C18.2373105,4.62868442 17.5502401,5.31575476 16.7185234,5.31575479 C15.8868067,5.31575479 15.1997363,4.62868445 15.1997363,3.79696769 L15.1997363,2.27818063 L9.124588,2.27818063 L9.124588,3.79696769 C9.124588,4.62868442 8.43751766,5.31575476 7.60580094,5.31575479 C6.77408421,5.31575479 6.08701387,4.62868445 6.08701384,3.79696769 L6.08701384,2.27818063 L1.53065262,2.27818063 C0.698935888,2.27818063 0.0118655502,2.96525097 0.0118655212,3.79696769 L0.0118655212,28.1337226 C0.0118655212,28.9654393 0.698935859,29.6525097 1.53065262,29.6525097 L22.7936717,29.6525097 C23.6253884,29.6525097 24.3124588,28.9654393 24.3124588,28.1337226 L24.3124588,3.79696769 C24.3124588,2.96525097 23.6253885,2.27818063 22.7936717,2.27818063 Z M19.0690272,16.7428195 L17.116301,16.7428195 C16.7908466,16.7428195 16.5015538,16.5258499 16.393069,16.2003955 L15.3443827,12.9096902 L12.2344854,20.0335248 C12.1260006,20.286656 11.8728694,20.467464 11.5835766,20.5036256 L11.547415,20.5036256 C11.2581222,20.5036256 11.0049911,20.3589792 10.8603447,20.105848 L8.50984086,15.7302947 L7.56963932,16.5258499 C7.42499293,16.6343347 7.24418496,16.7066579 7.06337696,16.7066579 L5.25529711,16.7066579 C4.82135794,16.7066579 4.49590358,16.3812035 4.49590358,15.9472643 C4.49590358,15.5133252 4.82135794,15.1878708 5.25529711,15.1878708 L6.77408418,15.1878708 L8.22054808,13.9583765 C8.40135605,13.8137301 8.61832564,13.7414069 8.83529522,13.7775685 C9.05226481,13.8137301 9.26923439,13.9583765 9.37771917,14.1753461 L11.4389302,18.044637 L14.7296356,10.4868632 C14.874282,10.1975704 15.1635747,10.0167624 15.4528675,10.0167624 C15.7783219,10.0167624 16.0314531,10.233732 16.1399379,10.5591864 L17.6587249,15.2240324 L19.0690272,15.2240324 C19.5029664,15.2240324 19.8284207,15.5494867 19.8284207,15.9834259 C19.8284207,16.4173651 19.5029664,16.7428195 19.0690272,16.7428195 Z" fill="'+fill_color+'"></path></g></g>';
        var obj = $board.createMoveObj(inside);
        obj.setSize(25,30);
        commonAdd(e,obj,this);
    })
    // 线条样式切换
    $board.on('change','#strokeStyle',function(e) {
        var val = $(this).val();
        $board.setLineStyle(val);
        if(val==1){
            stroke_style = '5,5';
        }else{
            stroke_style = '';
        }
    })
    // 线条颜色切换
    $board.on('change','#strokeColor',function(e) {
        var val = $(this).val();
        $(this).css('color',val);
        $board.setLineColor(val);
        stroke_color = val;
    })
    // 填充颜色切换
    $board.on('change','#fillColor',function(e) {
        var val = $(this).val();
        fill_color = val;
    })
    // 标签颜色切换
    $board.on('change','#tagColor',function(e) {
        var val = $(this).val();
        $board.setTagColor(val);
    })
    // 标签位置切换
    $board.on('change','#tagPosition',function(e) {
        var val = $(this).val();
        $board.setTagPosition(val);
    })
    // 标签名修改
    $board.on('keyup','#tagText',function(e) {
        var val = $(this).val();
        $board.setTagText(val);
    })
    // 标签文字颜色切换
    $board.on('change','#tagFontColor',function(e) {
        var val = $(this).val();
        $(this).css('color',val);
        $board.setTagFontColor(val);
    })
    // 收缩菜单
    $board.on('click','.menu_head',function(e){
        $(this).siblings('li').toggle();
    })
    // 鼠标抬起重置参数
    $board.mouseup(function(e) {
        if(move_obj){
            if(e.which==1){
                move_obj.css('opacity',1);
                move_obj = '';
            }else if(e.which==3){
                move_obj.remove();
            }
            if(btn_obj){
                btn_obj.css('border-color','#f2f2f2');
                btn_obj = '';
            }
        }
    })
}

// 生成单一指向关系图
DragLine.LoadingInfo = function($board,data,num){
    // 初始化
    $board.setMoveTogether(true);
    $board.setRightMenu(false);
    $board.setRemarkStatus(false);
    $board.hide();
    $board.fadeIn(1000);
    // 获取变量
    var width = $board.width();                                         //画板宽度
    var height = $board.height();                                       //画板高度
    var x0 = width/2-30;                                                //中心点x轴
    var y0 = height/2-30;                                               //中心点y轴
    var r_list = [80,140,195,245];                                      //外层半径
    var partNum = num || 1;                                             //模块数量 (目前支持2、3分法)
    // 中心点画圆
    var circle = '<circle cx="30" cy="30" r="28" style="fill:white;" stroke="rgb(0,82,137)" stroke-width="2"></circle><text x="50%" y="50%" dy=".3em" fill="rgb(0,82,137)" text-anchor="middle">'+data.father.name+'</text>';
    var obj = $board.createMoveObj(circle,x0,y0,data.father.id);
    obj.setSize(60,60);

    // 圆方程
    function c(x,r){
        var y1 = y0 + Math.sqrt(r*r-(x-x0)*(x-x0));
        var y2 = y0 - Math.sqrt(r*r-(x-x0)*(x-x0));
        if(y1 == y2){
            return [y1];
        }else{
            return [y1,y2];
        }
    }
    // 获取等分列表
    function get_x_list(r){
        var n;
        if(r<100){
            n = 1;
        }else if(r < 120){
            n = 2;
        }else if(r < 160){
            n = 3;
        }else if(r < 220){
            n = 4;
        }else{
            n = 5;
        }
        var x_list = [];
        if(n==1){               // 总点数：8
            x_list = [x0,x0+Math.sqrt(2)*r/2,x0-Math.sqrt(2)*r/2,x0+r,x0-r];
        }else if(n==2){         // 总点数：12
            x_list = [x0,x0+r/2,x0-r/2,x0+Math.sqrt(3)*r/2,x0-Math.sqrt(3)*r/2,x0+r,x0-r];
        }else if(n==3){         // 总点数：20
            x_list = [x0,x0+3*r/10,x0-3*r/10,x0+4*r/7,x0-4*r/7,x0+4*r/5,x0-4*r/5,x0+18*r/19,x0-18*r/19,x0+r,x0-r];
        }else if(n==4){         // 总点数：28
            x_list = [x0,x0+r/5,x0-r/5,x0+2*r/5,x0-2*r/5,x0+3*r/5,x0-3*r/5,x0+3.8*r/5,x0-3.8*r/5,x0+9*r/10,x0-9*r/10,x0+9.8*r/10,x0-9.8*r/10,x0+r,x0-r];
        }else{                  // 总点数：44
            x_list = [x0,x0+1.1*r/9,x0-r/9,x0+2*r/9,x0-2*r/9,x0+3*r/9,x0-3*r/9,x0+4*r/9,x0-4*r/9,x0+5*r/9,x0-5*r/9,x0+6*r/9,x0-6*r/9,x0+7*r/9,x0-7*r/9,x0+7.8*r/9,x0-7.8*r/9,x0+8.5*r/9,x0-8.5*r/9,x0+8.9*r/9,x0-8.9*r/9,x0+r,x0-r];
        }
        return x_list;
    }
    // 随机坐标
    function random_position(x,y){
        if(Math.random()>0.5){
            x += Math.random()*10;
            y += Math.random()*10;
        }else{
            x -= Math.random()*10;
            y -= Math.random()*10;
        }
        return [x,y];
    }
    // 分布算法
    function cutPart(r_list,part_num){
        var point_dict = {};
        for(p=1;p<=partNum;p++){
            point_dict[p] = {};
        }
        for(m in r_list){
            for(key in point_dict){
                point_dict[key][m] = [];
            }
            var r = r_list[m];
            var x_list = get_x_list(r);
            for(i in x_list){
                var x = x_list[i];
                var y_list = c(x,r);
                for(j in y_list){
                    // 得到x、y值,设置坐标分布类型
                    var y = y_list[j];
                    var random_xy = random_position(x,y)
                    var xy = {'x':random_xy[0],'y':random_xy[1]};
                    if(part_num==1){                               //不分
                        point_dict[1][m].push(xy);
                    }else if(part_num==2){                         //二等分
                        var l = (height-y0)/x0;
                        if((height-y)/x > l){
                            point_dict[1][m].push(xy);
                        }else{
                            point_dict[2][m].push(xy);
                        }
                    }else if(part_num==3){                          //三等分
                        var l = (y0-y)/(x-x0);
                        if(y<y0&&(l<=-(Math.sqrt(3)/3)||l>Math.sqrt(3)/3)){
                            point_dict[1][m].push(xy);
                        }else if(x>=x0&&l<=Math.sqrt(3)/3){
                            point_dict[2][m].push(xy);
                        }else{
                            point_dict[3][m].push(xy);
                        }
                    }
                }
            }
        }
        return point_dict
    }
    // 随机排序方法
    function randomsort(a, b) {
        return Math.random()>.5 ? -1 : 1;
    }
    // 筛选显示隐藏方法
    function select_toggle(opacity){
        $('.movebody').each(function(){
            var this_id = $(this).attr('id');
            if(this_id != data.father.id){
                var style = $(this).attr('style_name');
                var show_status = false;
                if(style){
                    style = style.split(',');
                    for(i in style){
                        if($.inArray(style[i], style_list)!=-1){
                            show_status = true;
                            break;
                        }
                    }
                }else{
                    show_status = true;
                }

                var close = parseInt($(this).attr('close'));
                if(close){
                    if(show_status && close<=close_max && close>close_min){
                        $(this).css('opacity',1);
                        $('path[link1="'+this_id+'"]').each(function(){
                            $(this).css('opacity',1);
                        })
                    }else{
                        $(this).css('opacity',opacity);
                        $('path[link1="'+this_id+'"]').each(function(){
                            $(this).css('opacity',opacity);
                        })
                    }
                }

            }

        })
    }

    // 数据处理
    var point_dict = cutPart(r_list,partNum);
    var index_dict = {};
    // 生成随机排列索引
    for(p=1;p<=partNum;p++){
        if(!index_dict[p]){
            index_dict[p] = {};
        }
        for(s in point_dict[p]){
            index_dict[p][s] =  [];
            for(i=0;i<point_dict[p][s].length;i++){
                index_dict[p][s].push(i);
            }
            index_dict[p][s].sort(randomsort);
        }
    }
    // 画图
    var style_color_list = ['rgb(64,169,249)','rgb(142,25,126)','orange'];
    var style_border_list = ['rgb(28,17,160)','rgb(96,6,84)','#E7864A'];
    for(i in data.children){
        var children = data.children[i];
        var style = children.style;
        var m,r,stroke_color,fill_color,text;
        children.defs = '';
        // 类型条件判断
        if(style.length==1){
            fill_color = style_color_list[style[0]-1];
            stroke_color = style_border_list[style[0]-1];
        }else if(style.length==2){
            children.defs = '<defs><linearGradient id="style_'+children.id+'" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style="stop-color:'+style_color_list[style[0]-1]+';stop-opacity:1"></stop><stop offset="100%" style="stop-color:'+style_color_list[style[1]-1]+';stop-opacity:1"></stop></linearGradient></defs>';
            fill_color = 'url(#style_'+children.id+')';
            stroke_color = style_border_list[style[0]-1];
        }else if(style.length==3){
            children.defs = '<defs><linearGradient id="style_'+children.id+'" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style="stop-color:'+style_color_list[style[0]-1]+';stop-opacity:1"></stop><stop offset="50%" style="stop-color:'+style_color_list[style[1]-1]+';stop-opacity:1"></stop><stop offset="100%" style="stop-color:'+style_color_list[style[2]-1]+';stop-opacity:1"></stop></linearGradient></defs>';
            fill_color = 'url(#style_'+children.id+')';
            stroke_color = style_border_list[style[0]-1];
        }
        style = style[0];
        var line_color = stroke_color;
        // 亲密度条件判断
        if(children.close >= 90){
            m = 0;
            r = 26;
            text = '<text x="50%" y="50%" dy=".3em" fill="#fff" text-anchor="middle">'+children.name+'</text>';
        }else if(children.close >= 80){
            m = 1;
            r = 20;
            text = '<text x="50%" y="50%" dy=".3em" fill="#fff" text-anchor="middle" style="font-size:14px;">'+children.name+'</text>';
        }else if(children.close >= 50){
            m = 2;
            r = 18;
            text = '<text x="50%" y="50%" dy=".3em" fill="'+fill_color+'" text-anchor="middle" style="font-size:12px;">'+children.name+'</text>';
            fill_color = '#fff';
            line_color = '#ccc';
        }else{
            m = 3;
            r = 9;
            fill_color = '#fff';
            text = '';
            line_color = '#ccc';
        }
        // 画图方法
        if(index_dict[style]){
            var last_one = index_dict[style][m].pop();
            var xy = point_dict[style][m][last_one];
            if(xy){
                var inside = children.defs+'<circle cx="'+(r+1)+'" cy="'+(r+1)+'" r="'+r+'" style="fill:'+fill_color+'" stroke="'+stroke_color+'" stroke-width="1"></circle>'+text;
                var obj = $board.createMoveObj(inside,xy.x,xy.y,children.id);
                obj.setSize((r+1)*2,(r+1)*2);
                obj.attr({'style_name':children.style,'close':children.close});
                var line = $board.drawLine(obj.attr('id'),data.father.id);
                line.attr({'stroke':line_color,'stroke-width':1});
            }else{
                console.log('节点不足：',children.id);
            }
        }
    }
    var info = {
        // 筛选方法
        selectCommon:function(styles,min,max,opacity){
            opacity = opacity || 0.2;
            style_list = styles;
            close_min = min;
            close_max = max;
            select_toggle(opacity);
        },
    }
    // 发散连线动画
    var nodelist = document.querySelectorAll('path');
    for(i=0;i<nodelist.length;i++){
        path = nodelist[i];
        var length = path.getTotalLength();
        $(path).attr({'stroke-dasharray':length,'stroke-dashoffset':length});
        $(path).animate({'stroke-dashoffset':length},500).animate({'stroke-dashoffset':length*2},1200).animate({'stroke-dasharray':'','stroke-dashoffset':''},0);
    }
    // 圆展开动画
    $('.movebody circle').each(function(){
        var r = parseInt($(this).attr('r').split('px')[0]);
        $(this).css('r','0');
        $(this).animate({'r':r},500*Math.random());
    })
    $board.setStatus(1);
    return info;
}

// 生成随机分布图
DragLine.RandomInfo = function($board,data,main_r){
    main_r = main_r || 18;
    // 初始化
    $board.setRightMenu(false);
    $board.setRemarkStatus(false);
    $board.hide();
    $board.fadeIn(800);
    // 获取变量
    var width = $board.width();                                         //画板宽度
    var height = $board.height();                                       //画板高度
    var color_list = ['#4990E2','#BD0FE1','#F67D23','#417505']          //散点颜色数组
    var total = data.children.length;                                   //子节点总个数
    var style_list = [1,2,3];                                           //筛选样式列表
    var close_min = 0;                                                  //亲密度最小值
    var close_max = 100;                                                //亲密度最大值
    // 画主图
    var n,main_font;
    if(total<=50){
        n = 0.25;
        main_r = main_r+14;
        main_font = 16;
    }else if(total<=100){
        n = 0.2;
        main_r = main_r+6;
        main_font = 14;
    }else{
        n = 0.12;
        main_r = main_r;
        main_font = 12;
    }
    var circle = '<circle cx="'+(main_r+1)+'" cy="'+(main_r+1)+'" r="'+main_r+'" style="fill:#ff3333;" stroke="#111" stroke-width="1"></circle><text x="50%" y="50%" dy=".3em" fill="#fff" text-anchor="middle" style="font-size:'+main_font+'px;">'+data.father.name+'</text>';
    var obj = $board.createMoveObj(circle,width/2-main_r-1,height/2-main_r-1,data.father.id);
    obj.setSize((main_r+1)*2,(main_r+1)*2);

    // 随机坐标方法
    function random_xy(width,height){
        var x = Math.random();
        var y = Math.random();
        if(x>0.45&&x<0.57&&y>0.45&&y<0.57){
            x += (Math.random()>.5 ? -1 : 1)*0.15;
        }
        x = 0.95*x*width;
        y = 0.95*y*height;
        return [x,y];
    }
    // 筛选显示隐藏方法
    function select_toggle(opacity){
        $('.movebody').each(function(){
            var this_id = $(this).attr('id');
            if(this_id != data.father.id){
                var style = $(this).attr('style_name');
                var close = parseInt($(this).attr('close'));
                if($.inArray(style, style_list)!=-1 && close<=close_max && close>close_min){
                    $(this).css('opacity',1);
                    $('path[link1="'+this_id+'"]').each(function(){
                        $(this).css('opacity',1);
                    })
                }else{
                    $(this).css('opacity',opacity);
                    $('path[link1="'+this_id+'"]').each(function(){
                        $(this).css('opacity',opacity);
                    })
                }
            }

        })
    }

    // 画散点图
    data.children.sort(function(a,b){return a.close-b.close})
    for(i in data.children){
        var children = data.children[i];
        var r_array = random_xy(width,height);
        var random_x = r_array[0];
        var random_y = r_array[1];
        var r = n*children.close;
        var inside = '<circle cx="'+(r+1)+'" cy="'+(r+1)+'" r="'+r+'" style="fill:'+color_list[children.style-1]+'" stroke="#111" stroke-width="1"></circle>';
        var obj = $board.createMoveObj(inside,random_x,random_y,children.id);
        obj.attr({'style_name':children.style,'close':children.close});
        obj.setSize((r+1)*2,(r+1)*2);
    }
    // 圆展开动画
    $('.movebody circle').each(function(){
        var r = parseInt($(this).attr('r').split('px')[0]);
        $(this).css('r','0');
        $(this).animate({'r':r},1000*Math.random());
    })
    $board.setStatus(1);
    var info = {
        // 筛选方法
        selectCommon:function(styles,min,max,opacity){
            opacity = opacity || 0.2;
            style_list = styles;
            close_min = min;
            close_max = max;
            select_toggle(opacity);
        },

    }
    return info
}

// 生成力导向图
DragLine.ForceInfo = function($board,data){
    // 初始化
    $board.setRightMenu(false);
    $board.setRemarkStatus(false);
    // 获取变量
    var width = $board.width();                                         //画板宽度
    var height = $board.height();                                       //画板高度
    var color_list = ['#4990E2','#BD0FE1','#F67D23','#417505']          //散点颜色数组

    // 范围随机方法
    function random(min,max){
        return Math.round(min+(max-min)*Math.random());
    }
    // 获取px数值
    function get_px_num(px){
        return parseFloat(px.split('px')[0]);
    }

    // 画图
    for(i in data.children){
        var circle = '<circle cx="10" cy="10" r="10" fill="'+color_list[data.children[i].style]+'"></circle>';
        var obj = $board.createMoveObj(circle,random(0,width),random(0,height),i.id);
        obj.setSize(20,20);
        obj.attr('relation',data.children[i].close);
        obj.attr('data_style',data.children[i].style);
    }

    function move(){
        var relation = 200;         // 关系表示原始距离
        var k = 0.05;               // 弹簧系数
        var t = 0.04;                // 时间
        $('.movebody').each(function(){
            // relation = $(this).attr('relation');
            var left = get_px_num($(this).css('left'));
            var top = get_px_num($(this).css('top'));
            var old_left = left;
            var old_top = top;
            var id = $(this).attr('id');
            var style = $(this).attr('data_style');
            $('.movebody').each(function(){
                var in_id = $(this).attr('id');
                var in_style = $(this).attr('data_style');
                if(!(id==in_id) && style==in_style){
                    var in_left = get_px_num($(this).css('left'));
                    var in_top = get_px_num($(this).css('top'));
                    // 计算力
                    var distance = Math.sqrt((left-in_left)*(left-in_left)+(top-in_top)*(top-in_top));
                    var f = (relation-distance)*k;
                    // a = f/m,v = v0+a*Δt,s = s0+v*Δt
                    // s =s0 + (v0+f*t)*t
                    left += f*t*(left-in_left)*t;
                    top += f*t*(top-in_top)*t;
                }

                // 连线
                // $('path[link1="'+id+'"][link2="'+in_id+'"]').remove();
                // $('path[link1="'+in_id+'"][link2="'+id+'"]').remove();
                // if(!$('path[link1="'+id+'"][link2="'+in_id+'"]').length && !$('path[link1="'+in_id+'"][link2="'+id+'"]').length){
                //     var line = $board.drawLine(id,in_id);
                //     line.attr({'stroke-width':1});
                // }

            })
            var d_left = left-old_left;
            if(d_left>0.008 || d_left<-0.008){
                $(this).css({'left':left,'top':top});
            }
            $(this).css('opacity',1);
        })
    }
    force_timer=setInterval(move,10)
    $board.setStatus(1);
}