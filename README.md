# meep
Entity Component System game engine

Currently no distributable package exists (TBD) if you want to use the engine, easiest way is to clone the repository and start building on top of it.


# Features:
* Centralized asset management system (see `AssetManager`)
* Scene construct, allowing you to split your game into logical scenes and switch between them. For example your main menu would be one scene, your game world would be another scene and your end-game screen would be a third scene.
* Fully dynamic and customizable ECS engine. You can add/remove entities, system and even swap dataset on the fly without having to re-start the engine.
* Simple and powerful event system for communicating between components and the rest of your game
* Custom serialization framework
    * Extensible - you can easily add serializers for your own components
    * Fast - framework avoids creating unnecessary gatbage and uses trivial amount of memory 
    * Compact - entire world my turn-based strategy game takes up 407 kilobytes, that's evey object in the game with over 15000 entities each with their own components
    * Support for format change. When you decide to change format - you usually break backwards compatibility, in this framework you can provide a small `Upgrader` unit to _teach_ the framework how to upgrade old data to new format, the framework will figure out the shortest `Upgrader` chain to upgrade data of version X to current version Y. This upgrade is done completely transparently to the user. 
* Thread engine.
    * Fully features Task and Thread engine, allowing you to define long-running functions as tasks instead, so you don't have to lock-up the main JS thread. The Thread engine will run tasks in short bursts that you can specify. For example: do work for 10ms, sleep for 5ms.
    * Specify dependencies between tasks
    * Support for task groups
    * Monitor progress of tasks
    * Because tasks are not running in a worker or in some other special execution context - you can exchange data between your main application and tasks freely without any _gotcha_ moments.
* Terrain engine
    * uses height-map images (grey-scale)
    * Terrain is built in a WebWorker in tiles, only visible tiles are built so the size of the terrain has very little impact on the load times
    * Only visible terrain tiles are being rendered, so run-time performance is independent of the terrain size
    * Automatically built ambient occlusion map
    * Ray-casting API
* Particle Engine
    * soft particles
    * efficient particle sorting
    * resource-efficient implementation with automatic image atlas generation, so no matter how many particles you use - only 1 texture is loaded into memory, ensure there are no texture switches during particle rendering
    * Culling. Particle emitter volumes are tracked in real-time and only visible volumes are being rendered and simulated, this ensures great performance.
    * Parameter curves. Most engines allow 1,2 or 3 values to be set for how a particle parameter (size, opacity, color etc.) evolves over time, our engine gives you full control with linear curves
* AI library
    * MCTS implementation, you can build your own rules on top of this for pretty much any game and AI will learn how to play it. This is the same technology that AlphaGo and AlphaStart of google is built on.
    * Behavior tree implementation. You have basic building blocks to construct your own trees. Sequences, Conditions, Parallels etc.
    * Optimization engine, provide a problem statement and steps definition and the engine will optimize it using randomized hill-climbing algorithm
    * Efficient Grid-based A* path-finding
* Time control
    * Engine runs a temporal simulation, you have full control over the speed at which time flows. You can slow it down or speed it up.
* UI framework
    * You have basic `GUIElement` component, as well as advanced `HeadsUpDisplay` component and more to implement 3-D aware UI efficiently
    * GUI engine is available out of the box for doing simple dialogs and notifications (see `GUIEngine` or `engine.gui`)
* Built-in editor. The editor is built into the engine and is implemented using the engine itself. In development mode editor is accessible via `Num-Lock` key
* Fog of War
    * Animated fading
    * Visibility query API
    * Fully 3-d, not just a plane overlayed on top of the world
    * Revealer (`FogOfWarRevealer`) API, using circles
        * support for moving revealers
* Trails
    * Implementation of 3D trails
* Sound engine
    * `SoundListener`s
    * `SoundEmitter`s
    * `SoundController`s
        * specify events for starting/stopping tracks for a `SoundEmitter`
* Animation engine for Mesh animation, animations are suspended automatically when not visible and fast-forwarded when they come into view again, ensuring correct behavior while allowing you to have huge number of animated objects in a single level

# Why another engine?
I set out to write this engine when I was working on a simple tower-defense game in 2013, back then there were no decent 3-d game engines that would satisfy my requires:
* fast
* robust
* 3d

Since then I have made a 2-d collectable game, a space-invader clone and most recently, a turn-based strategy game Might is Right, on which I have worked for the past 4 years.
This is how the engine was created, as a tool to help me build my games. Over time, I started to think that other people might find it useful too.

#To run the demo:
* clone repository
* run `npm install`
* run `npm run "start:dev"`
* open browser and navigate to `localhost:9000`


### Trouble shooting
* If you're having trouble running 'start : dev' command, make sure you have `webpack-dev-server` npm package installed globally
