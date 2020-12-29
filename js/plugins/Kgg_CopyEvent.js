//=============================================================================
// Kgg_CopyEvent.js
//=============================================================================
/*:
 * @target MZ
 * @plugindesc 复制事件 v1.0.0
 * @author Y开关关
 *
 * @help Kgg_CopyEvent.js
 *
 * 功能：以某地图的事件为模板，在当前地图创建相同的事件。
 *       复制出的事件只是临时在地图中，场景移动到其他地图再回来，复制出的事件就会消失。
 *
 * 用法：
 *
 * 首先在下面的设置中，将一张地图设为模板地图，并在该地图中创建模板事件。
 *
 * 使用脚本在当前地图复制事件：
 * Kgg_CopyEvent.copyEvent(templateEventId, x, y, mode = '共享')
 * 
 * 参数mode有三种，分别是‘独立’、‘共享’和‘备份’。
 * ‘独立’模式复制出的事件，仅复制原本的模板事件，其独立开关全部是初始状态，且与模板事件无关。
 * ‘共享’模式复制出的事件，生成时继承模板事件的独立开关，若独立开关有所改变，则会共享到模板事件。
 * ‘备份’模式复制出的事件，生成时继承模板事件的独立开关，但生成后与模板事件再无半点关系。
 *
 * 参数templateEventId应填入模板事件的id。
 *
 * x和y应填入于当前地图生成的坐标。
 *
 * 
 * 2020.12.29
 * WorldEffect用得到复制事件功能，上传供讨论使用。我个人很愿意把它整合到WorldEffect中，或者只是当作这个功能的参考也很棒。
 * 本插件有很大缺陷，比如“共享”仅支持RMMZ自带的独立开关。并且这个插件并没有使用EventWanderer.js的接口。
 * 
 */
var Kgg_CopyEvent = Kgg_CopyEvent || {};

//-----------------------------------------------------------------------------
// 设置
//-----------------------------------------------------------------------------
Kgg_CopyEvent._mapId = 2; // 模板地图编号

// 读取模板地图
Kgg_CopyEvent.loadEvents = function() {
    var mapId = Kgg_CopyEvent._mapId;
    if (!mapId) {
        console.warn('未设置模板地图编号。');
        return;
    }
    if(String(mapId).length < 3 && mapId >= 0) {
        mapId = (Array(3).join(0) + mapId).slice(-3);
    }
    this._eventData = null;
    var xhr = new XMLHttpRequest();
    var url = 'data/Map' + mapId + '.json';
    xhr.open('GET', url);
    xhr.overrideMimeType('application/json');
    xhr.onload = function() {
        if (xhr.status < 400) {
            var mapData = JSON.parse(xhr.responseText);
            this._eventData = mapData.events;
            console.log('读取模板地图事件成功。');
        }
    }.bind(this);
    xhr.send();
};

// 复制事件
Kgg_CopyEvent.copyEvent = function(templateEventId, x, y, mode = '共享') {
    $dataMap._oringinalEventAmount = $dataMap._oringinalEventAmount || $dataMap.events.length - 1; // 记录原有事件数量
    // 依据模板事件创建一个新事件
    var dataEvent = Kgg_CopyEvent._eventData[templateEventId];
    var eventId = $dataMap.events.length;
    dataEvent.id = eventId;
    $dataMap.events.push(dataEvent); // 添加到$dataMap
    var newEvent = new Game_Event($gameMap._mapId, eventId);
    newEvent._templateEventId = templateEventId;
    newEvent._copyMode = mode; // 在复制出的事件中记录它的模式
    newEvent.locate(x, y);
    newEvent.refresh();
    $gameMap._events.push(newEvent);
    // $gameMap.refreshTileEvents();
    // 对‘共享’模式的复制出的事件套用模板事件的独立开关
    if (mode == '共享' || mode == '备份') {
        for (var key in $gameSelfSwitches._data) {
            console.log(key);
            var pattern = RegExp(',' + templateEventId + ',');
            if (pattern.test(key)) {
                var key2 = key.split(',1,');
                key2.splice(1, 0, eventId);
                key2[0] = $gameMap.mapId();
                $gameSelfSwitches.setValue(key2, true);
            }
        }
    }
    // 刷新Scene_Map的Spriteset
    var children = SceneManager._scene.children;
    var index = children.find(scene => scene == SceneManager._scene._spriteset);
    SceneManager._scene.createSpriteset();
    children.splice(children.length - 1, 1);
    children.splice(index, 1, SceneManager._scene._spriteset);
    // 返回eventId
    return eventId;
};

//-----------------------------------------------------------------------------
// Game_Map
// 计划修改Game_Map以实现在加载地图时依据条件复制出事件的功能。
//-----------------------------------------------------------------------------
// Kgg_CopyEvent.Game_Map_setupEvents = Game_Map.prototype.setupEvents;
// Game_Map.prototype.setupEvents = function() {
    // Kgg_CopyEvent.Game_Map_setupEvents.call(this);
    
// };

//-----------------------------------------------------------------------------
// Game_Event
//-----------------------------------------------------------------------------
Kgg_CopyEvent.Game_Event_event = Game_Event.prototype.event;
Game_Event.prototype.event = function() {
    if (!!this._templateEventId){
        return Kgg_CopyEvent._eventData[this._templateEventId];
    } else {
        return Kgg_CopyEvent.Game_Event_event.call(this);
    }
};

//-----------------------------------------------------------------------------
// SceneManager
//-----------------------------------------------------------------------------
Kgg_CopyEvent.SceneManager_initialize = SceneManager.initialize;
SceneManager.initialize = function() {
    Kgg_CopyEvent.SceneManager_initialize.call(this);
    Kgg_CopyEvent.loadEvents();
};

//-----------------------------------------------------------------------------
// Scene_Map
//-----------------------------------------------------------------------------
Kgg_CopyEvent.Scene_Map_stop = Scene_Map.prototype.stop;
Scene_Map.prototype.stop = function() {
    for (var i = 0; i < $gameSystem._kgg_CopyEvent_selfSwitchesWhichNeedDelete.length; i++) {
        console.log(i);
        $gameSelfSwitches.setValue($gameSystem._kgg_CopyEvent_selfSwitchesWhichNeedDelete[i], false);
    }
    $gameSystem._kgg_CopyEvent_selfSwitchesWhichNeedDelete = [];
    Kgg_CopyEvent.Scene_Map_stop.call(this);
};

//-----------------------------------------------------------------------------
// Game_SelfSwitches
//-----------------------------------------------------------------------------
Kgg_CopyEvent.Game_SelfSwitches_setValue = Game_SelfSwitches.prototype.setValue;
Game_SelfSwitches.prototype.setValue = function(key, value) {
    Kgg_CopyEvent.Game_SelfSwitches_setValue.apply(this, arguments);
    if (key[0] == $gameMap.mapId() && $gameMap.event(key[1])._copyMode == '共享' ) {
        var key2 = [Kgg_CopyEvent._mapId, $gameMap.event(key[1])._templateEventId, key[2]];
        if (value) {
            this._data[key2] = true;
        } else {
            delete this._data[key2];
        }
        this.onChange();
    }
    if (key[0] == $gameMap.mapId() && $gameMap.event(key[1])._copyMode == '独立' && value) {
        $gameSystem._kgg_CopyEvent_selfSwitchesWhichNeedDelete.push(key); // 将独立开关的key加入删除名单
    }
};
//-----------------------------------------------------------------------------
// Game_System
//-----------------------------------------------------------------------------
Kgg_CopyEvent.Game_System_initialize = Game_System.prototype.initialize;
Game_System.prototype.initialize = function() {
    Kgg_CopyEvent.Game_System_initialize.apply(this, arguments);
    this._kgg_CopyEvent_selfSwitchesWhichNeedDelete = [];
};

