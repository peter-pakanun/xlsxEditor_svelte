export async function get({ locals }) {
  return {
    status: 200,
    body: {
      username: locals.user?.username,
      avatar: locals.user?.avatar,
    }
  };
}