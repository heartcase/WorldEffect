//=============================================================================
// Kgg_NPCLife.js
//=============================================================================

/*:
 * @plugindesc v0.1.1 NPC的生活
 * @author 开关关
 *
 * @help 为部分NPC增加每日行动轨迹。
 *
 * 此插件是开关关自用插件，用起来并不方便。
 * 
 * 此插件的前置插件：
 * Drill_EventKeepMoving.js
 * KJ_Extend_Chatacter.js
 *
 * 推荐同时使用插件：
 * Mog_TimeSystem.js
 * 
 * 本来此插件的命名是 NPC路线条件拓展，但是作者野心很大，就直接命名为NPCLife。
 * 
 * 2020.12.28
 * 希望通过我写的插件分享自己关于让NPC根据条件移动的思路。
 * 这是一个MV版的插件，而且严格来说算不上插件，毕竟需要其他的插件才能运行，应该算是个连接不同功能的桥梁。我认为我的插件当中最重要的创意是“检查点”，我想分享这个创意。其余部分比较老套和冗杂，没必要看。
 * 抱歉把这个插件混进了WorldEffect的仓库里。这个插件是我用非常不成熟的方式写的MV版插件，其中包含我关于实现NPC每日行动轨迹的一点想法。如果能为WorldEffect提供一点思路上的帮助，我非常开心。如果它对于WorldEffect没有任何帮助，那么请忽略它，删除了也没问题。
 * 本插件已经实现的功能是让某地图上的NPC根据一定条件作出一定行动。配合时间系统和各种开关变量，理论上可以做出很多有趣的交互。比如白天出门，晚上回家，下雨避雨等等。因为条件和行为可以是任何东西，所以NPC之间的互动也成为可能。比如NPC跟随NPC，两个NPC每天碰面然后一起去某地，一个NPC看见另一个NPC就躲起来等等。
 * 计划中而尚未实现的功能有很多，比如部分NPC可以与一个Actor绑定，这个NPC就是某个角色。NPC有自己的生活，NPC会按照设定好的条件主动在不同地图之间移动。不过，可以预见，WorldEffect会实现这些功能。
 * 
 */

/*
 * 定义：
 * LNPC / lnpc / livingNPC : 即有生活的NPC。代码中通常表现为一个对象。
 * Checkpoint / checkpoint / 检查点 / 检查点区域 : 地图上的一片范围，用于检查LNPC是否到位。代码中通常表现为一个对象。
 *
 * 2020.6.30
 * 今天写了些没啥用的东西——判断点是否在检查点区域内方法。这些不是主要功能。
 * 主要功能的思路是，在数据中设定好各种行为方式，然后在事件的移动路线中调用Kgg_NPCLife的方法，由这个方法控制Game_Character移动。
 * 行为方式：每一条行为方式都有一个进入条件、一个执行内容和一个退出条件。行为方式列表将会按顺序执行，对于每一条行为方式，会先执行其进入条件，如果符合则执行执行内容，执行完执行内容就执行退出条件。如果不符合退出条件，则如果开始时就不符合进入条件，则会执行下一条。
 * （未实现）如果设定了一个LNPC对象，那么进入地图时则会判断是否该出现这个NPC。如果该出现，则调用事件复制器（另一个插件），将NPC生成到指定位置。
 * 一个LNPC执行到了第几条，是在执行执行内容或是没有符合条件的行为方式，这些状态都存储在依据DATA_LNPC生成的LNPC对象中。
 * 
 * 2020.12.10 v0.1.0
 * 今天准备直接实现基本功能，即使把数据写得很复杂，也要用这个框架实现最基本的功能。只有实现一次，才能证明这个框架可行。
 *
 * 2020.12.27 v0.1.1
 * 今天简化了行为方式1，并写了比较浓缩的行为方式2。我觉得需要为只会来回走动的NPC写一个模板，每次有这种NPC，调用模板即可。
 */

var Kgg_NPCLife = {};

//=============================================================================
// 数据
//=============================================================================

//-----------------------------------------------------------------------------
// CheckPoint数据
//
// 在此处设定所有预设检查点的范围。
// 预设检查点不是必须的，你可以在行为方式中编写匿名检查点。
//-----------------------------------------------------------------------------
Kgg_NPCLife.DATA_CHECKPOINT = [null,
    {
        "id":1,
        "name":"纽克城>治安骑士营",
        "note":"治安骑士营门前",
        "type":"points",
        "mapID":0, // mapID是让LNPC主动移动时用到的，现在暂时只追求简单功能，不规定mapID。
        "target":{"x":90,"y":24},
        "points":[{"x":90,"y":24}],
        "distance":0
    },
    {
        "id":2,
        "name":"纽克城>市政厅右门",
        "note":"市政厅右门",
        "type":"points",
        "mapID":0,
        "target":{"x":85,"y":15},
        "points":[{"x":85,"y":15}],
        "distance":0
    }
];

//-----------------------------------------------------------------------------
// Life数据
//
// 在此处设定所有行为方式。
//-----------------------------------------------------------------------------
// 行为方式总数 一个NPC有一种行为方式。
Kgg_NPCLife.DATA_LIFE = new Array(10); 

// 行为方式1：只会来回走动的NPC
Kgg_NPCLife.DATA_LIFE[1] = [ // 这一层数组的元素，越靠前代表优先级越高。每一次行动之后判断下一次行动，优先级越高的越先执行。
    {"conditions":"!ch.hasOwnProperty('_lnpc')", "route":
        [
            {"model":"eval", "eval":"ch['lnpc'] = '临时'; ch['wayIndex'] = 0"} // 这一步是初始化，为事件event赋予一个_lnpc以表明它已经有行为方式。
        ]
    },
    
    {"conditions":"ch['wayIndex'] == 0", "route": // 这一层对象，每一个对象是一种行为。每种行为有自己的执行条件（一般是时间），若达不到条件则执行优先度第一级的行为。
        [ // 这一层数组，规定连续的行动。达到条件后进行的连续行动写在这里。
            {"model":"walk_toward", "target":1}, // walk_toward 就是“移动向”，仅移动一步就结束行为。
            {"model":"eval", "eval":"if(ch.isInCheckpointIndex(1) && (ch['wayIndex'] == 0)){ch['wayIndex'] = 1}"},
            {"model":"eval", "eval":"console.log('前往1号')"}
        ]
    },
    {"conditions":"ch['wayIndex'] == 1", "route":
        [
            {"model":"walk_toward", "target":2},
            {"model":"eval", "eval":"if(ch.isInCheckpointIndex(2) && (ch['wayIndex'] == 1)){ch['wayIndex'] = 0}"},
            {"model":"eval", "eval":"console.log('前往2号')"}
        ]
    }
];

/*
 * 行为方式2：
 * 尝试换种思路。对一般的来回走动的NPC，可以用时间作为conditions，然后再根据不同情况（如下雨、天黑）写不同的判断。这样貌似简洁一些。
 */

Kgg_NPCLife.DATA_LIFE[2] = [
    {"conditions":"!ch.hasOwnProperty('_lnpc')", "route": // 初始化
        [
            {"model":"eval", "eval":"ch['_lnpc'] = '临时'; ch['wayIndex'] = 0"}
        ]
    },
    {"conditions":"ch.isInCheckpointIndex(1) && (ch['wayIndex'] == 0)", "route":
        [
            {"model":"eval", "eval":"if(ch.waypoint == 0){ch.moveTowardDestination(70, 18);if(ch.isInCheckpointIndex(1)){ch.waypoint = 1;}}else if(ch.waypoint == 1){ch.moveTowardDestination(94, 12);if(ch.isInCheckpointIndex(2)){ch.waypoint = 0;}}"}
        ]
    }
    
];


//-----------------------------------------------------------------------------
// LivingNPC数据
//
// 在此处设定所有LNPC的名字和行为方式。
// 这个是用来存储LNPC数据的，如NPC背包。对于地上乱跑的NPC用不到这个。
//-----------------------------------------------------------------------------
Kgg_NPCLife.DATA_LNPC = [null,
    {
        "id":1,
        "name":"LNPC：纽克城路人2",
        "note":"继纽克城路人1之后，出现了这位纽克城路人2。他将为测试有生活的NPC插件作出贡献！",
        "live":Kgg_NPCLife.DATA_LIFE[1]
    }
];

//-----------------------------------------------------------------------------
// 创建空检查点 Checkpoint
// 
// 此方法用于提醒作者 checkpoint 的格式。
//-----------------------------------------------------------------------------
Kgg_NPCLife.createEmptyCheckpoint = function(id, type = "points"){
    let checkpoint = {"id":id,"name":"新检查点","mapID":0};
    if(type == "polygon"){// 多边形 端点定义
        checkpoint.type = "polygon";
        checkpoint.target = {"x":0,"y":0}; // 如果要求LNPC以checkpoint为目标行走，则LNPC的寻路目标就是这个target。
        checkpoint.points = [ // 当LNPC的
        {"x":0,"y":0},
        {"x":0,"y":0},
        {"x":0,"y":0}
        ];
    }else if(type == "rectangle"){// 矩形 两点定义
        checkpoint.type = "rectangle";
        checkpoint.target = {"x":0,"y":0};
        checkpoint.startpoint = {"x":0,"y":0};
        checkpoint.endpoint = {"x":0,"y":0};
    }else if(type == "circle"){// 圆形 中点+半径定义
        checkpoint.type = "circle";
        checkpoint.target = {"x":0,"y":0};
        checkpoint.centre = {"x":0,"y":0};
        checkpoint.radius = 0;
    }else if(type == "distance"){// 正菱形 中点+距离定义
        checkpoint.type = "distance";
        checkpoint.target = {"x":0,"y":0};
        checkpoint.centre = {"x":0,"y":0};
        checkpoint.distance = 0;
    }else{// 多点
        checkpoint.type = "points";
        checkpoint.target = {"x":0,"y":0};
        checkpoint.points = [{"x":0,"y":0}];
        checkpoint.distance = 0;
    }
    return checkpoint;
};

//-----------------------------------------------------------------------------
// 判断点是否在检查点区域内方法
//-----------------------------------------------------------------------------
Kgg_NPCLife.isInCheckpointIndex = function(position, checkpointIndex){
    return this.isInCheckpoint(position, Kgg_NPCLife.DATA_CHECKPOINT[checkpointIndex]);
};
Kgg_NPCLife.isInCheckpoint = function(position, checkpoint){
    let x = position.x;
    let y = position.y;
    let x1, x2, times, points, theY, r;
    if(checkpoint.type == "polygon"){// 多边形
        // 判断点在多边形内算法
        // 算法参考：https://blog.csdn.net/zhouzi2018/article/details/81737178
        // 两点式直线方程为 y - y1 = ( y2 - y1 ) / ( x2 - x1 ) * ( x - x1 )
        points = checkpoint.points;
        times = 0;// 射线穿过次数
        for (var i = 0; i < points.length; i++){
            x1 = points[i].x;
            y1 = points[i].y;
            if(i < points.length - 1){
                x2 = points[i+1].x;
                y2 = points[i+1].y;
            }else{
                x2 = point[0].x;
                y2 = point[0].y;
            }
            if(y=y1&&y==y2){
                return x <= Math.max(x1,x2) && x >= Math.min(x1,x2);
            }else if(x=x1&&x==x2){
                return y <= Math.max(y1,y2) && y >= Math.min(y1,y2);
            }else{
                theY = (y2-y1)/(x2-x1)*(x-x1);// 临时变量Y
                if(theY < Math.max(y1,y2) && theY > Math.min(y1,y2)){
                    times += 1;
                }
            }
        }
        return !(times % 2 == 0);
    }else if(checkpoint.type == "rectangle"){// 矩形
        x1 = checkpoint.startpoint.x;
        y1 = checkpoint.startpoint.y;
        x1 = checkpoint.endpoint.x;
        x1 = checkpoint.endpoint.x;
        return x <= Math.max(x1,x2) && x >= Math.min(x1,x2) && y <= Math.max(x1,x2) && y >= Math.min(x1,x2);
    }else if(checkpoint.type == "circle"){// 圆形
        x1 = checkpoint.centre.x;
        y1 = checkpoint.centre.y;
        r = checkpoint.centre.radius;
        return Math.pow(x - x1, 2) + Math.pow(y - y1, 2) <= Math.pow(r, 2);
    }else if(checkpoint.type == "distance"){// 正菱形
        x1 = checkpoint.centre.x;
        y1 = checkpoint.centre.y;
        r = checkpoint.distance;
        return Math.abs(y - y1) + Math.abs(x - x1) <= r;
    }else if(checkpoint.type == "points"){// 多点
        points = checkpoint.points;
        for(var i = 0; i < points.length; i++){
            if(x == points[i].x && y == points[i].y){
                return true;
            }
        }
        return false;
    }else{// 未定义
        console.warn("判断点是否在检查点区域内出错：未定义的检查点区域。理论上不可能出现这个错误提示，如果出现，一定是作者写错了，请联系作者开关关。");
        return false;
    }
};

//=============================================================================
// LNPC
//=============================================================================
/* 
 *LNPC 是为每个NPC单独设置的对象。每个对象都是一个NPC，它们不局限与某张地图，不局限于某个事件。一个LNPC对象相当于一个Actor，有自己的hp、mp，而且会有各自的背包。不过这一切都暂时没有实现。 
 */
//=============================================================================
// 初始化
//=============================================================================
function Kgg_LNPC() {
    this.initialize.apply(this, arguments);
}

Kgg_LNPC.prototype.initialize = function(){
    this.checkpoints = [null];
    let lnpc = new Kgg_LNPC();
    this._vehicleType = 'walk';
    this._vehicleGettingOn = false;
    this._vehicleGettingOff = false;
    this._dashing = false;
    this._needsMapReload = false;
    this._transferring = false;
    this._nowMapId = 0;
    this._nowX = 0;
    this._nowY = 0;
    this._nowDirection = 0;
    this._newMapId = 0;
    this._newX = 0;
    this._newY = 0;
    this._newDirection = 0;
    this._fadeType = 0;
    this._followers = new Game_Followers();
    this._encounterCount = 0;
    this._actor = null; // 对应的Actor
};
//=============================================================================
// 创建对象方法
//=============================================================================

//-----------------------------------------------------------------------------
// 是否正在跑步
//-----------------------------------------------------------------------------
Kgg_LNPC.prototype.isDashing = function() {
    return this._dashing;
};

//=============================================================================
// 重定义Game_Character的部分函数
//=============================================================================
//-----------------------------------------------------------------------------
// 是否在检查点区域内
//-----------------------------------------------------------------------------
Game_Character.prototype.isInCheckpointIndex = function(checkpointIndex){
    return this.isInCheckpoint(Kgg_NPCLife.DATA_CHECKPOINT[checkpointIndex]);
};
Game_Character.prototype.isInCheckpoint = function(checkpoint){
    var position = {"x":this.x,"y":this.y};
    return Kgg_NPCLife.isInCheckpoint(position, checkpoint);
    // switch (checkpoint.type) {
        // case "points" :
            // for (var i = 0; i < checkpoint["points"].length; i++){
                // if (checkpoint["points"][i]["x"] == this.x && checkpoint["points"][i]["y"] == this.y ) return true;
            // }
        // default :
            // return false;
    // }
};
//-----------------------------------------------------------------------------
// 进行LNPC行动
// 如果是一般的事件NPC，在移动路线中调用“this.live(live)”即可应用某种行为方式。
//-----------------------------------------------------------------------------
Game_Character.prototype.live = function(life){ // 参数 life 请输入 Kgg_NPCLife.DATA_LIFE 的元素
    var route = {};
    var ch = this;
    for (var i = 0; i < life.length; i++) {
        if( eval(life[i]["conditions"]) ) { 
            route = life[i]["route"];
            // console.log("开始行为"+i);
            break;
        }else{
            console.log(i);
        }
    }
    console.log(route);
    for (var j = 0; j < route.length; j++) {
        switch (route[j]["model"]) {
            case "eval":
            case "e":
                eval( route[j]["eval"] );
                break;
            case "walk_toward":
            case "w":
                var target = Kgg_NPCLife.DATA_CHECKPOINT[route[j]["target"]];
                var x = target["target"]["x"];
                var y = target["target"]["y"];
                this.moveTowardDestination(x, y);
                // console.log("移动");
                break;
            case "move_command":
            case "c":
                this.processMoveCommand(route[j]["command"]);
                break;
            default:
        }
    }
};



