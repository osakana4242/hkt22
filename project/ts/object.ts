/// <reference path="../node_modules/phina.js.d.ts/globalized/index.d.ts" />
/// <reference path="./math.ts" />
/// <reference path="./wave_data.ts" />


class GameObjectType {
	static UNDEF = 0;
	static PLAYER = 1;
	static PLAYER_BULLET = 2;
	static ENEMY = 3;
	static EFFECT = 4;
	static STONE = 5;
}

class Player {
	freezeTime = 0;
	freezeDuration = 300;
	selectedBankId = 0;
	selectedPotId = 0;
	selectedCustomerId = 0;
	selectedChairId = 0;
	selectedTrayId = 0;
	selectedNoodleId = 0;
}

class GameObject {
	name = '';
	type = GameObjectType.UNDEF;
	hasDelete = false;
	instanceId = 0;
	tr: Transform = new Transform();
	sprite: DisplayElement | null = null;
	life: Life = new Life();

	customer: Customer | null = null;
	bank: Bank | null = null;
	noodle: Noodle | null = null;
	pot: Pot | null = null;
	chair: Chair | null = null;
	tray: Tray | null = null;

	effect: Effect | null = null;

	player: Player | null = null;

	collider: Collider | null = null;
	anim: FrameAnimation | null = null;
	shaker: Shaker | null = null;
	static autoIncrement = 0;

	constructor() {
		GameObject.autoIncrement++;
		this.instanceId = GameObject.autoIncrement;
	}
}

class Noodle {
	/** テーブル番号 or 鍋番号 */
	ownerId = 0;
	/** 茹でた時間 */
	boiledTime = 0;
}

class CustomerState {
	/** 入店 */
	static ENTER_SHOP = 1;
	/** 待機 */
	static STAND_WAIT = 2;
	/** 席へ移動 */
	static MOVE = 3;
	/** 注文を考える */
	static THINK = 4;
	/** 注文待機 */
	static CHAIR_WAIT = 5;
	/** 食べる */
	static EAT = 6;
	/** 退店 */
	static EXIT_SHOP = 7;
}

/** 客 */
class Customer {
	chairId: number = 0;
	trayId: number = 0;
	/** 注文した茹でLv */
	orderedBoilLv: number = 0;
	state: number = CustomerState.ENTER_SHOP;
	stateTime: number = 0;
}

/** ラーメントレー(客の前のテーブル) */
class Tray {
	chairId = 0;
}

/** 椅子 */
class Chair {
	chairIndex = 0;
}

/** 鍋 */
class Pot {

}

/** 麺のストック */
class Bank {
}

class Life {
	hpMax = 1;
	hp = 1;
}

class Effect {
	duration = 1000;
	time = 0;
}

class Collider {
	sprite: Shape;
	constructor() {
		var rect = new RectangleShape();
		rect.width = 32;
		rect.height = 64;
		rect.alpha = 0.0;
		rect.fill = '#ff0000';
		rect.stroke = '#000000'
		this.sprite = rect;
	}
}

class Bullet {
	hitIdArr: number[] = [];
}

class Enemy {
	stoneId = 0;
	firstSpeed = 25;
	speed = 25;
	loopCount = 0;
	scoreScale = 1;
}

class Shaker {
	duration = 200;
	time = 0;
	power = 8;
	offset = Vector2(0, 0);

	constructor() {
		this.time = this.duration;
	}
}

class ShakerHelper {
	static shake(shaker: Shaker) {
		shaker.time = 0;
	}

	static update(shaker: Shaker, app: GameApp) {
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
	rotation = 0;
	position = Vector2(0, 0);

	getSpriteScale(): Vector2 {
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
	character = ' ';
	position = 0;
	priority = 0;
}
