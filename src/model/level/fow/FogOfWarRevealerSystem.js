import { System } from "../../engine/ecs/System.js";
import { FogOfWarRevealer } from "./FogOfWarRevealer.js";
import { SignalBinding } from "../../core/events/signal/SignalBinding.js";
import { FogOfWar } from "./FogOfWar.js";
import Transform from "../../engine/ecs/components/Transform.js";
import Vector2 from "../../core/geom/Vector2.js";
import { obtainTerrain } from "../terrain/ecs/Terrain.js";
import Team from "../../engine/ecs/team/Team.js";

const v2 = new Vector2();

export class FogOfWarRevealerSystem extends System {
    constructor(team) {
        super();

        this.componentClass = FogOfWarRevealer;

        this.dependencies.push(Transform);
        this.dependencies.push(Team);

        this.data = [];

        this.team = team;
    }

    /**
     *
     * @param {FogOfWarRevealer} revealer
     * @param {Transform} transform
     * @param {Team} team
     * @param entity
     */
    link(revealer, transform, team, entity) {
        const em = this.entityManager;

        const visibilityTeam = this.team;

        const position = transform.position;


        function update() {
            const dataset = em.dataset;


            if (dataset !== null) {
                const terrain = obtainTerrain(dataset);

                if (terrain !== null) {

                    terrain.mapPointWorld2Grid(position, v2);

                    dataset.traverseComponents(FogOfWar, function (fow) {
                        fow.reveal(v2.x, v2.y, revealer.radius.getValue());
                    });

                }
            }
        }

        const signalBindings = [];

        const positionWatcher = new SignalBinding(position.onChanged, update);
        signalBindings.push(positionWatcher);


        function attemptToWatch(team) {
            if (team === visibilityTeam) {
                positionWatcher.link();
                update();
            } else {
                positionWatcher.unlink();
            }
        }

        attemptToWatch(team.getValue());

        const teamWatcher = new SignalBinding(team.onChanged, attemptToWatch);
        signalBindings.push(teamWatcher);

        teamWatcher.link();

        const radiusWatcher = new SignalBinding(revealer.radius.onChanged, update);

        signalBindings.push(radiusWatcher);

        radiusWatcher.link();

        this.data[entity] = signalBindings;
    }

    forceUpdate() {
        const dataset = this.entityManager.dataset;

        if (dataset !== null) {

            const terrain = obtainTerrain(dataset);

            /**
             *
             * @type {FogOfWar[]}
             */
            const fows = [];

            dataset.traverseComponents(FogOfWar, function (fow) {
                fows.push(fow);
            });

            dataset.traverseEntities([FogOfWarRevealer, Transform, Team], (revealer, transform, team) => {
                if (team.getValue() !== this.team) {
                    // wrong team
                    return;
                }

                const position = transform.position;

                if (terrain !== null) {

                    terrain.mapPointWorld2Grid(position, v2);

                    fows.forEach(function (fow) {
                        fow.reveal(v2.x, v2.y, revealer.radius.getValue());
                    });
                }
            });
        }
    }

    unlink(revealer, position, team, entity) {
        const bindings = this.data[entity];

        bindings.forEach(b => b.unlink());

        delete this.data[entity];
    }
}
