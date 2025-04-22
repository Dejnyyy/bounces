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
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);

  const [sizeLeft, setSizeLeft] = useState(60);
  const [sizeRight, setSizeRight] = useState(60);
  const [materialLeft, setMaterialLeft] = useState<'rubber'|'metal'|'wood'|'plastic'>('rubber');
  const [materialRight, setMaterialRight] = useState<'rubber'|'metal'|'wood'|'plastic'>('rubber');
  const [started, setStarted] = useState(false);
  const [velocityLeftDisplay, setVelocityLeftDisplay] = useState(0);
  const [velocityRightDisplay, setVelocityRightDisplay] = useState(0);

  const handleStart = () => {
    // clear previous scene
    if (renderRef.current) {
      Matter.Render.stop(renderRef.current);
      const canvas = renderRef.current.canvas;
      canvas.parentNode?.removeChild(canvas);
      renderRef.current = null;
    }
    if (engineRef.current) {
      Matter.World.clear(engineRef.current.world, true);
      Matter.Engine.clear(engineRef.current);
      engineRef.current = null;
    }

    const engine = Matter.Engine.create();
    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);

    const container = sceneRef.current!;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const render = Matter.Render.create({
      element: container,
      engine,
      options: { width, height, wireframes: false, background: '#f3f4f6' },
    });
    Matter.Render.run(render);

    engineRef.current = engine;
    renderRef.current = render;
    const world = engine.world;
    world.gravity.y = 0;

    // static bounds
    const opts = { isStatic: true, restitution: 1, friction: 0 };
    const ground = Matter.Bodies.rectangle(width/2, height + 25, width, 50, opts);
    const ceiling = Matter.Bodies.rectangle(width/2, -25, width, 50, opts);
    const leftWall = Matter.Bodies.rectangle(-25, height/2, 50, height, opts);
    const rightWall = Matter.Bodies.rectangle(width + 25, height/2, 50, height, opts);

    // create square: mass automatically proportional to area
    const createSquare = (x: number, size: number, material: keyof typeof materials) => {
      const restitution = materials[material];
      const body = Matter.Bodies.rectangle(x, height/2, size, size, {
        restitution,
        friction: 0,
        frictionAir: 0,
        label: material,
      });
      // mass proportional to area
      const mass = (size * size) / 1000; // scale down for realistic values
      Matter.Body.setMass(body, mass);
      return body;
    };
    const left = createSquare(50 + sizeLeft/2, sizeLeft, materialLeft);
    const right = createSquare(width - 50 - sizeRight/2, sizeRight, materialRight);

    Matter.World.add(world, [ground, ceiling, leftWall, rightWall, left, right]);

    // launch
    const speed = 25;
    Matter.Body.setVelocity(left, { x: speed, y: 0 });
    Matter.Body.setVelocity(right, { x: -speed, y: 0 });

    // collision: squish only for rubber
    Matter.Events.on(engine, 'collisionStart', event => {
      event.pairs.forEach(pair => {
        [pair.bodyA, pair.bodyB].forEach(body => {
          if (!body.isStatic && body.label === 'rubber') {
            Matter.Body.scale(body, 1.2, 0.8);
            setTimeout(() => Matter.Body.scale(body, 1/1.2, 1/0.8), 50);
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
    if (renderRef.current) {
      Matter.Render.stop(renderRef.current);
      const canvas = renderRef.current.canvas;
      canvas.parentNode?.removeChild(canvas);
      renderRef.current = null;
    }
    if (engineRef.current) {
      Matter.World.clear(engineRef.current.world, true);
      Matter.Engine.clear(engineRef.current);
      engineRef.current = null;
    }
    if (sceneRef.current) {
      sceneRef.current.innerHTML = '';
    }
    setVelocityLeftDisplay(0);
    setVelocityRightDisplay(0);
    setStarted(false);
  };

  return (
    <div className="flex items-center justify-center h-screen rounded-3xl">
      <div className="w-[90vw] h-[50vh] mx-auto relative rounded-3xl" ref={containerRef}>
        <AnimatePresence>
          {!started && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute z-10 p-4 bg-white bg-opacity-90 rounded-md shadow-md top-2 left-2 space-y-2 text-black"
            >
              <div className="font-bold">Left Square</div>
              <label>Material:</label>
              <select
                value={materialLeft}
                onChange={e => setMaterialLeft(e.target.value as any)}
                className="border rounded px-2 py-1 w-full text-black"
              >
                {Object.keys(materials).map(mat => <option key={mat}>{mat}</option>)}
              </select>
              <label>Size: {sizeLeft}px</label>
              <input
                type="range"
                min="30"
                max="150"
                value={sizeLeft}
                onChange={e => setSizeLeft(+e.target.value)}
                className="w-full"
              />

              <div className="font-bold mt-2">Right Square</div>
              <label>Material:</label>
              <select
                value={materialRight}
                onChange={e => setMaterialRight(e.target.value as any)}
                className="border rounded px-2 py-1 w-full text-black"
              >
                {Object.keys(materials).map(mat => <option key={mat}>{mat}</option>)}
              </select>
              <label>Size: {sizeRight}px</label>
              <input
                type="range"
                min="30"
                max="150"
                value={sizeRight}
                onChange={e => setSizeRight(+e.target.value)}
                className="w-full"
              />
              <button
                onClick={handleStart}
                className="mt-2 bg-blue-500 text-black px-3 py-1 rounded hover:bg-blue-600"
              >
                Start
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={sceneRef} className="absolute top-0 left-0 w-full h-full" />
        {started && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-white/80 px-3 py-1 rounded shadow text-sm text-black flex flex-col items-center space-y-1">
            <div>Left Speed: {velocityLeftDisplay.toFixed(2)}</div>
            <div>Right Speed: {velocityRightDisplay.toFixed(2)}</div>
            <button onClick={handleReset} className="mt-1 bg-red-500 text-black px-2 py-0.5 rounded hover:bg-red-600">Reset</button>
          </div>
        )}
      </div>
    </div>
  );
}
