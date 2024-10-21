import { type ComputedRef, defineComponent, inject, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import type LoginService from '@/account/login.service';
import { useAccountStore } from '@/shared/config/store/account-store';

export default defineComponent({
  compatConfig: { MODE: 3 },
  setup() {
    const loginService = inject<LoginService>('loginService');
    const accountStore = useAccountStore();
    const router = useRouter();

    const authenticated = inject<ComputedRef<boolean>>('authenticated');
    const username = inject<ComputedRef<string>>('currentUsername');

    const openLogin = () => {
      loginService.openLogin();
    };

    // Verificar y redirigir cuando el estado de autenticación cambie
    watch(authenticated, newValue => {
      if (newValue) {
        const userRole = loginService.getUserRole(); // Asegúrate de que este método esté implementado
        console.log('User role:', userRole); // Depuración
        if (userRole === 'ROLE_USER') {
          router.push({ name: 'OficinaUserHome' }); // Redirige a la página de usuario
        } else if (userRole === 'ROLE_ADMIN') {
          router.push({ name: 'Home' }); // Redirige a la página de admin
        }
      }
    });

    return {
      authenticated,
      username,
      openLogin,
      t$: useI18n().t,
    };
  },
});
