import View from "../../View.js";

export class CheckboxView extends View {
    /**
     *
     * @param {ObservedBoolean} value
     * @param {boolean} [invert=false]
     */
    constructor({ value, invert = false }) {
        super();

        this.el = document.createElement('input');
        this.el.setAttribute('type', 'checkbox');

        this.el.addEventListener('input', () => {
            let v = this.el.checked;

            if (invert) {
                v = !v;
            }

            value.set(v);
        });

        this.on.linked.add(() => {
            let v = value.getValue();

            if (invert) {
                v = !v;
            }

            this.el.checked = v;
        });

        this.bindSignal(value.onChanged, (v) => {
            if (invert) {
                v = !v;
            }

            this.el.checked = v;
        });
    }
}
