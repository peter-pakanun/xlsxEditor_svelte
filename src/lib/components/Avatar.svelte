<script>
	import { goto } from '$app/navigation';
	import { session } from '$app/stores';

	export let user;
  $: user = $session?.user;
	let userMenuVisible = false;

	export async function logout() {
		userMenuVisible = false;
		const response = await fetch('/users/logout', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json'
			}
		});

		if (response.ok) {
			user = {};
			$session.user = null;
			goto('/users/login');
		}
	}
</script>

<div class="flex items-center">
	{#if user?.username}
		<div class="relative inline-block">
			<label for="showUserMenu" class="block w-16 h-16 p-2">
				<img
					class="object-cover border-2 rounded-full cursor-pointer border-sky-200/50 hover:ring-2 place-content-center"
					src={user?.avatar}
					alt={user?.username}
				/>
			</label>

			<input
				type="checkbox"
				id="showUserMenu"
				name="showUserMenu"
				class="hidden peer"
				bind:checked={userMenuVisible}
			/>
			<div
				class="absolute right-0 z-20 transition origin-top-right -translate-y-5 opacity-0 pointer-events-none peer-checked:pointer-events-auto peer-checked:opacity-100 peer-checked:translate-y-0"
			>
				<ul
					class="flex-col w-48 py-1 overflow-hidden text-gray-700 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5"
					on:click={() => (userMenuVisible = false)}
				>
					<li class="px-4 py-2 text-sm hover:bg-gray-100">
						<a class="block" href="/users/me">My Profile</a>
					</li>
					<li class="px-4 py-2 text-sm hover:bg-gray-100">
						<a class="block" href="/import">Import</a>
					</li>
					<li class="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100" on:click={logout}>
						Logout
					</li>
				</ul>
			</div>
			<label
				for="showUserMenu"
				class="fixed top-0 left-0 z-10 w-full h-full transition bg-black opacity-0 cursor-pointer pointer-events-none peer-checked:opacity-20 peer-checked:pointer-events-auto"
			/>
		</div>
	{:else}
		<a href="/users/login">Sign in</a>
	{/if}
</div>
