import onChange from 'on-change';

export default (elements, state) => {
  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'form.valid':
        if (value === false) {
          console.log(`invalid`);
          elements.input.classList.add('is-invalid');
        }
        break;
      default:
        break;
    }
  });

  return watchedState;
};
