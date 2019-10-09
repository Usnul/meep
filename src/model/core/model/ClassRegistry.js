export class ClassRegistry {
    constructor() {
        /**
         *
         * @type {Map<string, Class>}
         */
        this.classes = new Map();

        const self = this;

        this.proxy = new Proxy({}, {
            /**
             *
             * @param target
             * @param {string} p
             * @param receiver
             * @returns {Class}
             */
            get(target, p, receiver) {
                const Klass = self.classes.get(p);

                if (Klass === undefined) {
                    throw new Error(`Class '${p}' not found in the registry`);
                }

                return Klass;
            }
        });
    }

    /**
     *
     * @param {function(name:string, klass:Class)} visitor
     */
    traverse(visitor) {
        this.classes.forEach((klass, name) => visitor(name, klass));
    }


    /**
     *
     * @param {String} name
     * @returns {Class}
     */
    getClass(name) {
        return this.classes.get(name);
    }

    /**
     *
     * @param {String} name
     * @returns {boolean}
     */
    hasClass(name) {
        return this.classes.has(name);
    }

    /**
     * @template T
     * @param {String} name
     * @param {Class<T>} klass
     * @returns {boolean}
     */
    addClass(name, klass) {
        if (this.hasClass(name)) {

            if (this.getClass(name) !== klass) {
                console.error(`Class '${name}' is already registered, ignoring request. Existing class:`, this.getClass(name), ' New class:', klass);
            }

            return false;
        }

        this.classes.set(name, klass);

        return true;
    }

    initialize() {

    }
}
