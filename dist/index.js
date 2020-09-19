import 'bootstrap';
import './scss/app.scss';
import * as yup from 'yup';
import onChange from 'on-change';
import axios from 'axios';
export default (() => {
  console.log(`it works!`);
  const state = {
    form: {
      status: 'filling',
      valid: false
    }
  };
  const watchedState = onChange(state, (path, value) => {});
  const schema = yup.string().url();
  const elements = {
    form: document.querySelector('.rss-form')
  };
  elements.form.addEventListener('input', () => {
    schema.validate(state).then(watchedState.form.valid = true).catch(err => {
      console.log(err);
      watchedState.form.valid = false;
    });
  });
  elements.form.addEventListener('submit', event => {
    event.preventDefault();
    watchedState.form.processState = 'sending';
  });
});