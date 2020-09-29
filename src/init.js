import 'bootstrap';
import './scss/app.scss';

import * as yup from 'yup';
import axios from 'axios';
import i18next from 'i18next';
import _ from 'lodash';

import watch from './watchers.js';

const parse = (data) => {
  const parser = new DOMParser();
  const dataParsed = parser.parseFromString(data, 'application/xml');
  const title = dataParsed.querySelector('title').textContent;
  const items = dataParsed.querySelectorAll('item');

  return { title, items };
};

export default (() => {
  const elements = {
    form: document.querySelector('.rss-form'),
    input: document.querySelector('input'),
    feedback: document.querySelector('.feedback'),
    sendButton: document.querySelector('button'),
    feedsContainer: document.querySelector('.feeds'),
  };

  const state = {
    sources: [],
    feeds: [],
    form: {
      status: 'filling',
      error: null,
      valid: true,
      value: '',
    },
    errors: {},
  };

  const { watchedState, unwatchedState } = watch(elements, state);

  const schema = yup.string().url().required();

  // elements.form.addEventListener('input', (event) => {
  //   schema.validate(event.target.value)
  //     .then(() => {
  //       console.log('valid!');
  //       watchedState.form.valid = true;
  //     })
  //     .catch((err) => {
  //       console.log(err);
  //       console.log('INvalid!');

  //       watchedState.form.valid = false;
  //     });
  // });

  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const rssUrl = formData.get('rssUrl');

    schema.validate(rssUrl)
      .then(() => {
        console.log('valid!');
        watchedState.form.valid = true;

        const corsUrl = 'https://cors-anywhere.herokuapp.com/';
        const fullUrl = `${corsUrl}${rssUrl}`;

        axios.get(fullUrl)
          .then((response) => {
            const { title, items } = parse(response.data);

            const sourcesFiltered = unwatchedState.sources
              .filter((source) => source.title === title);

            if (sourcesFiltered.length !== 0) {
              watchedState.form.status = 'doubleAdded';
              return;
            }

            watchedState.form.status = 'sending';

            const id = _.uniqueId();
            watchedState.sources.push({ id, title });
            watchedState.feeds.push({ id, title, items });
            watchedState.form.status = 'submitted';
          })
          .catch((error) => {
            console.log(error);
            watchedState.form.status = 'failed';
          });
      })
      .catch((err) => {
        console.log(err);
        watchedState.form.valid = false;
      });
  });
});
