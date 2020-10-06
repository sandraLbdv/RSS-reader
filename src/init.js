import 'bootstrap';
import './scss/app.scss';

import * as yup from 'yup';
import axios from 'axios';
import i18next from 'i18next';
import uniqueId from 'lodash.uniqueid';
import differenceBy from 'lodash.differenceby';

import resources from './locales';
import watch from './watchers';
import parse from './parse';

const elements = {
  form: document.querySelector('.rss-form'),
  input: document.querySelector('input'),
  feedback: document.querySelector('.feedback'),
  sendButton: document.querySelector('button'),
  feedsContainer: document.querySelector('.feeds'),
};

const getFullUrl = (rssUrl) => {
  const corsUrl = 'https://cors-anywhere.herokuapp.com/';
  return `${corsUrl}${rssUrl}`;
};

const isDoubleAdded = (sources, rssUrl) => {
  const sameUrlSources = sources.filter((source) => source.rssUrl === rssUrl);

  if (sameUrlSources.length !== 0) {
    return true;
  }
  return false;
};

const updatePosts = (state) => {
  const { watchedState, unwatchedState } = watch(elements, state);

  const { sources, posts } = unwatchedState;

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
          watchedState.posts = [...diffPostsWithId, ...unwatchedState.posts];
        }
      });
  });

  Promise.all(requests)
    .catch(() => {
      watchedState.form.status = 'updateFailed';
    })
    .then(() => {
      setTimeout(() => updatePosts(state), 5000);
    });
};

export default () => {
  const state = {
    sources: [],
    posts: [],
    form: {
      status: 'filling',
      valid: true,
    },
  };

  const { watchedState, unwatchedState } = watch(elements, state);

  const schema = yup.string().url().required();

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

        schema.validate(rssUrl)
          .then(() => {
            if (isDoubleAdded(unwatchedState.sources, rssUrl)) {
              watchedState.form.status = 'doubleAdded';
              return;
            }

            watchedState.form.status = 'sending';
            watchedState.form.valid = true;

            const fullUrl = getFullUrl(rssUrl);

            axios.get(fullUrl)
              .then((response) => {
                const { title, posts } = parse(response.data);

                const id = uniqueId('rss_');
                watchedState.sources.push({ id, title, rssUrl });

                const postsWithId = [...posts].map((post) => ({ id, ...post }));
                watchedState.posts = [...unwatchedState.posts, ...postsWithId];

                watchedState.form.status = 'submitted';
              })
              .catch(() => {
                watchedState.form.status = 'failed';
              });
          })
          .catch(() => {
            watchedState.form.valid = false;
          });
      });
      setTimeout(() => updatePosts(state), 5000);
    });
};
