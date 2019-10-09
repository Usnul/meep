import { storiesOf } from '@storybook/html';
import { action } from '@storybook/addon-actions';
import ButtonView from "./ButtonView.js";

storiesOf('ButtonView', module)
    .add('rect', () => {
        const buttonView = new ButtonView({ action: action('clicked'), name: 'Click Me' });

        buttonView.addClass('ui-button-rectangular');

        buttonView.link();

        return buttonView.el;
    });