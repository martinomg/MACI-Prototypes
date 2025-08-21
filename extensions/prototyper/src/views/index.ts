import { defineModule } from '@directus/extensions-sdk';
import ModuleComponent from './script-composer.vue';

const config = {
	id: 'script-composer',
	name: 'Script Composer',
	icon: 'box',
	routes: [
		{
			path: '',
			component: ModuleComponent,
		},
	],
} satisfies Parameters<typeof defineModule>[0];

const module: any = defineModule(config);
export default module;
