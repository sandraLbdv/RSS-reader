import 'bootstrap';
import './scss/app.scss';

import * as yup from 'yup';
import axios from 'axios';

import watch from './watchers.js';

export default (() => {
  console.log(`it works!`);

  const state = {
    form: {
      status: 'filling',
      valid: false,
    },
  };

  const schema = yup.string().url().required();

  const elements = {
    form: document.querySelector('.rss-form'),
    input: document.querySelector('input'),
  };
  console.log(elements.form);

  elements.form.addEventListener('input', () => {
    schema.validate(state)
      .then(watch(elements, state).form.valid = true)
      .catch((err) => {
        console.log(err);
        watch(elements, state).form.valid = false;
      });
  });
  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();
    watch(elements, state).form.processState = 'sending';
  });
});