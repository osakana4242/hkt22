/// <reference path="../node_modules/phina.js.d.ts/globalized/index.d.ts" />
/// <reference path="./math.ts" />
/// <reference path="./object.ts" />
/// <reference path="./wave_data.ts" />

phina.globalize();

var ASSETS = {
	image: {
		"obj": "./img/obj.png",
		"obj_chair": "./img/obj_chair.png",
		"obj_tray": "./img/obj_tray.png",
		"obj_bank": "./img/obj_bank.png",
		"obj_customer": "./img/obj_customer.png",
		"obj_noodle_01": "./img/obj_noodle_01.png",
		"obj_noodle_02": "./img/obj_noodle_02.png",
		"obj_clock_body": "./img/obj_clock_body.png",
		"obj_clock_needle": "./img/obj_clock_needle.png",
		"obj_pot": "./img/obj_pot.png",
		"order_01": "./img/order_01.png",
		"order_02": "./img/order_02.png",
		"order_03": "./img/order_03.png",
		"reaction_01": "./img/reaction_01.png",
		"reaction_02": "./img/reaction_02.png",
		"reaction_03": "./img/reaction_03.png",
		"bg_01": "./img/bg_01.png",
	},
	spritesheet: {
		"obj": "./img/obj.ss.json",
		"obj_customer": "./img/obj_customer.ss.json",
	},
};


class DF {
	static SC_W = 240;
	static SC_H = 320;
}

class Rotation {
	static RIGHT = 0;
	static DOWN = 90;
	static LEFT = 180;
	static UP = 270;
}

const StateId = {
	S1I: 10,
	S1: 11,
	S2: 20,
	S3I: 30,
	S3: 40,
	EXIT: 100,
}

interface EnterFrameEvent {
	app: phina.game.GameApp;
	target: DisplayScene;
}

type StateEvent = {
	app: GameApp,
	sm: StateMachine,
};
type StateFunc = (target: any, evt: StateEvent) => ((target: any, evt: StateEvent) => any) | null;

class StateMachine {
	time = 0;
	state: StateFunc = (_1, _2) => null;

	update(target: any, app: GameApp) {
		var nextState = this.state(target, { app: app, sm: this });
		if (nextState && this.state !== nextState) {
			this.state = nextState;
			this.time = 0;
		} else {
			this.time += app.deltaTime;
		}
	}
}

interface EnemyData {
	speed: number;
	scoreScale: number;
	hp: number;
}

class QuestWork {
	isPlyaing = false;
	waveTime = 0;
	time = 0;
	duration = 1000 * 180;
	waveIndex = 0;

	getRestTime() {
		return Math.max(0, this.duration - this.time);
	}
}

interface IScore {
	score: number;
	text: string;
}

class HogeScene {
	scene: phina.display.DisplayScene;
	lines: string[][] = [[], [], []];
	mainLabel: Label;
	centerTelop: Label;
	goArr: GameObject[] = [];
	goDict: { [index: number]: GameObject } = {};
	stageLeft = 0;
	enemyRect = new Rect(-64, -64, DF.SC_W + 160, DF.SC_H + 128);
	screenRect = new Rect(0, 0, DF.SC_W, DF.SC_H);
	centerRect: Rect;
	isStarted = false;
	isEnd = false;
	sm = new StateMachine();
	/** 立って待つ客の位置 */
	standWaitPosArr = [
		Vector2(220, 48),
		Vector2(180, 48),
		Vector2(140, 48),
		Vector2(100, 48),
		Vector2(60, 48),
		Vector2(20, 48),
	];
	customerEnterPos = Vector2(-40, 48);

	enemyDataDict: { [index: string]: EnemyData } = {
		'enm_1': {
			speed: 25,
			scoreScale: 1,
			hp: 4
		},
		'enm_2': {
			speed: 15,
			scoreScale: 5,
			hp: 2
		},
	};

	playerBulletSpeed = 8;

	questWork = new QuestWork();
	hasPause = false;
	cursor: RectangleShape;
	btnPotArr: GameObject[];
	lastPointBtn: GameObject | null = null;
	player: Player;
	bank: Bank;


	constructor(pScene: phina.display.DisplayScene) {
		this.scene = pScene;
		pScene.backgroundColor = '#ccccc0';

		{
			const minSize = Math.min(this.screenRect.width, this.screenRect.height);
			const maxSize = Math.max(this.screenRect.width, this.screenRect.height);
			this.centerRect = Rect(
				(this.screenRect.width - minSize) * 0.5,
				(this.screenRect.height - minSize) * 0.5,
				minSize,
				minSize
			);
		}

		{
			const go = new GameObject();
			go.player = new Player(go);
			this.goArr.push(go);
			this.player = go.player;
		}

		{
			const bg = Sprite("bg_01");
			bg.addChildTo(pScene);
			bg.x = this.screenRect.centerX;
			bg.y = this.screenRect.centerY;
			SpriteHelper.setPriority(bg, 0);
		}

		{
			var func = (_i: number) => {
				const layer = DisplayElement();
				layer.width = 16;
				layer.height = 16;
				const bg = Sprite("obj_clock_body");
				const needle = Sprite("obj_clock_needle");
				layer.addChild(bg);
				layer.addChild(needle);
				layer.addChildTo(pScene);
				SpriteHelper.setPriority(layer, 310);
				const go = new GameObject();
				go.noodleTimer = new NoodleTimer();
				go.noodleTimer.timerIndex = _i;
				go.sprite = layer;
				if (needle instanceof DisplayElement) {
					needle.rotation = 15;
				}

				go.tr.position.x = 32;
				go.tr.position.y = 32;
				this.pushGameObject(go);
			};
			for (let i = 0; i < 6; i++) {
				func(i);
			}
		}

		// {
		// 	var waitPosArr = this.waitPosArr;
		// 	this.btnPotArr = [];
		// 	waitPosArr.forEach((_item, _i) => {
		// 		this.createCustomer();
		// 	});
		// }

		{
			var waitPosArr = [
				[4, 96],
				[44, 96],
				[84, 96],
				[124, 96],
				[164, 96],
				[204, 96],
			];
			this.btnPotArr = [];
			waitPosArr.forEach((_item, _i) => {
				const sprite = Sprite("obj_chair");
				sprite.addChildTo(pScene);
				var go = new GameObject();
				go.sprite = sprite;
				SpriteHelper.setPriority(go.sprite, 10);
				go.chair = new Chair();
				go.chair.chairIndex = _i;
				go.tr.position.x = _item[0] + 16;
				go.tr.position.y = _item[1] + 16;
				this.goArr.push(go);
				this.btnPotArr.push(go);
				sprite.setInteractive(true, sprite.boundingType);
				sprite.addEventListener("pointstart", () => {
					//console.log("touch: " + go.instanceId);
					this.lastPointBtn = go;
				});
			});
		}

		{
			var waitPosArr = [
				[4, 136],
				[44, 136],
				[84, 136],
				[124, 136],
				[164, 136],
				[204, 136],
			];
			this.btnPotArr = [];
			waitPosArr.forEach((_item, _i) => {
				const sprite = Sprite("obj_tray");
				sprite.addChildTo(pScene);
				var go = new GameObject();
				go.sprite = sprite;
				SpriteHelper.setPriority(go.sprite, 10);
				go.tray = new Tray();
				const chairGO = this.goArr.find(_elem => {
					if (!_elem.chair) return false;
					if (_elem.chair.chairIndex !== _i) return false;
					return true;
				});
				go.tray.chairId = chairGO.instanceId;
				go.tr.position.x = _item[0] + 16;
				go.tr.position.y = _item[1] + 16;
				this.goArr.push(go);
				this.btnPotArr.push(go);
				sprite.setInteractive(true, sprite.boundingType);
				sprite.addEventListener("pointstart", () => {
					//console.log("touch: " + go.instanceId);
					this.lastPointBtn = go;
				});
			});
		}

		{
			const btnBank = Sprite("obj_bank");
			btnBank.addChildTo(pScene);
			var go = new GameObject();
			go.bank = new Bank(go);
			go.tr.position.x = 8 + 16;
			go.tr.position.y = 256 + 16;
			go.sprite = btnBank;
			SpriteHelper.setPriority(go.sprite, 10);
			go.sprite.setInteractive(true, go.sprite.boundingType);
			go.sprite.addEventListener("pointstart", () => {
				this.lastPointBtn = go;
			});
			this.pushGameObject(go);
			this.bank = go.bank;
		}

		{
			var waitPosArr = [
				[120, 208],
				[160, 208],
				[200, 208],
				[120, 248],
				[160, 248],
				[200, 248],
			];
			this.btnPotArr = [];
			waitPosArr.forEach((_item, _i) => {
				const btnPot = Sprite("obj_pot");
				btnPot.addChildTo(pScene);
				var go = new GameObject();
				go.sprite = btnPot;
				SpriteHelper.setPriority(go.sprite, 10);
				go.pot = new Pot();
				go.tr.position.x = _item[0] + 16;
				go.tr.position.y = _item[1] + 16;
				this.goArr.push(go);
				this.btnPotArr.push(go);
				btnPot.setInteractive(true, btnPot.boundingType);
				btnPot.addEventListener("pointstart", () => {
					//console.log("touch: " + go.instanceId);
					this.lastPointBtn = go;
				});
			});
		}

		{
			const cursor = RectangleShape({
				"width": 34,
				"height": 34,
				"stroke": "#ffff00",
				"strokeWidth": 2,
				"fill": "rgba(0, 0, 0, 0)",
			});

			cursor.addChildTo(pScene);
			cursor.x = -256;
			cursor.y = 256 + 16;
			SpriteHelper.setPriority(cursor, 300);
			this.cursor = cursor;
		}

		{
			const label = Label({
				text: 'hoge',
				fill: '#ffffff',
				fontSize: 14,
				fontFamily: 'monospaced',
				align: 'left',
			});
			label.x = 8;
			label.y = 8;
			label.addChildTo(pScene);
			this.mainLabel = label;
		}
		{
			const label = new Label({
				text: '',
				fill: '#ffffff',
				fontSize: 24,
				fontFamily: 'monospaced',
				align: 'center',
			});
			label.x = this.screenRect.centerX;
			label.y = this.screenRect.centerY;
			label.addChildTo(pScene);
			this.centerTelop = label;
		}
		this.sm.state = HogeScene.state1;

		pScene.addEventListener('focus', (evt: EnterFrameEvent) => {
			this.hasPause = false;
		});

		pScene.addEventListener('blur', (evt: EnterFrameEvent) => {
			this.hasPause = true;
		});

		pScene.addEventListener('enterframe', (evt: EnterFrameEvent) => {
			if (this.hasPause) return;
			this.enterframe(evt);
		});
	}

	createNoodle() {
		var go = new GameObject();
		go.noodle = new Noodle(go);
		go.sprite = Sprite("obj_noodle_01");
		go.sprite.addChildTo(this.scene);
		SpriteHelper.setPriority(go.sprite, 30);
		this.pushGameObject(go);
		return go.noodle;
	}

	createCustomer() {
		const sprite = Sprite("obj_customer");
		sprite.addChildTo(this.scene);
		var go = new GameObject();
		go.sprite = sprite;
		go.anim = FrameAnimation("obj_customer").attachTo(go.sprite);
		go.anim.gotoAndPlay("idle");
		SpriteHelper.setPriority(go.sprite, 20);
		go.customer = new Customer(go);
		go.customer.waitIndex = this.standWaitPosArr.length;
		go.customer.orderedBoilLv = 1;
		go.customer.state = CustomerState.STAND_WAIT;
		go.tr.position.x = -32;
		go.tr.position.y = 32;
		this.goArr.push(go);
		this.btnPotArr.push(go);
		sprite.setInteractive(true, sprite.boundingType);
		sprite.addEventListener("pointstart", () => {
			this.lastPointBtn = go;
		});
		return go.customer;
	}

	pushGameObject(go: GameObject) {
		this.goArr.push(go);
		this.goDict[go.instanceId] = go;
	}

	findComponents<T>(func: (go: GameObject) => T | null, arr: T[] | null = null): T[] {
		arr = arr || [];
		for (let i = 0; i < this.goArr.length; i++) {
			const go = this.goArr[i];
			const component = func(go);
			if (component === null) continue;
			arr.push(component);
		}
		return arr;
	}

	findGameObjects(func: (go: GameObject) => boolean, arr: GameObject[] | null = null): GameObject[] {
		arr = arr || [];
		for (let i = 0; i < this.goArr.length; i++) {
			const go = this.goArr[i];
			if (!func(go)) continue;
			arr.push(go);
		}
		return arr;
	}

	getGameObject(goId: number): GameObject {
		var go = this.goArr.find((_elem) => {
			if (_elem.instanceId !== goId) return false;
			return true;
		});
		return go;
	}

	findGameObject(goId: number, func: Function | null = null) {
		var go = this.goArr.find((_elem) => {
			if (_elem.instanceId !== goId) return false;
			return true;
		});
		if (func && !func(go)) return null;
		return go;
	}

	static state1(self: HogeScene, evt: StateEvent) {
		if (evt.sm.time === 0) {
			self.centerTelop.text = 'ラーメン修行\n(クリックで開始)';
			self.centerTelop.fill = '#ffffff';
		}

		if (1000 <= evt.sm.time) {
			if (evt.app.pointer.getPointingStart()) {
				self.centerTelop.text = '';
				return HogeScene.state2;
			}
		}
		return null;
	}

	static state2(self: HogeScene, evt: StateEvent) {
		if (evt.sm.time === 0) {
			self.isStarted = true;
		}

		if (self.questWork.getRestTime() <= 0) {
			return HogeScene.stateGameOver;
		}
		if (evt.app.keyboard.getKeyDown('g')) {
			return HogeScene.stateGameOver;
		}
		if (evt.app.keyboard.getKeyDown('r')) {
			return HogeScene.stateExit;
		}

		const playerGO = self.getGameObject(self.player.entityId);
		const player = self.player;
		const bankGO = self.getGameObject(self.bank.entityId);

		if (self.lastPointBtn !== null) {
			const lastGO = self.lastPointBtn;
			if (lastGO.customer !== null) {
				const chairId = lastGO.customer.chairId;
				const chair = self.goArr.find((_elem) => {
					return _elem.instanceId === chairId;
				});

				if (lastGO.customer.state === CustomerState.STAND_WAIT || lastGO.customer.state === CustomerState.CHAIR_WAIT) {
					player.selectedCustomerId = 0;
					if (player.selectedBankId !== 0) {
						// 麺箱の麺を客に投げる.
						const noodle = self.createNoodle();
						const noodleGO = self.getGameObject(noodle.entityId);
						noodle.ownerId = lastGO.instanceId;
						Vector2Helper.copyFrom(noodleGO.tr.position, bankGO.tr.position);
					} else if (player.selectedNoodleId !== 0) {
						// 鍋の麺を客に投げる.
						const noodleGO = self.getGameObject(player.selectedNoodleId);
						if (noodleGO.noodle !== null) {
							noodleGO.noodle.ownerId = lastGO.instanceId;
						}
					} else {
						player.selectedCustomerId = lastGO.instanceId;
					}
					player.selectedBankId = 0;
					player.selectedPotId = 0;
					player.selectedNoodleId = 0;
					if (player.selectedCustomerId === 0) {
						self.cursor.x = -240;
					} else {
						self.cursor.x = lastGO.tr.position.x;
						self.cursor.y = lastGO.tr.position.y;
					}
				}
			} else if (lastGO.chair) {
				const customerOnChair = self.goArr.find((_elem) => {
					if (!_elem.customer) return false;
					if (_elem.customer.chairId !== lastGO.instanceId) return false;
					return true;
				});
				const selectedCustomer = self.goArr.find((_elem) => {
					if (!_elem.customer) return false;
					if (_elem.instanceId !== player.selectedCustomerId) return false;
					return true;
				});
				if (selectedCustomer && selectedCustomer.customer && !customerOnChair) {
					// 客を席に配置.
					player.selectedChairId = lastGO.instanceId;
					selectedCustomer.customer.chairId = lastGO.instanceId;
					self.cursor.x = lastGO.tr.position.x;
					self.cursor.y = lastGO.tr.position.y;
				}
			} else if (lastGO.tray) {

				var noodleGO = self.goArr.find((_go) => {
					if (_go.instanceId !== player.selectedNoodleId) return false;
					return true;
				});

				if (noodleGO && noodleGO.noodle) {
					// 麺をトレーに置く.
					player.selectedNoodleId = 0;
					player.selectedBankId = 0;
					player.selectedCustomerId = 0;
					player.selectedPotId = 0;
					player.selectedTrayId = lastGO.instanceId;
					// self.cursor.x = lastGO.tr.position.x;
					// self.cursor.y = lastGO.tr.position.y;
					noodleGO.noodle.ownerId = lastGO.instanceId;
					if (noodleGO.sprite instanceof Sprite) {
						noodleGO.sprite.image = "obj_noodle_02";
					}
					//Vector2Helper.copyFrom(noodleGO.tr.position, lastGO.tr.position);
				} else if (player.selectedBankId !== 0) {
					// 素麺をトレーに置く.
					const bankGO = self.goArr.find((_elem) => {
						if (_elem.instanceId !== player.selectedBankId) return false;
						return true;
					});
					player.selectedNoodleId = 0;
					player.selectedBankId = 0;
					player.selectedCustomerId = 0;
					player.selectedPotId = 0;
					player.selectedTrayId = lastGO.instanceId;
					self.cursor.x = lastGO.tr.position.x;
					self.cursor.y = lastGO.tr.position.y;

					const noodle = self.createNoodle();
					const go = self.getGameObject(noodle.entityId);
					noodle.ownerId = lastGO.instanceId;
					Vector2Helper.copyFrom(go.tr.position, bankGO.tr.position);
				}
			} else if (lastGO.bank) {
				// 麺を持つ.
				player.selectedBankId = self.lastPointBtn.instanceId;
				player.selectedCustomerId = 0;
				player.selectedPotId = 0;
				player.selectedNoodleId = 0;

				self.cursor.x = lastGO.tr.position.x;
				self.cursor.y = lastGO.tr.position.y;
			} else if (self.lastPointBtn.pot) {
				const bankGO = self.goArr.find((_elem) => {
					if (_elem.instanceId !== player.selectedBankId) return false;
					return true;
				});
				player.selectedBankId = 0;
				player.selectedCustomerId = 0;
				player.selectedNoodleId = 0;
				player.selectedPotId = self.lastPointBtn.instanceId;

				self.cursor.x = lastGO.tr.position.x;
				self.cursor.y = lastGO.tr.position.y;

				var potGo = self.lastPointBtn;

				var noodleInPot = self.goArr.find((_go) => {
					if (_go.noodle === null) return false;
					if (_go.noodle.ownerId !== potGo.instanceId) return false;
					return true;
				});

				if (bankGO) {
					if (noodleInPot) {
						// 麺を捨てる.
						noodleInPot.hasDelete = true;
					}
					// 麺を茹でる.
					var noodle = self.createNoodle();
					var go = self.getGameObject(noodle.entityId);
					noodle.ownerId = self.lastPointBtn.instanceId;
					Vector2Helper.copyFrom(go.tr.position, bankGO.tr.position);
					player.selectedNoodleId = 0; // go.instanceId;
					self.cursor.x = -240;
				} else {
					// 麺を持つ.
					if (noodleInPot) {
						player.selectedNoodleId = noodleInPot.instanceId;
					}
				}
			}
			self.lastPointBtn = null;
		}


		if (evt.app.pointer.getPointingStart()) {


		}

		if (evt.app.pointer.getPointing()) {
		}

		if (evt.app.pointer.getPointingEnd()) {
		}

		return null;
	}

	static addScoreLabel(self: HogeScene, score: IScore, pos: Vector2) {
		let text = `+${score.score}`;
		if (score.score <= 0) {
			text = 'MISS!';
		} else {
			text = `${score.text} ` + text;
		}
		const label = Label({
			text: text,
			fontSize: 24,
			fill: '#ffffff',
		});
		label.addChildTo(self.scene);
		label.x = pos.x;
		label.y = pos.y;
		label.tweener.
			moveBy(0, -16, 200).
			moveBy(0, -1, 800).
			call(() => label.remove());
	}

	static stateGameOver(self: HogeScene, evt: StateEvent) {
		if (evt.sm.time === 0) {
			self.isEnd = true;
			self.centerTelop.text = 'GAME OVER';
		}
		if (2000 <= evt.sm.time) {
			return HogeScene.stateGameOver2;
		}
		return null;
	}

	static stateGameOver2(self: HogeScene, evt: StateEvent) {
		if (evt.sm.time === 0) {
			self.centerTelop.text = `GAME OVER\nSCORE ${self.player.score}`;
		}
		if (3000 <= evt.sm.time) {
			if (evt.app.pointer.getPointingStart()) {
				return HogeScene.stateExit;
			}
		}
		return null;
	}

	static stateExit(self: HogeScene, evt: StateEvent) {
		if (evt.sm.time === 0) {
			self.scene.exit();
		}
		return null;
	}

	static normalizePosition(centerRect: Rect, v1: Vector2) {
		v1.x = (v1.x - centerRect.centerX) / (centerRect.width * 0.5);
		v1.y = (v1.y - centerRect.centerY) / (centerRect.height * 0.5);
		return v1;
	}

	static unnormalizePosition(centerRect: Rect, v1: Vector2) {
		v1.x = (v1.x * centerRect.width * 0.5) + centerRect.centerX;
		v1.y = (v1.y * centerRect.height * 0.5) + centerRect.centerY;
		return v1;
	}

	static isHit(a: GameObject, b: GameObject) {
		const aCollider = a.collider;
		if (!aCollider) return false;
		const bCollider = b.collider;
		if (!bCollider) return false;
		return aCollider.sprite.hitTestElement(new Rect(
			bCollider.sprite.left,
			bCollider.sprite.top,
			bCollider.sprite.width,
			bCollider.sprite.height
		));
	}

	static hit(own: GameObject, other: GameObject) {
	}

	static hit2(own: GameObject, other: GameObject) {
		own.life.hp -= 1;
		if (own.life.hp < 0) {
			own.life.hp = 0;
		}
		if (own.shaker) {
			ShakerHelper.shake(own.shaker);
		}
	}

	updateHit(goArr: GameObject[], aFilter: (go: GameObject) => boolean, bFilter: (go: GameObject) => boolean) {
		for (var i = 0; i < goArr.length; i++) {
			const aGO = goArr[i];
			if (!aFilter(aGO)) continue;
			for (var j = 0; j < goArr.length; j++) {
				const bGO = goArr[j];
				if (!bFilter(bGO)) continue;
				if (!HogeScene.isHit(aGO, bGO)) continue;
				HogeScene.hit(aGO, bGO);
				HogeScene.hit(bGO, aGO);
			}
		}
	}

	updateShaker(myScene: HogeScene, app: GameApp) {
		const goArr = myScene.goArr;
		goArr.forEach(go => {
			const shaker = go.shaker;
			if (!shaker) return;
			ShakerHelper.update(shaker, app);
		});
	}

	waveArr = [
		// type 1: 客
		// type 2: 客消化の待機
		// time, type, boilLv
		[500, 1, 1],

		[0, 2, 0],

		[500, 1, 3],
		[500, 1, 2],

		[0, 2, 0],

		[500, 1, 1],
		[500, 1, 2],
		[500, 1, 3],

		[0, 2, 0],

		[500, 1, 1],
		[500, 1, 2],
		[500, 1, 1],
		[5000, 1, 2],
		[500, 1, 1],
		[2000, 1, 2],

		[0, 2, 0],

		[500, 1, 3],
		[10000, 1, 3],
		[500, 1, 3],
		[500, 1, 3],
		[500, 1, 3],
		[500, 1, 3],

		[5000, 1, 1],
		[500, 1, 2],
		[5000, 1, 1],
		[500, 1, 2],
		[5000, 1, 1],
		[500, 1, 2],

		[0, 2, 0],

		[500, 1, 1],
		[500, 1, 3],
		[5000, 1, 3],
		[500, 1, 2],
		[500, 1, 2],
		[500, 1, 3],

	];

	updateQuest(app: GameApp) {
		if (!this.isStarted || this.isEnd) return;

		if (this.questWork.waveIndex < this.waveArr.length) {
			const wave = this.waveArr[this.questWork.waveIndex];
			const waveTime = wave[0];
			const waveType = wave[1];
			const waveBoilLv = wave[2];
			if (waveTime <= this.questWork.waveTime) {
				switch (waveType) {
					case 1: {
						const waitingCustomerArr = this.findComponents((_go) => {
							if (_go.customer === null) return null;
							if (_go.customer.waitIndex === -1) return null;
							return _go.customer;
						});

						if (this.standWaitPosArr.length <= waitingCustomerArr.length) {
							break;
						}
						const customer = this.createCustomer();
						customer.orderedBoilLv = waveBoilLv;
						this.questWork.waveTime = 0;
						this.questWork.waveIndex++;
						break;
					}
					case 2:
						const customerArr = this.findComponents((_go) => {
							return _go.customer;
						});
						if (0 < customerArr.length) {
							break;
						}
						this.questWork.waveTime = 0;
						this.questWork.waveIndex++;
						break;
				}
			}
		}

		this.questWork.waveTime += app.deltaTime;
		this.questWork.time += app.deltaTime;
	}

	static boilLvToTime(boilLv: number) {
		return boilLv * 5000;
	}

	static boilTimeToTimerRotation(boilTime: number) {
		return boilTime / (5000 * 4) * 360;
	}

	enterframe(evt: EnterFrameEvent) {
		const app = evt.app;
		const myScene = this;
		const self = this;
		const questWork = myScene.questWork;

		myScene.sm.update(myScene, app);

		myScene.updateQuest(app);
		const goArr = myScene.goArr;


		myScene.updateShaker(myScene, app);

		const customerArr = self.findComponents((_go) => _go.customer);
		customerArr.forEach((customer) => {
			var _go = self.getGameObject(customer.entityId);
			var nextState = 0;
			switch (customer.state) {
				case CustomerState.ENTER_SHOP: {
					_go.tr.position.x = this.customerEnterPos.x;
					_go.tr.position.y = this.customerEnterPos.y;
					customer.waitIndex = self.standWaitPosArr.length;

					// 次の枠を探す.
					const nextIndex = customer.waitIndex - 1;
					let hasNextIndex = true;
					for (var i = 0; i < customerArr.length; i++) {
						const other = customerArr[i];
						if (other.waitIndex !== nextIndex) continue;
						hasNextIndex = false;
						break;
					}
					if (hasNextIndex) {
						customer.waitIndex = nextIndex;
						customer.state = CustomerState.STAND_WAIT;
						break;
					}
				}
				case CustomerState.STAND_WAIT:
					if (0 < customer.chairId) {
						customer.waitIndex = -1;
						nextState = CustomerState.MOVE;
						break;
					}

					{
						// 客にぶつかる麺を取得.
						const noodleArr = self.findComponents((_go2) => {
							if (_go2.noodle === null) return null;
							if (_go2.noodle.ownerId !== _go.instanceId) return null;
							return _go2.noodle;
						});
						if (0 < noodleArr.length) {
							nextState = CustomerState.EAT;
							break;
						}
					}
					// 次の枠を探す.
					if (0 < customer.waitIndex) {
						const nextIndex = customer.waitIndex - 1;
						let hasNextIndex = true;
						for (var i = 0; i < customerArr.length; i++) {
							const otherCustomer = customerArr[i];
							if (otherCustomer.waitIndex !== nextIndex) continue;
							hasNextIndex = false;
							break;
						}
						if (hasNextIndex) {
							customer.waitIndex = nextIndex;
						}
					}
					var posItem = self.standWaitPosArr[customer.waitIndex];
					Vector2Helper.setMoveTo(_go.tr.position, posItem, 200 * evt.app.deltaTime / 1000);
					break;
				case CustomerState.MOVE: {
					if (customer.stateTime === 0) {
					}
					const duration = 1000;
					const progress = MathHelper.progress01(customer.stateTime, duration);

					const chairGO = self.goArr.find((_elem) => {
						if (_elem.instanceId !== customer.chairId) return false;
						return true;
					});

					Vector2Helper.setMoveTo(_go.tr.position, chairGO.tr.position, 200 * evt.app.deltaTime / 1000);

					if (1 <= progress) {
						nextState = CustomerState.THINK;
						Vector2Helper.copyFrom(_go.tr.position, chairGO.tr.position);

						const trayGO = self.goArr.find((_elem) => {
							if (!_elem.tray) return false;
							if (_elem.tray.chairId !== chairGO.instanceId) return false;
							return true;
						});
						customer.trayId = trayGO.instanceId;

						break;
					}
					break;
				}
				case CustomerState.THINK: {
					if (customer.stateTime === 0) {
					}
					const noodle = self.goArr.find((_elem) => {
						if (!_elem.noodle) return false;
						return _elem.noodle.ownerId === customer.trayId;
					});
					if (noodle !== null) {
						nextState = CustomerState.EAT;
						break;
					}
					const duration = 500;
					const progress = MathHelper.progress01(customer.stateTime, duration);
					if (1 <= progress) {
						nextState = CustomerState.CHAIR_WAIT;
						break;
					}
					break;
				}
				case CustomerState.CHAIR_WAIT: {
					if (customer.stateTime === 0) {
						const go = new GameObject();
						go.effect = new Effect();
						go.effect.duration = 3000;
						go.sprite = Sprite("order_0" + customer.orderedBoilLv);
						go.sprite.addChildTo(self.scene);
						SpriteHelper.setPriority(go.sprite, 40);
						go.tr.position.x = _go.tr.position.x;
						go.tr.position.y = _go.tr.position.y - 32;
						self.pushGameObject(go);
					}
					const noodle = self.goArr.find((_elem) => {
						if (!_elem.noodle) return false;
						return _elem.noodle.ownerId === customer.trayId;
					});
					if (noodle !== null && noodle.noodle !== null) {
						nextState = CustomerState.EAT;
						break;
					}
					{
						// 客にぶつかる麺を取得.
						const noodleArr = self.findComponents((_go2) => {
							if (_go2.noodle === null) return null;
							if (_go2.noodle.ownerId !== _go.instanceId) return null;
							return _go2.noodle;
						});
						if (0 < noodleArr.length) {
							nextState = CustomerState.EAT;
							break;
						}
					}
					break;
				}
				case CustomerState.EAT: {
					let noodle: GameObject | null = self.goArr.find((_elem) => {
						if (!_elem.noodle) return false;
						return _elem.noodle.ownerId === customer.trayId;
					});
					{
						// 客にぶつかる麺を取得.
						const noodleArr = self.findComponents((_go2) => {
							if (_go2.noodle === null) return null;
							if (_go2.noodle.ownerId !== _go.instanceId) return null;
							return _go2.noodle;
						});
						if (0 < noodleArr.length) {
							noodle = self.getGameObject(noodleArr[0].entityId);
						}
					}

					if (customer.stateTime === 0) {
						if (noodle !== null && noodle.noodle !== null) {
							var boiledTime = noodle.noodle.boiledTime;
							const boilDelta = boiledTime - HogeScene.boilLvToTime(customer.orderedBoilLv);
							const boilDistance = Math.abs(boilDelta);
							const boilThreshold1 = 2500;
							const boilThreshold2 = 5000;
							let reactionLv = 1;
							if (boiledTime <= 0) {
								// オエー!
								customer.reactionLv = 1;
							} else if (boilDistance < boilThreshold1) {
								// うまい!
								customer.reactionLv = 3;
							} else if (boilDistance < boilThreshold2) {
								// まずい!
								customer.reactionLv = 2;
							} else {
								// オエー!
								customer.reactionLv = 1;
							}
						}
					}

					const duration = 2000;
					const progress = MathHelper.progress01(customer.stateTime, duration);
					if (1 <= progress) {
						if (noodle !== null) {
							noodle.hasDelete = true;
						}
						nextState = CustomerState.EXIT_SHOP;
						break;
					}
					break;
				}
				case CustomerState.EXIT_SHOP: {
					if (customer.stateTime === 0) {
						let score = 0;
						switch (customer.reactionLv) {
							case 1:
								score += 10;
								break;
							case 2:
								score += 200;
								break;
							case 3:
							default:
								score += 500;
								break;
						}

						if (score !== 0 && !this.isEnd) {
							this.player.score += score;
						}

						{
							const go = new GameObject();
							go.effect = new Effect();
							go.effect.duration = 1000;
							go.sprite = Sprite("reaction_0" + customer.reactionLv);
							go.sprite.addChildTo(self.scene);
							SpriteHelper.setPriority(go.sprite, 40);
							go.tr.position.x = _go.tr.position.x;
							go.tr.position.y = _go.tr.position.y - 32;
							self.pushGameObject(go);
						}
					}
					const duration = 2000;
					const progress = MathHelper.progress01(customer.stateTime, duration);

					Vector2Helper.setMoveTo(_go.tr.position, this.customerEnterPos, 200 * evt.app.deltaTime / 1000);

					if (1 <= progress) {
						_go.hasDelete = true;
						break;
					}
					break;
				}
			}
			if (nextState !== 0) {
				customer.state = nextState;
				customer.stateTime = 0;
			} else {
				customer.stateTime += evt.app.deltaTime;
			}
		});


		self.goArr.forEach((_go) => {
			if (_go.noodle) {
				const noodle = _go.noodle;
				const onwerGO = self.goArr.find((_elem) => {
					if (_elem.instanceId !== noodle.ownerId) return false;
					return true;
				});
				if (onwerGO === null) {
					_go.hasDelete = true;
				} else {
					const dx = onwerGO.tr.position.x - _go.tr.position.x;
					const dy = onwerGO.tr.position.y - _go.tr.position.y;
					const mx = dx * 8 * evt.app.deltaTime / 1000;
					const my = dy * 8 * evt.app.deltaTime / 1000;
					_go.tr.position.x += mx;
					_go.tr.position.y += my;
				}
			}
			if (_go.noodle) {
				const noodleOwnerGO = self.findGameObject(_go.noodle.ownerId);
				if (noodleOwnerGO && noodleOwnerGO.pot) {
					_go.noodle.boiledTime += evt.app.deltaTime;
				}
			}

		});

		{
			const potArr = [];
			const noodleArr = [];
			const timerArr = [];
			for (var i = 0, j = 0; i < this.goArr.length; i++) {
				const go = this.goArr[i];
				if (!go.noodle) continue;
				const noodleOwner = this.findGameObject(go.noodle.ownerId);
				if (!noodleOwner) continue;
				if (!noodleOwner.pot) continue;
				potArr.push(noodleOwner);
				noodleArr.push(go);
			}

			for (var i = 0; i < this.goArr.length; i++) {
				const go = this.goArr[i];
				if (!go.noodleTimer) continue;
				timerArr.push(go);
			}

			for (var i = 0; i < timerArr.length; i++) {
				const timerGO = timerArr[i];
				const potGO = potArr[i];
				const noodleGO = noodleArr[i];
				if (!timerGO.sprite) continue;
				if (!potGO) {
					timerGO.sprite.alpha = 0;
					continue;
				}
				if (!noodleGO.noodle) continue;
				timerGO.sprite.alpha = 1;
				const needle = timerGO.sprite.getChildAt(1);
				if (needle instanceof DisplayElement) {
					needle.rotation = HogeScene.boilTimeToTimerRotation(noodleGO.noodle.boiledTime);
				}
				timerGO.tr.position.x = potGO.tr.position.x - 16;
				timerGO.tr.position.y = potGO.tr.position.y - 16;
			}
		}

		// Effect.
		goArr.forEach(go => {
			const effect = go.effect;
			if (!effect) return;
			effect.time += app.ticker.deltaTime;
			if (effect.time < effect.duration) return;
			go.hasDelete = true;
		});


		// collider 位置更新.
		myScene.goArr.forEach((go) => {
			const collider = go.collider;
			if (!collider) return;
			const sprite = collider.sprite;
			if (!sprite) return;
			sprite.x = go.tr.position.x;
			sprite.y = go.tr.position.y;
		});

		// 衝突判定.
		//myScene.updateHit(goArr, go => go.type === GameObjectType.PLAYER, go => go.type === GameObjectType.ENEMY);
		myScene.updateHit(goArr, go => go.type === GameObjectType.PLAYER_BULLET, go => go.type === GameObjectType.ENEMY);

		// 掃除.
		for (var i = goArr.length - 1; 0 <= i; i--) {
			const go = goArr[i];
			if (!go.hasDelete) continue;
			myScene.destroyGameObject(go);
			goArr.splice(i, 1);
		}

		// 描画.
		{
			myScene.goArr.forEach((go) => {
				const sprite = go.sprite;
				if (sprite === null) return;
				const sc = go.tr.getSpriteScale();
				sprite.scaleX = sc.x;
				sprite.scaleY = sc.y;
				sprite.x = go.tr.position.x;
				sprite.y = go.tr.position.y;
				if (go.shaker) {
					sprite.x += go.shaker.offset.x;
					sprite.y += go.shaker.offset.y;
				}
			});
		}


		var sprites: DisplayElement[] = [];
		myScene.goArr.forEach((go) => {
			if (!go.sprite) return;
			sprites.push(go.sprite);
		});

		myScene.scene.children.sort((a, b) => {
			if (!(a instanceof DisplayElement)) return 0;
			if (!(b instanceof DisplayElement)) return 0;
			var aPriority = SpriteHelper.getPriority(a);
			var bPriority = SpriteHelper.getPriority(b);

			if (a instanceof Label) {
				aPriority = 1000;
			}
			if (b instanceof Label) {
				bPriority = 1000;
			}

			var cmp = aPriority - bPriority;
			return cmp;
		});

		var text = '';
		text += 'SCORE: ' + this.player.score;
		text += ' TIME: ' + (this.questWork.getRestTime() / 1000).toFixed(1);
		myScene.mainLabel.text = text;

	}

	destroyGameObject(go: GameObject) {
		if (go.sprite) {
			go.sprite.remove();
		}
		if (go.collider) {
			go.collider.sprite.remove();
		}
	}
}

phina.define('MainScene', {
	superClass: 'DisplayScene',
	init: function (options: any) {
		this.superInit(options);
		this.myScene = new HogeScene(this as any);
		console.log('fuga');
	},

	update: function () {
		var scene = this.myScene as HogeScene;
	}
});

// メイン処理
phina.main(function () {
	// アプリケーション生成
	let app = GameApp({
		startLabel: 'main', // メインシーンから開始する
		fps: 60,
		width: DF.SC_W,
		height: DF.SC_H,
		assets: ASSETS,
		scenes: [
			{
				className: 'MainScene',
				label: 'main',
				nextLabel: 'main',
			},
		],
	});

	// アプリケーション実行
	app.run();
});
