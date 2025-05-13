import {ref, onMounted, createApp} from 'vue';
import ErrorToast from '@/components/ErrorToast.vue';

let instance = null;

export function useErrorToast() {
    if (!instance) {
        const container = document.createElement('div');
        document.body.appendChild(container);

        const app = createApp(ErrorToast);
        instance = app.mount(container);
    }

    return {
        show(message) {
            instance.show(message);
        },
    };
}
