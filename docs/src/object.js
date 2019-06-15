"use strict";
/// <reference path="../node_modules/phina.js.d.ts/globalized/index.d.ts" />
/// <reference path="./math.ts" />
/// <reference path="./wave_data.ts" />
class GameObjectType {
}
GameObjectType.UNDEF = 0;
GameObjectType.PLAYER = 1;
GameObjectType.PLAYER_BULLET = 2;
GameObjectType.ENEMY = 3;
GameObjectType.EFFECT = 4;
GameObjectType.STONE = 5;
class Player {
    constructor() {
        this.freezeTime = 0;
        this.freezeDuration = 300;
        this.selectedBankId = 0;
        this.selectedPotId = 0;
        this.selectedCustomerId = 0;
        this.selectedChairId = 0;
        this.selectedTrayId = 0;
        this.selectedNoodleId = 0;
    }
}
class GameObject {
    constructor() {
        this.name = '';
        this.type = GameObjectType.UNDEF;
        this.hasDelete = false;
        this.instanceId = 0;
        this.tr = new Transform();
        this.sprite = null;
        this.life = new Life();
        this.customer = null;
        this.bank = null;
        this.noodle = null;
        this.pot = null;
        this.chair = null;
        this.tray = null;
        this.effect = null;
        this.player = null;
        this.collider = null;
        this.anim = null;
        this.shaker = null;
        GameObject.autoIncrement++;
        this.instanceId = GameObject.autoIncrement;
    }
}
GameObject.autoIncrement = 0;
class Noodle {
    constructor() {
        /** テーブル番号 or 鍋番号 */
        this.ownerId = 0;
        /** 茹でた時間 */
        this.boiledTime = 0;
    }
}
class CustomerState {
}
/** 入店 */
CustomerState.ENTER_SHOP = 1;
/** 待機 */
CustomerState.STAND_WAIT = 2;
/** 席へ移動 */
CustomerState.MOVE = 3;
/** 注文を考える */
CustomerState.THINK = 4;
/** 注文待機 */
CustomerState.CHAIR_WAIT = 5;
/** 食べる */
CustomerState.EAT = 6;
/** 退店 */
CustomerState.EXIT_SHOP = 7;
/** 客 */
class Customer {
    constructor() {
        this.chairId = 0;
        this.trayId = 0;
        /** 注文した茹でLv */
        this.orderedBoilLv = 0;
        this.state = CustomerState.ENTER_SHOP;
        this.stateTime = 0;
    }
}
/** ラーメントレー(客の前のテーブル) */
class Tray {
    constructor() {
        this.chairId = 0;
    }
}
/** 椅子 */
class Chair {
    constructor() {
        this.chairIndex = 0;
    }
}
/** 鍋 */
class Pot {
}
/** 麺のストック */
class Bank {
}
class Life {
    constructor() {
        this.hpMax = 1;
        this.hp = 1;
    }
}
class Effect {
    constructor() {
        this.duration = 1000;
        this.time = 0;
    }
}
class Collider {
    constructor() {
        var rect = new RectangleShape();
        rect.width = 32;
        rect.height = 64;
        rect.alpha = 0.0;
        rect.fill = '#ff0000';
        rect.stroke = '#000000';
        this.sprite = rect;
    }
}
class Bullet {
    constructor() {
        this.hitIdArr = [];
    }
}
class Enemy {
    constructor() {
        this.stoneId = 0;
        this.firstSpeed = 25;
        this.speed = 25;
        this.loopCount = 0;
        this.scoreScale = 1;
    }
}
class Shaker {
    constructor() {
        this.duration = 200;
        this.time = 0;
        this.power = 8;
        this.offset = Vector2(0, 0);
        this.time = this.duration;
    }
}
class ShakerHelper {
    static shake(shaker) {
        shaker.time = 0;
    }
    static update(shaker, app) {
        shaker.time = Math.min(shaker.time + app.deltaTime, shaker.duration);
        const progress = MathHelper.progress01(shaker.time, shaker.duration);
        const rotation = Math.random() * 360;
        shaker.offset.fromDegree(rotation);
        const power = LerpHelper.linear(shaker.power, 0, progress);
        shaker.offset.x *= power;
        shaker.offset.y *= power;
    }
}
class Transform {
    constructor() {
        this.rotation = 0;
        this.position = Vector2(0, 0);
    }
    getSpriteScale() {
        var v = Vector2(0, 0);
        v.fromDegree(this.rotation);
        var sx = 1;
        var sy = 1;
        if (v.x < 0) {
            sx = -1;
        }
        v.x = sx;
        v.y = sy;
        return v;
    }
}
class AsciiSprite {
    constructor() {
        this.character = ' ';
        this.position = 0;
        this.priority = 0;
    }
}
