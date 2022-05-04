export async function get({ locals }) {
  return {
    status: 200,
    body: {
      username: locals.user?.username,
      language: locals.user?.language,
      avatar: locals.user?.avatar,
    }
  };
}