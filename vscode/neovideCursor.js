const Color = '#ff9977';
const CursorStyle = 'line';
const TrailLength = 5;
const CursorUpdatePollingRate = 500;

function createTrail(options) {
	const totalParticles = options?.length || 20;
	const style = options?.style || 'block';
	const canvas = options?.canvas;
	const context = canvas.getContext('2d');

	let particlesColor = options?.color || '#A052FF';
	let cursor = { x: 0, y: 0 };
	let particles = [];
	let width, height;
	let sizeX = options?.size || 3;
	let sizeY = options?.sizeY || sizeX * 2.2;
	let cursorsInitted = false;

	function updateSize(x, y) {
		width = x;
		height = y;
		canvas.width = x;
		canvas.height = y;
	}

	function move(x, y) {
		x = x + sizeX / 2;
		cursor.x = x;
		cursor.y = y;
		if (cursorsInitted === false) {
			cursorsInitted = true;
			for (let i = 0; i < totalParticles; i++) {
				addParticle(x, y);
			}
		}
	}

	class Particle {
		constructor(x, y) {
			this.position = { x: x, y: y };
		}
	}

	function addParticle(x, y, image) {
		particles.push(new Particle(x, y, image));
	}

	function calculatePosition() {
		let x = cursor.x,
			y = cursor.y;

		for (const particleIndex in particles) {
			const nextParticlePos = (particles[+particleIndex + 1] || particles[0])
				.position;
			const particlePos = particles[+particleIndex].position;

			particlePos.x = x;
			particlePos.y = y;

			x += (nextParticlePos.x - particlePos.x) * 0.42;
			y += (nextParticlePos.y - particlePos.y) * 0.35;
		}
	}

	function drawLines() {
		context.beginPath();
		context.lineJoin = 'round';
		context.strokeStyle = particlesColor;
		const lineWidth = Math.min(sizeX, sizeY);
		context.lineWidth = lineWidth;

		let ymut = (sizeY - lineWidth) / 3;
		for (let yoffset = 0; yoffset <= 3; yoffset++) {
			let offset = yoffset * ymut;
			for (const particleIndex in particles) {
				const pos = particles[particleIndex].position;
				if (particleIndex == 0) {
					context.moveTo(pos.x, pos.y + offset + lineWidth / 2);
				} else {
					context.lineTo(pos.x, pos.y + offset + lineWidth / 2);
				}
			}
		}
		context.stroke();
	}

	function drawPath() {
		context.beginPath();
		context.fillStyle = particlesColor;

		for (
			let particleIndex = 0;
			particleIndex < totalParticles;
			particleIndex++
		) {
			const pos = particles[+particleIndex].position;
			if (particleIndex == 0) {
				context.moveTo(pos.x, pos.y);
			} else {
				context.lineTo(pos.x, pos.y);
			}
		}
		for (
			let particleIndex = totalParticles - 1;
			particleIndex >= 0;
			particleIndex--
		) {
			const pos = particles[+particleIndex].position;
			context.lineTo(pos.x, pos.y + sizeY);
		}
		context.closePath();
		context.fill();

		context.beginPath();
		context.lineJoin = 'round';
		context.strokeStyle = particlesColor;
		context.lineWidth = Math.min(sizeX, sizeY);

		let offset = -sizeX / 2 + sizeY / 2;
		for (const particleIndex in particles) {
			const pos = particles[particleIndex].position;
			if (particleIndex == 0) {
				context.moveTo(pos.x, pos.y + offset);
			} else {
				context.lineTo(pos.x, pos.y + offset);
			}
		}
		context.stroke();
	}

	function updateParticles() {
		if (!cursorsInitted) return;

		context.clearRect(0, 0, width, height);
		calculatePosition();

		if (style == 'line') drawPath();
		else if (style == 'block') drawLines();
	}

	function updateCursorSize(newSize, newSizeY) {
		sizeX = newSize;
		if (newSizeY) sizeY = newSizeY;
	}

	return {
		updateParticles: updateParticles,
		move: move,
		updateSize: updateSize,
		updateCursorSize: updateCursorSize,
	};
}

async function createCursorHandler(handlerFunctions) {
	let editor;
	while (!editor) {
		await new Promise((resolve) => setTimeout(resolve, 100));
		editor = document.querySelector('.part.editor');
	}
	handlerFunctions?.onStarted(editor);

	let updateHandlers = [];
	let cursorId = 0;
	let lastObjects = {};
	let lastCursor = 0;

	function createCursorUpdateHandler(target, cursorId, cursorHolder, minimap) {
		let lastX, lastY;
		let update = (editorX, editorY) => {
			if (!lastObjects[cursorId]) {
				updateHandlers.splice(updateHandlers.indexOf(update), 1);
				return;
			}

			let { left: newX, top: newY } = target.getBoundingClientRect();
			let revX = newX - editorX,
				revY = newY - editorY;

			if (revX == lastX && revY == lastY && lastCursor == cursorId) return;
			lastX = revX;
			lastY = revY;

			if (revX <= 0 || revY <= 0) return;

			if (target.style.visibility != 'inherit') return;

			if (minimap && minimap.getBoundingClientRect().left <= newX) return;

			if (cursorHolder.getBoundingClientRect().left > newX) return;

			lastCursor = cursorId;
			handlerFunctions?.onCursorPositionUpdated(revX, revY);
			handlerFunctions?.onCursorSizeUpdated(
				target.clientWidth,
				target.clientHeight
			);
		};
		updateHandlers.push(update);
	}

	let lastVisibility = 'hidden';
	setInterval(async () => {
		let now = [],
			count = 0;
		for (const target of editor.getElementsByClassName('cursor')) {
			if (target.style.visibility != 'inherit') count++;
			if (target.hasAttribute('cursorId')) {
				now.push(+target.getAttribute('cursorId'));
				continue;
			}
			let thisCursorId = cursorId++;
			now.push(thisCursorId);
			lastObjects[thisCursorId] = target;
			target.setAttribute('cursorId', thisCursorId);
			let cursorHolder = target.parentElement.parentElement.parentElement;
			let minimap = cursorHolder.parentElement.querySelector('.minimap');
			createCursorUpdateHandler(target, thisCursorId, cursorHolder, minimap);
		}

		let visibility = count <= 1 ? 'visible' : 'hidden';
		if (visibility != lastVisibility) {
			handlerFunctions?.onCursorVisibilityChanged(visibility);
			lastVisibility = visibility;
		}

		for (const id in lastObjects) {
			if (now.includes(+id)) continue;
			delete lastObjects[+id];
		}
	}, handlerFunctions?.cursorUpdatePollingRate || 500);

	function updateLoop() {
		let { left: editorX, top: editorY } = editor.getBoundingClientRect();
		for (handler of updateHandlers) handler(editorX, editorY);
		handlerFunctions?.onLoop();
		requestAnimationFrame(updateLoop);
	}

	function updateEditorSize() {
		handlerFunctions?.onEditorSizeUpdated(
			editor.clientWidth,
			editor.clientHeight
		);
	}
	new ResizeObserver(updateEditorSize).observe(editor);
	updateEditorSize();

	updateLoop();
	handlerFunctions?.onReady();
}

let cursorCanvas, rainbowCursorHandle;
createCursorHandler({
	cursorUpdatePollingRate: CursorUpdatePollingRate,
	onStarted: (editor) => {
		cursorCanvas = document.createElement('canvas');
		cursorCanvas.style.pointerEvents = 'none';
		cursorCanvas.style.position = 'absolute';
		cursorCanvas.style.top = '0px';
		cursorCanvas.style.left = '0px';
		cursorCanvas.style.zIndex = '1000';
		editor.appendChild(cursorCanvas);

		let color = Color;
		if (color == 'default') {
			color = getComputedStyle(document.querySelector('body>.monaco-workbench'))
				.getPropertyValue('--vscode-editorCursor-background')
				.trim();
		}

		rainbowCursorHandle = createTrail({
			length: TrailLength,
			color: color,
			size: 7,
			style: CursorStyle,
			canvas: cursorCanvas,
		});
	},

	onReady: () => {},
	onCursorPositionUpdated: (x, y) => {
		rainbowCursorHandle.move(x, y);
	},
	onEditorSizeUpdated: (x, y) => {
		rainbowCursorHandle.updateSize(x, y);
	},
	onCursorSizeUpdated: (x, y) => {
		rainbowCursorHandle.updateCursorSize(x, y);
	},
	onCursorVisibilityChanged: (visibility) => {
		cursorCanvas.style.visibility = visibility;
	},

	onLoop: () => {
		rainbowCursorHandle.updateParticles();
	},
});
