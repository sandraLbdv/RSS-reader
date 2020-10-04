import 'bootstrap';
import './scss/app.scss';

import * as yup from 'yup';
import axios from 'axios';
import i18next from 'i18next';
import uniqueId from 'lodash.uniqueid';

import resources from './locales';
import watch from './watchers';

const getPostsDiff = (oldPosts, newPosts) => {
  const oldPostsLinks = [...oldPosts].map(({ post }) => post.querySelector('link').textContent);
  const diff = [...newPosts].filter((post) => {
    const postLink = post.querySelector('link').textContent;
    if (oldPostsLinks.includes(postLink)) {
      return false;
    }
    return true;
  });

  return diff;
};

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

const isDoubleAdded = (sources, title) => {
  const sourcesFiltered = sources.filter((source) => source.title === title);

  if (sourcesFiltered.length !== 0) {
    return true;
  }
  return false;
};

const parse = (data) => {
  const parser = new DOMParser();
  const dataParsed = parser.parseFromString(data, 'text/xml');
  const title = dataParsed.querySelector('title').textContent;
  const posts = dataParsed.querySelectorAll('item');

  return { title, posts };
};

const updatePosts = (state) => {
  const { watchedState, unwatchedState } = watch(elements, state);

  const { sources, posts } = unwatchedState;

  sources.forEach((source) => {
    const { id, rssUrl } = source;
    const fullUrl = getFullUrl(rssUrl);

    axios.get(fullUrl)
      .then((response) => {
        const { posts: newPosts } = parse(response.data);
        const oldPosts = posts.filter((post) => post.id === id);

        const diffPosts = getPostsDiff(oldPosts, newPosts);
        if (diffPosts.length !== 0) {
          const diffPostsWithId = [...diffPosts].map((post) => ({ id, post }));
          watchedState.posts = [...diffPostsWithId, ...unwatchedState.posts];
        }
      })
      .catch(() => {
        watchedState.form.status = 'failed';
      });
  });

  setTimeout(() => updatePosts(state), 5000);
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
            watchedState.form.valid = true;

            const fullUrl = getFullUrl(rssUrl);

            axios.get(fullUrl)
              .then((response) => {
                const { title, posts } = parse(response.data);

                if (isDoubleAdded(unwatchedState.sources, title)) {
                  watchedState.form.status = 'doubleAdded';
                  return;
                }

                watchedState.form.status = 'sending';

                const id = uniqueId('rss_');
                watchedState.sources.push({ id, title, rssUrl });

                const postsWithId = [...posts].map((post) => ({ id, post }));
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
