// 构造函数体
var DragLine = function(){

};

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
        $(point1).attr({'class':'point1','cx':'','cy':'','r':'4','fill':'red','for':'path_'+draw_path_id});
        var p_line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');   
        $(p_line1).attr({'class':'line1','x1':'','y1':'','x2':'','y2':'','stroke':'red','stroke-width':'1','for':'path_'+draw_path_id});
        var point2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');   
        $(point2).attr({'class':'point2','cx':'','cy':'','r':'4','fill':'red','for':'path_'+draw_path_id});
        var p_line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');   
        $(p_line2).attr({'class':'line2','x1':'','y1':'','x2':'','y2':'','stroke':'red','stroke-width':'1','for':'path_'+draw_path_id});
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
                var left = point.position().left-main_left+r+65/wheelnum;
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
        obj.animate({'left':x+move1,'top':y+move1},70).animate({'left':x-move1,'top':y-move1},70).animate({'left':x+move2,'top':y+move2},80).animate({'left':x-move2,'top':y-move2},80).animate({'left':x+move3,'top':y+move3},90).animate({'left':x-move3,'top':y-move3},90).animate({'left':x,'top':y},100);
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
                        var mx =parseInt($link1.css('left').split('px')[0]) + draw_end_x - draw_start_x;
                        var my =parseInt($link1.css('top').split('px')[0]) + draw_end_y - draw_start_y;
                        $link1.css({'left':mx,'top':my});
                        var l_array = get_absolute_center($link1);
                        var lx = l_array[0];
                        var ly = l_array[1];
                        move_line(this,lx,ly,1);
                        shaking($link1,mx,my);
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
        setBorder:function(width,color='#333'){
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
        createMoveObj:function(svg,cx='',cy='',id=''){
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
        setClickFuc:function(fuc='',fuc2=''){
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
    var status_li = '<li id="dragMove" class="li_status" title="移动">移动</li><li id="dragDraw" class="li_status" title="连线">连线</li><li id="dragDelete" class="li_status" title="删除">删除</li><div class="menuline"></div>';
    var icon_li = '<li id="addCircle" class="li_icon">○</li><li id="addRect" class="li_icon">□</li><li id="addTriangle" class="li_icon">△</li><div class="menuline"></div>';
    var style_select = '<select id="strokeStyle" title="线条样式"><option value="0">—</option><option value="1">- -</option></select><select id="strokeColor" title="线条颜色"><option value="black" style="color:black">——</option><option value="red" style="color:red">——</option><option value="green" style="color:green">——</option><option value="yellow" style="color:yellow">——</option></select><input type="color" id="fillColor" style="width:30px;height:20px;" value="#ffffff" title="物体填充颜色"/><div class="menuline"></div>';
    var tag_li = '<span>标签：</span><select id="tagPosition"><option value="right">右标签</option><option value="left">左标签</option><option value="top">上标签</option><option value="bottom">下标签</option></select><input type="color" id="tagColor" style="width:30px;height:20px;" value="#F67D23" title="标签填充颜色"/><input type="text" id="tagText" value="标签名"/><select id="tagFontColor" style="color:#fff" title="标签字体颜色"><option value="#fff" style="color:#fff">A</option><option value="#000" style="color:#000">A</option><option value="red" style="color:red">A</option><option value="blue" style="color:blue">A</option></select>';
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
    var fill_color = 'none';                                //初始填充色

    // 添加共用方法
    function commonAdd(e,obj,that){
        xx = e.pageX;
        yy = e.pageY;
        obj.css({'left':xx-main_left-obj.width()/2,'top':yy-main_top-obj.height()/2,'opacity':0.5,'cursor':'Move','fill':fill_color,'stroke':stroke_color,'stroke-width':1,'stroke-dasharray':stroke_style});
        $(that).css('border-style','inset');
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
    // 添加圆
    $board.on('mousedown','#addCircle',function(e) {
        var inside = '<circle cx="41" cy="41" r="40"/>';
        var obj = $board.createMoveObj(inside);
        obj.setSize(82,82);
        commonAdd(e,obj,this);
    })
    // 添加方块
    $board.on('mousedown','#addRect',function(e) {
        var inside = '<rect x="1" y="1" width="100" height="80"/>';
        var obj = $board.createMoveObj(inside);
        obj.setSize(102,82);
        commonAdd(e,obj,this);
    })
    // 添加三角
    $board.on('mousedown','#addTriangle',function(e) {
        var inside = '<path d="M 0,80 L 80,80 40,0 Z"/>';
        var obj = $board.createMoveObj(inside);
        obj.setSize(80,81);
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
                btn_obj.css('border-style','outset');
                btn_obj = '';
            }
        }
    })
}

// 生成单一指向关系图
DragLine.LoadingInfo = function($board,data,num=1){
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
    var r_list = [80,140,195,245]                                       //外层半径
    var partNum = num                                                   //模块数量 (目前支持2、3分法)
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
        selectCommon:function(styles,min,max,opacity=0.2){
            style_list = styles;
            close_min = min;
            close_max = max;
            select_toggle(opacity);
        },
    }
    // 发散连线动画
    document.querySelectorAll('path').forEach(function(path) {
        var length = path.getTotalLength(); 
        $(path).attr({'stroke-dasharray':length,'stroke-dashoffset':length});
        $(path).animate({'stroke-dashoffset':length},500).animate({'stroke-dashoffset':length*2},1200).animate({'stroke-dasharray':'','stroke-dashoffset':''},0);
    })
    // 圆展开动画
    $('.movebody circle').each(function(){
        var r = parseInt($(this).css('r').split('px')[0]);
        $(this).css('r','0');
        $(this).animate({'r':r},500*Math.random());
    })
    $board.setStatus(1);
    return info;
}

// 生成随机分布图
DragLine.RandomInfo = function($board,data){
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
    var n,main_r,main_font;
    if(total<=50){
        n = 0.25;
        main_r = 30;
        main_font = 16;
    }else if(total<=100){
        n = 0.2;
        main_r = 20;
        main_font = 14;
    }else{
        n = 0.12;
        main_r = 16;
        main_font = 12;
    }
    var circle = '<circle cx="'+(main_r+1)+'" cy="'+(main_r+1)+'" r="'+main_r+'" style="fill:#ff3333;" stroke="#111" stroke-width="1"></circle><text x="50%" y="50%" dy=".3em" fill="#fff" text-anchor="middle" style="font-size:'+main_font+'px;">'+data.father.name+'</text>';
    var obj = $board.createMoveObj(circle,width/2-main_r-1,height/2-main_r-1,data.father.id);
    obj.setSize((main_r+1)*2,(main_r+1)*2);

    // 随机坐标方法
    function random_xy(width,height){
        var x = Math.random();
        var y = Math.random();
        if(x>0.47&&x<0.55&&y>0.47&&y<0.55){
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
        var r = parseInt($(this).css('r').split('px')[0]);
        $(this).css('r','0');
        $(this).animate({'r':r},1000*Math.random());
    })
    $board.setStatus(1);
    var info = {
        // 筛选方法
        selectCommon:function(styles,min,max,opacity=0.2){
            style_list = styles;
            close_min = min;
            close_max = max;
            select_toggle(opacity);
        },
       
    }
    return info
}