import onChange from 'on-change';
import i18next from 'i18next';

const renderFeeds = (posts, state) => {
  const { sources } = state;

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

const handleFormStatus = (status, elements) => {
  const { input, feedback, sendButton } = elements;

  switch (status) {
    case 'submitted':
      feedback.textContent = i18next.t('status.submitted');
      updateFeedbackClassList(feedback, 'success');
      input.value = '';
      sendButton.disabled = false;
      break;

    case 'failed':
      updateFeedbackClassList(feedback, 'danger');
      sendButton.disabled = false;
      break;

    case 'sending':
      feedback.textContent = i18next.t('status.sending');
      updateFeedbackClassList(feedback, 'neutral');
      sendButton.disabled = true;
      break;

    default:
      throw new Error(`Unknown status: '${status}'!`);
  }
};

export default (elements, state) => {
  const {
    input, feedback, feedsContainer,
  } = elements;

  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'form.valid':
        if (value === false) {
          input.classList.remove('is-valid');
          input.classList.add('is-invalid');

          updateFeedbackClassList(feedback, 'danger');
        } else {
          input.classList.remove('is-invalid');
          input.classList.add('is-valid');
          feedback.textContent = '';
        }
        break;
      case 'form.status':
        handleFormStatus(value, elements);
        break;
      case 'posts':
        feedsContainer.innerHTML = renderFeeds(value, state);
        break;
      case 'sources':
        break;
      case 'form.validationError':
        if (value === null) {
          break;
        }
        feedback.innerHTML = i18next.t(`validation.error.${value}`);
        break;
      case 'processError':
        if (value === null) {
          break;
        }
        feedback.innerHTML = i18next.t(`status.error.${value}`);
        break;
      default:
        throw new Error(`Unknown state path: '${path}'!`);
    }
  });

  return watchedState;
};
