// 构造函数体
var DragLine = function(){

};

// 创建画布
DragLine.CreateBoard = function(that){
    $(that).append('<div id="dragline_board"><svg class="lines" xmlns="http://www.w3.org/2000/svg"></svg></div>');
    
    // 初始化
    var $board = $('#dragline_board');                 //画布
    var draw_path_id = 1;                              //初始化线条id
    var draw_obj_id = 1;                               //初始化物体id
    var action_status = 0;                             //操作状态码, 0-无操作,1-移动,2-画线,3-删除
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
    
    // 获取左边距方法
    function get_left(that){
        var position_left = $(that).offset().left;
        var border_left = parseInt($(that).css('borderLeftWidth').split('px')[0]);
        return position_left+border_left; 
    }
    // 获取上边距方法
    function get_top(that){
        var position_top = $(that).offset().top;
        var border_top = parseInt($(that).css('borderTopWidth').split('px')[0]);
        return position_top+border_top; 
    }
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
    // 画线方法 type 1-物体连线(end_id) 2-移动画线([end_x,end_y])
    function draw_line(start_id,line,type,end_data){
        var start = get_center($('#'+start_id));
        var start_x = start[0];
        var start_y = start[1];
        var end_id = '';
        var end_x,end_y;
        if(type==1){
            end_id = end_data;
            var end = get_center($('#'+end_id));
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
        return line;
    }
    // 删除线条及相关切线切点方法
    function delete_line(id){
        $('#'+id).remove();
        $('.point1[for="'+id+'"]').remove();
        $('.point2[for="'+id+'"]').remove();
        $('.line1[for="'+id+'"]').remove();
        $('.line2[for="'+id+'"]').remove();
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

    // 绑定选中移动物体事件
    $board.on('mousedown','.movebody',function(e) {
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
                line_obj = CreateLine($board);
                $(this).addClass('selected');
            }
        }
    }); 
    // 绑定画线事件
    $board.on('mouseup','.movebody',function(e) { 
        var end_xx = e.pageX;
        var end_yy = e.pageY;
        if(action_status==1){
            select_obj = {'obj':'','type':''};
        }else if(action_status==2){
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
            // var move_x = $object.position().left - main_left + now_xx - xx;
            var move_x =parseInt($object.css('left').split('px')[0]) + now_xx - xx;
            // var move_y = $object.position().top - main_top+ now_yy - yy;
            var move_y =parseInt($object.css('top').split('px')[0]) + now_yy - yy;
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
            draw_start_x = center_x
            draw_start_y = center_y
        }else if(select_obj.type == 'point'){   //切点移动
            //点动
            var $point = $(select_obj.obj);
            var old_cx = parseFloat($point.attr('cx'));
            var old_cy = parseFloat($point.attr('cy'));
            var new_xx = now_xx-xx+old_cx;
            var new_yy = now_yy-yy+old_cy;
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
        }
        //线条移动
        if(action_status==2){
            if(draw_id&&line_obj){
                draw_line(draw_id,line_obj,2,[xx-main_left,yy-main_top]);
            }
        }
        xx = now_xx;
        yy = now_yy;
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
            }
            line_obj = '';
        }
    })
    // 绑定删线条事件
    $board.on('click','.line',function() {
        if(action_status == 3){
            var id = $(this).attr('id');
            delete_line(id);
        }
    })
    // 绑定删物体事件
    $board.on('click','.movebody',function() {
        if(action_status == 3){
            var id = $(this).attr('id');
            delete_obj(id);
        }
    })
    // 绑定切点显示事件
    $board.on('mouseenter','.line',function(e) { 
        if(action_status==1||action_status==2){
            var id = $(this).attr('id');
            $('.point1[for="'+id+'"]').css('display','block');
            $('.point2[for="'+id+'"]').css('display','block');
            $('.line1[for="'+id+'"]').css('display','block');
            $('.line2[for="'+id+'"]').css('display','block');
        }
    }); 
    // 取消右键菜单
    $board.bind("contextmenu",function(){
        return false;
    });

    // 添加返回对象方法
    $board.extend({
        main_left:main_left,
        main_top:main_top,
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
        // 添加物体方法
        createMoveObj:function(svg,cx='',cy='',id=''){
            var obj_id = 'obj_'+draw_obj_id;
            if(id){
                obj_id = id;
            }
            $(this).append('<svg class="movebody" xmlns="http://www.w3.org/2000/svg" id="'+obj_id+'">'+svg+'</svg>');
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
                    $(this).addClass('fix_point');
                    $(this).attr({'fix-x':x,'fix-y':y});
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
        }
    })
    return $board;
}

// 创建菜单
DragLine.CreateMenu = function($board){
    var status_li = '<li id="dragMove" class="li_status" title="移动">移动</li><li id="dragDraw" class="li_status" title="连线">连线</li><li id="dragDelete" class="li_status" title="删除">删除</li><div class="menuline"></div>';
    var icon_li = '<li id="addCircle" class="li_icon">○</li><li id="addRect" class="li_icon">□</li><li id="addTriangle" class="li_icon">△</li><div class="menuline"></div>';
    var style_select = '<select id="strokeStyle"><option value="0">—</option><option value="1">- -</option></select><select id="strokeColor"><option value="black" style="color:black">——</option><option value="red" style="color:red">——</option><option value="green" style="color:green">——</option><option value="yellow" style="color:yellow">——</option></select><select id="fillColor"><option value="none">无</option><option value="black" style="color:black">■</option><option value="red" style="color:red">■</option><option value="green" style="color:green">■</option><option value="yellow" style="color:yellow">■</option></select>';
    $board.append('<div class="dragline_menu"><ul>'+status_li+icon_li+style_select+'</ul></div>');

    // 初始化
    var main_left = $board.main_left;                       //画布左边距
    var main_top = $board.main_top;                         //画布上边距
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
        $(this).css('color',val);
        fill_color = val;
    })
    // 移动事件
    $board.mousemove(function(e) {
        if(move_obj){
            new_xx = e.pageX;
            new_yy = e.pageY;
            var left =parseInt(move_obj.css('left').split('px')[0]) + new_xx - xx;
            var top =parseInt(move_obj.css('top').split('px')[0]) + new_yy - yy;
            // var left = move_obj.position().left-main_left+new_xx-xx;
            // var top = move_obj.position().top-main_top+new_yy-yy;
            move_obj.css({'left':left,'top':top});
            xx = new_xx;
            yy = new_yy;
        }
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
            btn_obj.css('border-style','outset');
            btn_obj = '';
        }
    })
}

// 生成单一指向关系图
DragLine.LoadingInfo = function($board,data){
    // 获取变量
    var width = $board.width();                                         //画板宽度
    var height = $board.height();                                       //画板高度
    var x0 = width/2-30;                                                //中心点x轴
    var y0 = height/2-30;                                               //中心点y轴
    var r_list = [90,160,210,250]                                       //外层半径
    // 中心点画圆
    var circle = '<circle cx="30" cy="30" r="28" style="fill:white;" stroke="blue" stroke-width="2"/><text x="50%" y="50%" dy=".3em" fill="blue" text-anchor="middle">'+data.father.name+'</text>';
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
    // 获取等分列表(n表示一象限几等分)
    function get_x_list(r,n){
        var x_list = [];
        if(n==1){
            x_list = [x0,x0+Math.sqrt(2)*r/2,x0-Math.sqrt(2)*r/2,x0+r,x0-r];
        }else if(n==2){
            x_list = [x0,x0+r/2,x0-r/2,x0+Math.sqrt(3)*r/2,x0-Math.sqrt(3)*r/2,x0+r,x0-r];
        }else if(n==3){
            x_list = [x0,x0+r/4,x0-r/4,x0+r/2,x0-r/2,x0+3*r/4,x0-3*r/4,x0+r,x0-r];
        }
        return x_list;
    }
    // 分布算法(两部分)
    function twoPart(r_list){
        var l = (height-y0)/x0;
        var point_dict = {'style1':{},'style2':{}};
        for(m in r_list){
            point_dict.style1[m] = [];
            point_dict.style2[m] = [];
            var r = r_list[m];
            var n;
            if(r<100){
                n = 1;
            }else if(r < 200){
                n = 2;
            }else{
                n = 3;
            }
            var x_list = get_x_list(r,n);
            for(i in x_list){
                var x = x_list[i];
                var y_list = c(x,r);
                for(j in y_list){
                    var y = y_list[j];
                    if((height-y)/x > l){
                        var xy = {'x':x,'y':y};
                        point_dict.style1[m].push(xy);
                    }else{
                        var xy = {'x':x,'y':y};
                        point_dict.style2[m].push(xy);
                    }
                }
            }
        }
        return point_dict
    }
    //用Math.random()函数生成0~1之间的随机数与0.5比较，返回-1或1 
    function randomsort(a, b) {  
        return Math.random()>.5 ? -1 : 1;  
    }  

    // 数据处理
    var point_dict = twoPart(r_list);
    var index_dict = {'style1':{},'style2':{}};
    // 生成随机排列索引
    for(p in point_dict){
        style_list = ['style1','style2'];
        for(sl=0;sl<style_list.length;sl++){
            for(s in point_dict[[style_list[sl]]]){
                index_dict[style_list[sl]][s] =  [];
                for(i=0;i<point_dict[[style_list[sl]]][s].length;i++){
                    index_dict[[style_list[sl]]][s].push(i);
                }
                index_dict[[style_list[sl]]][s].sort(randomsort);
            }
        }
        
    }
    // 画图
    for(i in data.children){
        var children = data.children[i];
        var m,n,r,style,stroke_color,fill_color,text;
        // 类型条件判断
        if(children.style == 1){
            style = 'style1';
            fill_color = 'rgb(64,169,249)';
            stroke_color = 'rgb(28,17,160)';
        }else if(children.style == 2){
            style = 'style2';
            fill_color = 'rgb(142,25,126)';
            stroke_color = 'rgb(96,6,84)';
        }
        var line_color = stroke_color;
        // 亲密度条件判断
        if(children.close >= 90){
            m = 0;
            r = 32;
            text = '<text x="50%" y="50%" dy=".3em" fill="#fff" text-anchor="middle">'+children.name+'</text>';
        }else if(children.close >= 80){
            m = 1;
            r = 22;
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
        var last_one = index_dict[style][m].pop();
        var xy = point_dict[style][m][last_one];
        if(xy){
            var inside = '<circle cx="'+(r+1)+'" cy="'+(r+1)+'" r="'+r+'" style="fill:'+fill_color+'" stroke="'+stroke_color+'" stroke-width="1"/>'+text;
            var obj = $board.createMoveObj(inside,xy.x,xy.y,children.id);
            obj.setSize((r+1)*2,(r+1)*2);
            obj.attr({'style_name':children.style,'close':children.close});
            var line = $board.drawLine(obj.attr('id'),data.father.id);
            line.attr({'stroke':line_color,'stroke-width':1});
        }else{
            console.log('节点不足：',children.id);
        }
    }

    var info = {
        // 筛选类型方法
        selectStyle:function(style,type){
            $('.movebody[style_name="'+style+'"]').each(function(){
                if(type==1){
                    $(this).hide();
                }else{
                    $(this).show();
                }
                var this_id = $(this).attr('id');
                $('path[link1="'+this_id+'"]').each(function(){
                    if(type==1){
                        $(this).hide();
                    }else{
                        $(this).show();
                    }
                })
            })
        },
        // 筛选亲密度方法
        selectClose:function(min,max){
            $('.movebody').each(function(){
                var close = $(this).attr('close');
                if(close){
                    close = parseInt(close);
                    var this_id = $(this).attr('id');
                    if(close<=max && close>=min){
                        $(this).show();
                        $('path[link1="'+this_id+'"]').each(function(){
                            $(this).show();
                        })
                    }else{
                        $(this).hide();
                        $('path[link1="'+this_id+'"]').each(function(){
                            $(this).hide();
                        })
                    }
                }
            })
        }
    }
    return info;
}