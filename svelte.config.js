import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		vite: {
			server: {
				proxy: {
					// '/api': {
					// 	target: 'http://localhost:3001',
					// 	changeOrigin: true,
					// 	rewrite: (path) => path.replace(/^\/api/, '')
					// },
					'/socket.io': {
						target: 'ws://localhost:3001',
						ws: true,
					},
				},
			},
		},
	}
};

export default config;
