<script>
	import Input from '$lib/components/Input.svelte';
	import Button from '$lib/components/Button.svelte';
	import { goto } from '$app/navigation';
	import { session } from '$app/stores';

	let username = '';
	let password = '';
	let confirmPassword = '';
	let errorMessage;
	let confirmPasswordInputRef;
	let fetching = false;

	async function submit() {
		if (fetching) return;
		fetching = true;

		errorMessage = null;
		if (password !== confirmPassword) {
			errorMessage = 'Passwords do not match';
			confirmPasswordInputRef.focus();
			fetching = false;
			return;
		}

		const response = await fetch('', {
			method: 'POST',
			body: JSON.stringify({ username, password }),
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json'
			}
		});

		let data = await response.json().catch((err) => {
			console.error(err);
			errorMessage = err;
		});

		if (!response.ok) {
			errorMessage = data?.error || 'An unknown error occurred';
			fetching = false;
			return;
		}

		$session.user = data.user;
		goto('/');
	}
</script>

<svelte:head>
	<title>Register</title>
</svelte:head>

<form on:submit|preventDefault={submit} class="p-4 mx-auto mt-4 space-y-5 rounded shadow bg-gray-50 max-w-7xl">
	<h1>Register</h1>
	<Input
		label="Username"
		id="username"
		name="username"
		type="text"
		placeholder="Username"
		bind:value={username}
		required
		autofocus
	/>
	<Input
		label="Password"
		id="password"
		name="password"
		type="password"
		placeholder="Password"
		bind:value={password}
		required
	/>
	<Input
		label="Confirm Password"
		id="confirm-password"
		name="confirm-password"
		type="password"
		placeholder="Confirm Password"
		bind:value={confirmPassword}
		bind:inputRef={confirmPasswordInputRef}
		required
	/>
	{#if errorMessage}
		<p class="text-sm font-semibold text-red-600">{errorMessage}</p>
	{/if}
	<Button type="submit" disabled={fetching}>Submit</Button>
</form>