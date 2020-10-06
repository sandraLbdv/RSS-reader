import onChange from 'on-change';
import i18next from 'i18next';

const renderFeeds = (posts, unwatchedState) => {
  const { sources } = unwatchedState;

  const html = sources.map(({ id, title }) => {
    const feedTitle = `<h2>${title}</h2>`;

    const feedPosts = posts
      .filter((post) => post.id === id)
      .map(({ postLink, postTitle }) => `<div><a target="_blank" href="${postLink}">${postTitle}</a></div>`)
      .join('\n');

    return [feedTitle, feedPosts].join('\n');
  }).join('\n');

  return html;
};

const updateFeedbackClassList = (feedbackContainer, feedbackStatus) => {
  switch (feedbackStatus) {
    case 'danger':
      feedbackContainer.classList.add('text-danger');
      feedbackContainer.classList.remove('text-success');
      break;
    case 'success':
      feedbackContainer.classList.add('text-success');
      feedbackContainer.classList.remove('text-danger');
      break;
    case 'neutral':
      feedbackContainer.classList.remove('text-success', 'text-danger');
      break;
    default:
      break;
  }
};

export default (elements, state) => {
  const {
    input, feedback, sendButton, feedsContainer,
  } = elements;

  const unwatchedState = onChange.target(state);

  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'form.valid':
        if (value === false) {
          input.classList.remove('is-valid');
          input.classList.add('is-invalid');

          feedback.textContent = i18next.t('validation.invalid');
          updateFeedbackClassList(feedback, 'neutral');
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
          updateFeedbackClassList(feedback, 'danger');

          sendButton.disabled = false;
        }
        if (value === 'submitted') {
          feedback.textContent = i18next.t('status.submitted');
          updateFeedbackClassList(feedback, 'success');

          input.value = '';
          sendButton.disabled = false;
        }
        if (value === 'failed') {
          feedback.textContent = i18next.t('status.failed');
          updateFeedbackClassList(feedback, 'danger');

          sendButton.disabled = false;
        }
        if (value === 'sending') {
          feedback.textContent = i18next.t('status.sending');
          updateFeedbackClassList(feedback, 'neutral');

          sendButton.disabled = true;
        }
        if (value === 'updateFailed') {
          feedback.textContent = i18next.t('status.updateFailed');
        }
        break;
      case 'posts':
        feedsContainer.innerHTML = renderFeeds(value, unwatchedState);
        break;
      case 'sources':
        break;
      default:
        throw new Error(`Unknown state path: '${path}'!`);
    }
  });

  return { watchedState, unwatchedState };
};
