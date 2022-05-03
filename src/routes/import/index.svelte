<script context="module">
  export async function load({ session }) {
    if (!session?.user) {
      return {
        status: 302,
        redirect: '/users/login?redirect=%2Fimport'
      };
    }
    return {
      props: {
        user: session.user
      }
    };
  }
</script>

<script>
	import { read, utils } from 'xlsx';
	import Button from '$lib/components/Button.svelte';
	import FileInput from '$lib/components/FileInput.svelte';

  // export let user;

</script>