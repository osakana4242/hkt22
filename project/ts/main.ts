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
		"obj_noodle": "./img/obj_noodle.png",
		"obj_pot": "./img/obj_pot.png",
		"order_01": "./img/order_01.png",
		"order_02": "./img/order_02.png",
		"order_03": "./img/order_03.png",
		"bg_01": "./img/bg_01.png",
	},
	spritesheet: {
		"obj": "./img/obj.ss.json",
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
	/** 0 = 相手; 1 = 自分 */
	state = 0;
	questIndex = 0;
	blockIndex = 0;
	noteIndex = 0;
	loopCount = 0;
	barTime = 0;
	time = 0;

	getQuestData() {
		return questDataArr[this.questIndex];
	}

	getBpm() {
		return this.getQuestData().bpm + (this.loopCount * 20);
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
	stageLeft = 0;
	enemyRect = new Rect(-64, -64, DF.SC_W + 160, DF.SC_H + 128);
	screenRect = new Rect(0, 0, DF.SC_W, DF.SC_H);
	centerRect: Rect;
	isStarted = false;
	isEnd = false;
	sm = new StateMachine();


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
	score = 0;
	hasPause = false;
	lastLine: PathShape | null = null;
	playerLineIndex = 0;
	playerLineStartTime = 0;
	playerHp = 3;
	playerHasDamage = false;
	cursor: RectangleShape;
	btnPotArr: GameObject[];
	lastPointBtn: GameObject | null = null;
	player: GameObject;


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
			go.player = new Player();
			this.goArr.push(go);
			this.player = go;
		}

		{
			const bg = Sprite("bg_01");
			bg.addChildTo(pScene);
			bg.x = this.screenRect.centerX;
			bg.y = this.screenRect.centerY;
			SpriteHelper.setPriority(bg, 0);
		}

		{
			var potPosArr = [
				[4, 32],
				[44, 32],
				[84, 32],
				[124, 32],
				[164, 32],
				[204, 32],
			];
			this.btnPotArr = [];
			potPosArr.forEach((_item, _i) => {
				const sprite = Sprite("obj_customer");
				sprite.addChildTo(pScene);
				var go = new GameObject();
				go.sprite = sprite;
				SpriteHelper.setPriority(go.sprite, 20);
				go.customer = new Customer();
				go.customer.orderedBoilLv = 1;
				go.customer.state = CustomerState.STAND_WAIT;
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
			var potPosArr = [
				[4, 96],
				[44, 96],
				[84, 96],
				[124, 96],
				[164, 96],
				[204, 96],
			];
			this.btnPotArr = [];
			potPosArr.forEach((_item, _i) => {
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
			var potPosArr = [
				[4, 136],
				[44, 136],
				[84, 136],
				[124, 136],
				[164, 136],
				[204, 136],
			];
			this.btnPotArr = [];
			potPosArr.forEach((_item, _i) => {
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
			go.bank = new Bank();
			go.tr.position.x = 8 + 16;
			go.tr.position.y = 256 + 16;
			go.sprite = btnBank;
			SpriteHelper.setPriority(go.sprite, 10);
			go.sprite.setInteractive(true, go.sprite.boundingType);
			go.sprite.addEventListener("pointstart", () => {
				this.lastPointBtn = go;
			});
			this.goArr.push(go);
		}

		{
			var potPosArr = [
				[120, 208],
				[160, 208],
				[200, 208],
				[120, 248],
				[160, 248],
				[200, 248],
			];
			this.btnPotArr = [];
			potPosArr.forEach((_item, _i) => {
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
				fontSize: 20,
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

	static state1(self: HogeScene, evt: StateEvent) {
		if (evt.sm.time === 0) {
			self.centerTelop.text = 'ラーメン\n(クリックで開始)';
			self.centerTelop.fill = '#444444';
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

		if (self.playerHp <= 0) {
			return HogeScene.stateGameOver;
		}
		if (evt.app.keyboard.getKeyDown('g')) {
			return HogeScene.stateGameOver;
		}
		if (evt.app.keyboard.getKeyDown('r')) {
			return HogeScene.stateExit;
		}

		self.goArr.forEach((_go) => {
			if (_go.noodle) {
				const noodle = _go.noodle;
				const onwerGO = self.goArr.find((_elem) => {
					if (_elem.instanceId !== noodle.ownerId) return false;
					return true;
				});
				if (onwerGO) {
					const dx = onwerGO.tr.position.x - _go.tr.position.x;
					const dy = onwerGO.tr.position.y - _go.tr.position.y;
					const mx = dx * 8 * evt.app.deltaTime / 1000;
					const my = dy * 8 * evt.app.deltaTime / 1000;
					_go.tr.position.x += mx;
					_go.tr.position.y += my;
				}
			}
			if (_go.customer) {
				const customer = _go.customer;
				var nextState = 0;
				switch (customer.state) {
					case CustomerState.STAND_WAIT:
						if (customer.chairId) {
							nextState = CustomerState.MOVE;
							break;
						}
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

						const dx = chairGO.tr.position.x - _go.tr.position.x;
						const dy = chairGO.tr.position.y - _go.tr.position.y;
						const mx = dx * 4 * evt.app.deltaTime / 1000;
						const my = dy * 4 * evt.app.deltaTime / 1000;
						_go.tr.position.x += mx;
						_go.tr.position.y += my;


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
						const duration = 1000;
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
							go.effect.duration = 2000;
							go.sprite = Sprite("order_01");
							go.sprite.addChildTo(self.scene);
							SpriteHelper.setPriority(go.sprite, 40);
							go.tr.position.x = _go.tr.position.x;
							go.tr.position.y = _go.tr.position.y - 32;
							self.goArr.push(go);

						}
						const noodle = self.goArr.find((_elem) => {
							if (!_elem.noodle) return false;
							return _elem.noodle.ownerId === customer.trayId;
						});
						if (noodle) {
							nextState = CustomerState.EAT;
							break;
						}
						break;
					}
					case CustomerState.EAT: {
						if (customer.stateTime === 0) {
						}
						const duration = 1000;
						const progress = MathHelper.progress01(customer.stateTime, duration);
						if (1 <= progress) {
							const noodle = self.goArr.find((_elem) => {
								if (!_elem.noodle) return false;
								return _elem.noodle.ownerId === customer.trayId;
							});
							if (noodle) {
								noodle.hasDelete = true;
							}
							nextState = CustomerState.EXIT_SHOP;
							break;
						}
						break;
					}
					case CustomerState.EXIT_SHOP: {
						if (customer.stateTime === 0) {
						}
						const duration = 1000;
						const progress = MathHelper.progress01(customer.stateTime, duration);
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
			}
		});

		const playerGO = self.player;
		if (playerGO.player === null) return;
		const player: Player = playerGO.player;

		if (self.lastPointBtn !== null) {
			const lastGO = self.lastPointBtn;
			if (lastGO.customer !== null) {
				const chairId = lastGO.customer.chairId;
				const chair = self.goArr.find((_elem) => {
					return _elem.instanceId === chairId;
				});

				if (lastGO.customer.state === CustomerState.STAND_WAIT) {
					playerGO.player.selectedCustomerId = lastGO.instanceId;
					playerGO.player.selectedBankId = 0;
					playerGO.player.selectedPotId = 0;
					self.cursor.x = lastGO.tr.position.x;
					self.cursor.y = lastGO.tr.position.y;
				}

				if (chair) {

				} else {
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
					playerGO.player.selectedChairId = lastGO.instanceId;
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
					playerGO.player.selectedNoodleId = 0;
					playerGO.player.selectedBankId = 0;
					playerGO.player.selectedCustomerId = 0;
					playerGO.player.selectedPotId = 0;
					playerGO.player.selectedTrayId = lastGO.instanceId;
					// self.cursor.x = lastGO.tr.position.x;
					// self.cursor.y = lastGO.tr.position.y;
					noodleGO.noodle.ownerId = lastGO.instanceId;
					//Vector2Helper.copyFrom(noodleGO.tr.position, lastGO.tr.position);
				} else if (playerGO.player.selectedBankId !== 0) {
					// 素麺をトレーに置く.
					const bankGO = self.goArr.find((_elem) => {
						if (_elem.instanceId !== player.selectedBankId) return false;
						return true;
					});
					playerGO.player.selectedNoodleId = 0;
					playerGO.player.selectedBankId = 0;
					playerGO.player.selectedCustomerId = 0;
					playerGO.player.selectedPotId = 0;
					playerGO.player.selectedTrayId = lastGO.instanceId;
					self.cursor.x = lastGO.tr.position.x;
					self.cursor.y = lastGO.tr.position.y;

					var go = new GameObject();
					go.noodle = new Noodle();
					go.noodle.ownerId = lastGO.instanceId;
					go.sprite = Sprite("obj_noodle");
					go.sprite.addChildTo(self.scene);
					SpriteHelper.setPriority(go.sprite, 30);
					Vector2Helper.copyFrom(go.tr.position, bankGO.tr.position);
					self.goArr.push(go);
				}
			} else if (lastGO.bank) {
				// 麺を持つ.
				playerGO.player.selectedBankId = self.lastPointBtn.instanceId;
				playerGO.player.selectedCustomerId = 0;
				playerGO.player.selectedPotId = 0;
				playerGO.player.selectedNoodleId = 0;

				self.cursor.x = lastGO.tr.position.x;
				self.cursor.y = lastGO.tr.position.y;
			} else if (self.lastPointBtn.pot) {
				const bankGO = self.goArr.find((_elem) => {
					if (_elem.instanceId !== player.selectedBankId) return false;
					return true;
				});
				playerGO.player.selectedBankId = 0;
				playerGO.player.selectedCustomerId = 0;
				playerGO.player.selectedNoodleId = 0;
				playerGO.player.selectedPotId = self.lastPointBtn.instanceId;

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
					var go = new GameObject();
					go.noodle = new Noodle();
					go.noodle.ownerId = self.lastPointBtn.instanceId;
					go.sprite = Sprite("obj_noodle");
					go.sprite.addChildTo(self.scene);
					SpriteHelper.setPriority(go.sprite, 30);
					Vector2Helper.copyFrom(go.tr.position, bankGO.tr.position);
					self.goArr.push(go);
					playerGO.player.selectedNoodleId = go.instanceId;
				} else {
					// 麺を持つ.
					if (noodleInPot) {
						playerGO.player.selectedNoodleId = noodleInPot.instanceId;
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
			self.playerHp = 0;
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
			self.centerTelop.text = `GAME OVER\nSCORE ${self.score}`;
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

	calcScore(questWork: QuestWork, noteArr: INoteData[], lineIndex: number, startTime: number, posArr: Vector2[]) {
		const result = {
			score: 0,
			text: '',
		};
		if (!MathHelper.isInRange(lineIndex, 0, noteArr.length)) return result;
		const note = noteArr[lineIndex];
		const timeSpan = MidiHelper.tickToMsec(questWork.getBpm(), questWork.getQuestData().bpqn, note.time) - startTime;
		const tThreshold = 500;
		const timeSpan2 = Math.abs(timeSpan);
		if (tThreshold <= timeSpan2) return result;

		const dThreshold = 0.2;

		const centerRect = this.centerRect;
		let v1 = posArr[0].clone();
		let v2 = posArr[posArr.length - 1].clone();
		v1 = HogeScene.normalizePosition(centerRect, v1);
		v2 = HogeScene.normalizePosition(centerRect, v2);
		const startD = Vector2(note.startX, note.startY).distance(v1);
		const endD = Vector2(note.endX, note.endY).distance(v2);

		const score1 = Math.max(tThreshold - timeSpan2, 0) / tThreshold;
		const score2 = Math.max(dThreshold - startD, 0) / dThreshold;
		const score3 = Math.max(dThreshold - endD, 0) / dThreshold;
		const total = (score1 + score2 + score3) / 3.0;
		let text = '';
		if (total < 0.2) {
			text = 'D';
		} else if (total < 0.4) {
			text = 'C';
		} else if (total < 0.6) {
			text = 'B';
		} else if (total < 0.8) {
			text = 'A';
		} else {
			text = 'S';
		}

		result.text = text;
		result.score = Math.floor(total * 3000);
		return result;
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

	enterframe(evt: EnterFrameEvent) {
		const app = evt.app;
		const myScene = this;
		const questWork = myScene.questWork;

		myScene.sm.update(myScene, app);

		//		myScene.updateQuest(myScene, app);
		const goArr = myScene.goArr;

		myScene.updateShaker(myScene, app);

		if (myScene.playerHasDamage) {
			myScene.playerHasDamage = false;
			if (0 < myScene.playerHp) {
				myScene.playerHp -= 1;
			}
		}
		// // Bullet.
		// goArr.forEach(go => {
		// 	const bullet = go.bullet;
		// 	if (!bullet) return;
		// 	const vec = bullet.vec;
		// 	go.sprite.position += vec * app.ticker.deltaTime / 1000;
		// 	if (!MathHelper.isInRange(go.sprite.position, myScene.stageLeft, myScene.stageRight)) {
		// 		go.hasDelete = true;
		// 	}
		// });

		// // Life.
		// goArr.forEach(go => {
		// 	const life = go.life;
		// 	if (!life) return;
		// 	if (0 < life.hp) return;
		// 	go.hasDelete = true;
		// });

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
		text += 'SCORE: ' + myScene.score;
		text += ' LIFE: ' + '■'.repeat(myScene.playerHp);
		// text += '\nDEBUG LOOP: ' + questWork.loopCount + ` T1: ${questWork.barTime} T2: ${questWork.time}`;
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
