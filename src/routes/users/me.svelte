<script context="module">
	export async function load({ session }) {
		return {
			props: {
				user: session.user || {}
			}
		};
	}
</script>

<script>
	import Input from '$lib/components/Input.svelte';
	import Button from '$lib/components/Button.svelte';
  import Avatar from '$lib/components/Avatar.svelte';

	export let user;

  let password = '';
	let confirmPassword = '';
	let errorMessage;
  let message;
	let confirmPasswordInputRef;
  let fetching = false;

  async function changePassword() {
    if (fetching) return;
		fetching = true;

		errorMessage = null;
    message = null;
		if (password !== confirmPassword) {
			errorMessage = 'Passwords do not match';
			confirmPasswordInputRef.focus();
			fetching = false;
			return;
		}

		const response = await fetch('change-password', {
			method: 'POST',
			body: JSON.stringify({ password }),
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json'
			}
		});
		fetching = false;

		let data = await response.json().catch((err) => {
			console.error(err);
			errorMessage = err;
		});

		if (!response.ok) {
			errorMessage = data?.error || 'An unknown error occurred';
			return;
		}

    message = 'Password changed successfully';
    password = '';
    confirmPassword = '';
  }
</script>

<svelte:head>
  <title>My Profile - XLSX Editor</title>
</svelte:head>

<div class="px-6 py-2 text-white bg-indigo-900/50">
  <nav class="flex items-center justify-between h-12 px-4 mx-auto text-lg max-w-7xl">
    <div class="flex items-center gap-4">
      <a href="/" class="">SheetEditor</a>
    </div>
    <Avatar />
  </nav>
</div>

<div class="p-4 mx-auto mt-4 space-y-5 rounded shadow bg-slate-800 max-w-7xl">
	<div class="flex gap-4">
		<div class="rounded-md w-60 h-60">
			<img class="object-cover rounded-md" src={user.avatar} alt="" />
		</div>
		<div>
			<Input label="Username" bind:value={user.username} readonly></Input>
			<Input label="Language" bind:value={user.language} readonly></Input>
      <form on:submit|preventDefault={changePassword}>
        <Input label="Password" type="password" bind:value={password} on:input={() => message = ""}></Input>
        {#if password.length > 0}
          <Input label="Confirm Password" type="password" bind:value={confirmPassword} bind:inputRef={confirmPasswordInputRef} on:input={() => errorMessage = ""}></Input>
	        <Button type="submit" disabled={fetching} class="mt-2">Submit</Button>
        {/if}
        {#if errorMessage}
          <p class="text-sm font-semibold text-red-600">{errorMessage}</p>
        {/if}
        {#if message}
          <p class="text-sm font-semibold text-green-600">{message}</p>
        {/if}
      </form>
		</div>
	</div>
</div>