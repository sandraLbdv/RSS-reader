import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

import * as yup from 'yup';
import axios from 'axios';
import i18next from 'i18next';
import uniqueId from 'lodash.uniqueid';
import differenceBy from 'lodash.differenceby';

import resources from './locales';
import watch from './watchers';
import parse from './parse';

const getFullUrl = (rssUrl) => {
  const corsUrl = 'https://cors-anywhere.herokuapp.com/';
  return `${corsUrl}${rssUrl}`;
};

const updatePosts = (watchedState) => {
  const { sources, posts } = watchedState;

  const requests = sources.map((source) => {
    const { id, rssUrl } = source;
    const fullUrl = getFullUrl(rssUrl);

    return axios.get(fullUrl)
      .then((response) => {
        const { posts: newPosts } = parse(response.data);
        const oldPosts = posts.filter((post) => post.id === id);

        const diff = differenceBy(newPosts, oldPosts, 'postLink');
        if (diff.length !== 0) {
          const diffPostsWithId = [...diff].map((post) => ({ id, ...post }));
          // eslint-disable-next-line no-param-reassign
          watchedState.posts = [...diffPostsWithId, ...posts];
        }
      });
  });

  Promise.all(requests)
    .finally(() => {
      setTimeout(() => updatePosts(watchedState), 5000);
    });
};

const makeSchema = (sources) => {
  const sourcesUrls = sources.map(({ rssUrl }) => rssUrl);

  return yup.string().url().required().notOneOf(sourcesUrls);
};

export default () => {
  const elements = {
    form: document.querySelector('.rss-form'),
    input: document.querySelector('input'),
    feedback: document.querySelector('.feedback'),
    sendButton: document.querySelector('button'),
    feedsContainer: document.querySelector('.feeds'),
  };

  const state = {
    sources: [],
    posts: [],
    form: {
      status: 'filling',
      valid: true,
      validationError: null,
    },
    processError: null,
  };

  const watchedState = watch(elements, state);

  i18next.init({
    lng: 'en',
    debug: true,
    resources,
  })
    .then(() => {
      elements.form.addEventListener('submit', (event) => {
        event.preventDefault();

        const formData = new FormData(event.target);
        const rssUrl = formData.get('rssUrl');

        makeSchema(watchedState.sources).validate(rssUrl)
          .then(() => {
            watchedState.form.status = 'sending';
            watchedState.form.valid = true;
            watchedState.form.validationError = null;

            const fullUrl = getFullUrl(rssUrl);

            axios.get(fullUrl)
              .then((response) => {
                const { title, posts } = parse(response.data);

                const id = uniqueId('rss_');
                watchedState.sources.push({ id, title, rssUrl });

                const postsWithId = [...posts].map((post) => ({ id, ...post }));
                watchedState.posts = [...watchedState.posts, ...postsWithId];

                watchedState.processError = null;
                watchedState.form.status = 'submitted';
              })
              .catch((error) => {
                watchedState.form.status = 'failed';
                watchedState.processError = error.message;
              });
          })
          .catch((error) => {
            watchedState.form.valid = false;
            watchedState.form.validationError = error.type;
          });
      });
      setTimeout(() => updatePosts(watchedState), 5000);
    });
};
