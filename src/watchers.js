import onChange from 'on-change';
import i18next from 'i18next';

const getPosts = (feeds) => {
  const html = feeds.map((feed) => {
    const title = `<h2>${feed.title}</h2>`;
    const posts = [...feed.items].map((item) => {
      const itemLink = item.querySelector('link').textContent;
      const itemTitle = item.querySelector('title').textContent;
      return `<div><a href="${itemLink}">${itemTitle}</a></div>`;
    }).join('\n');
    return [title, posts].join('\n');
  }).join('\n');
  return html;
};

export default (elements, state) => {
  const {
    input, feedback, sendButton, feedsContainer,
  } = elements;

  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'form.valid':
        if (value === false) {
          input.classList.remove('is-valid');
          input.classList.add('is-invalid');
          feedback.textContent = i18next.t('validation.invalid');
        }
        if (value === true) {
          input.classList.remove('is-invalid');
          input.classList.add('is-valid');
          feedback.textContent = '';
        }
        break;
      case 'form.status':
        if (value === 'doubleAdded') {
          feedback.textContent = i18next.t('status.doubleAdded');
        }
        if (value === 'submitted') {
          feedback.textContent = i18next.t('status.submitted');
          input.value = '';
          sendButton.disabled = false;
        }
        if (value === 'failed') {
          feedback.textContent = i18next.t('status.failed');
        }
        if (value === 'sending') {
          feedback.textContent = i18next.t('status.sending');
          sendButton.disabled = true;
        }
        break;
      case 'feeds':
        feedsContainer.innerHTML = getPosts(value);
        break;
      default:
        break;
    }
  });

  const unwatchedState = onChange.target(state);

  return { watchedState, unwatchedState };
};
