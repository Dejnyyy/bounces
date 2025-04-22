// pages/index.tsx
import { useRef, useState } from 'react';
import Matter from 'matter-js';
import { motion, AnimatePresence } from 'framer-motion';

const materials = {
  rubber: 0.9,
  metal: 0.2,
  wood: 0.5,
  plastic: 0.7,
};

export default function Home() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);

  const [sizeLeft, setSizeLeft] = useState(60);
  const [sizeRight, setSizeRight] = useState(60);
  const [massLeft, setMassLeft] = useState(1);
  const [massRight, setMassRight] = useState(1);
  const [materialLeft, setMaterialLeft] = useState<'rubber'|'metal'|'wood'|'plastic'>('rubber');
  const [materialRight, setMaterialRight] = useState<'rubber'|'metal'|'wood'|'plastic'>('rubber');
  const [started, setStarted] = useState(false);

  const [velocityLeftDisplay, setVelocityLeftDisplay] = useState(0);
  const [velocityRightDisplay, setVelocityRightDisplay] = useState(0);

  const handleStart = () => {
    // clear previous canvas
    if (renderRef.current) {
      Matter.Render.stop(renderRef.current);
      renderRef.current.canvas.remove();
      renderRef.current.textures = {} as any;
      renderRef.current = null;
    }
    if (engineRef.current) {
      Matter.World.clear(engineRef.current.world, true);
      Matter.Engine.clear(engineRef.current);
      engineRef.current = null;
    }

    // create new engine and renderer
    const engine = Matter.Engine.create();
    const render = Matter.Render.create({
      element: sceneRef.current as HTMLElement,
      engine,
      options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false,
        background: '#f3f4f6',
      },
    });
    engine.world.gravity.y = 0;
    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    Matter.Render.run(render);

    engineRef.current = engine;
    renderRef.current = render;
    const world = engine.world;

    // static bounds
    const boundsOpts = { isStatic: true, restitution: 1, friction: 0 };
    const ground = Matter.Bodies.rectangle(
      window.innerWidth / 2,
      window.innerHeight + 50,
      window.innerWidth,
      100,
      boundsOpts
    );
    const ceiling = Matter.Bodies.rectangle(
      window.innerWidth / 2,
      -50,
      window.innerWidth,
      100,
      boundsOpts
    );
    const leftWall = Matter.Bodies.rectangle(
      -50,
      window.innerHeight / 2,
      100,
      window.innerHeight,
      boundsOpts
    );
    const rightWall = Matter.Bodies.rectangle(
      window.innerWidth + 50,
      window.innerHeight / 2,
      100,
      window.innerHeight,
      boundsOpts
    );

    // dynamic squares
    const createSquare = (x: number, size: number, mass: number, material: keyof typeof materials) => {
      const opts = { restitution: materials[material], friction: 0, frictionAir: 0, label: material };
      const square = Matter.Bodies.rectangle(x, window.innerHeight / 2, size, size, opts);
      Matter.Body.setMass(square, mass);
      return square;
    };
    const left = createSquare(200, sizeLeft, massLeft, materialLeft);
    const right = createSquare(window.innerWidth - 200, sizeRight, massRight, materialRight);

    Matter.World.add(world, [ground, ceiling, leftWall, rightWall, left, right]);

    // launch
    const speed = 15; // increased for faster bounce
    Matter.Body.setVelocity(left, { x: speed, y: 0 });
    Matter.Body.setVelocity(right, { x: -speed, y: 0 });

    // collision squish only for rubber
    Matter.Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        [pair.bodyA, pair.bodyB].forEach((body) => {
          if (!body.isStatic && body.label === 'rubber') {
            Matter.Body.scale(body, 1.2, 0.8);
            setTimeout(() => {
              Matter.Body.scale(body, 1 / 1.2, 1 / 0.8);
            }, 50) // quicker restore;
          }
        });
      });
    });

    // track velocities
    Matter.Events.on(engine, 'afterUpdate', () => {
      setVelocityLeftDisplay(Math.abs(left.velocity.x));
      setVelocityRightDisplay(Math.abs(right.velocity.x));
    });

    setStarted(true);
  };

  const handleReset = () => {
    if (sceneRef.current) {
      sceneRef.current.innerHTML = '';
    }
    setVelocityLeftDisplay(0);
    setVelocityRightDisplay(0);
    setStarted(false);
  };

  return (
    <div className="relative w-full h-screen text-black ">
      <AnimatePresence>
        {!started && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute z-10 p-4 bg-white bg-opacity-90 rounded-md shadow-md top-4 left-4 max-w-sm space-y-3"
          >
            <div className="font-bold">Left Square</div>
            <label>Material:</label>
            <select
              value={materialLeft}
              onChange={(e) => setMaterialLeft(e.target.value as any)}
              className="border rounded px-2 py-1 w-full"
            >
              {Object.keys(materials).map((mat) => (
                <option key={mat}>{mat}</option>
              ))}
            </select>
            <label>Mass: {massLeft}</label>
            <input
              type="range"
              min="1"
              max="10"
              value={massLeft}
              onChange={(e) => setMassLeft(+e.target.value)}
              className="w-full"
            />
            <label>Size: {sizeLeft}px</label>
            <input
              type="range"
              min="30"
              max="150"
              value={sizeLeft}
              onChange={(e) => setSizeLeft(+e.target.value)}
              className="w-full"
            />

            <div className="font-bold mt-4">Right Square</div>
            <label>Material:</label>
            <select
              value={materialRight}
              onChange={(e) => setMaterialRight(e.target.value as any)}
              className="border rounded px-2 py-1 w-full"
            >
              {Object.keys(materials).map((mat) => (
                <option key={mat}>{mat}</option>
              ))}
            </select>
            <label>Mass: {massRight}</label>
            <input
              type="range"
              min="1"
              max="10"
              value={massRight}
              onChange={(e) => setMassRight(+e.target.value)}
              className="w-full"
            />
            <label>Size: {sizeRight}px</label>
            <input
              type="range"
              min="30"
              max="150"
              value={sizeRight}
              onChange={(e) => setSizeRight(+e.target.value)}
              className="w-full"
            />

            <button
              onClick={handleStart}
              className="mt-4 bg-blue-500 text-black px-4 py-2 rounded hover:bg-blue-600"
            >
              Start
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <div ref={sceneRef} className="w-full h-full"></div>

      {started && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/80 px-4 py-2 rounded shadow text-sm flex flex-col items-center space-y-1">
          <div>Left Speed: {velocityLeftDisplay.toFixed(2)}</div>
          <div>Right Speed: {velocityRightDisplay.toFixed(2)}</div>
          <button
            onClick={handleReset}
            className="mt-2 bg-red-500 text-black px-3 py-1 rounded hover:bg-red-600"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}
