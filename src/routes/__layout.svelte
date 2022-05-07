<script context="module">
  export async function load({ session }) {
    return {
      props: {
        user: session.user || {},
      }
    };
  }
</script>

<script>
  import "../app.css";
  import Avatar from '$lib/components/Avatar.svelte';
</script>

<div class="px-6 py-2 text-white bg-indigo-900/50">
  <nav class="flex items-center justify-between h-12 px-4 mx-auto text-lg max-w-7xl">
    <div class="flex items-center gap-4">
      <a href="/" class="">SheetEditor</a>
    </div>
    <Avatar />
  </nav>
</div>

<slot />