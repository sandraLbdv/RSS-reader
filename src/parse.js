export default (data) => {
  const parser = new DOMParser();
  const dataParsed = parser.parseFromString(data, 'text/xml');

  const parseError = dataParsed.querySelector('parsererror');
  if (parseError) {
    throw new Error('XML parse error');
  }

  const title = dataParsed.querySelector('title').textContent;

  const posts = [...dataParsed.querySelectorAll('item')]
    .map((post) => {
      const postLink = post.querySelector('link').textContent;
      const postTitle = post.querySelector('title').textContent;

      return { postLink, postTitle };
    });

  return { title, posts };
};
