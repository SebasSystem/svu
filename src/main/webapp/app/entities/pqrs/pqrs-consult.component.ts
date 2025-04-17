import { defineComponent, ref } from 'vue';
import PqrsService from './pqrs.service';
import { type IPqrs } from '@/shared/model/pqrs.model';

export default defineComponent({
  name: 'PqrsConsultComponent',
  setup() {
    const pqrsId = ref('');
    const pqrs = ref<IPqrs | null>(null);
    const error = ref('');
    const loading = ref(false);
    const pqrsService = new PqrsService();

    const consultarPqrs = async () => {
      error.value = '';
      pqrs.value = null;

      if (!pqrsId.value.trim()) {
        error.value = 'Por favor ingrese un código de PQRS.';
        return;
      }

      try {
        loading.value = true;
        pqrs.value = await pqrsService.find(pqrsId.value.trim());
      } catch (err) {
        error.value = 'No se encontró una PQRS con ese código.';
      } finally {
        loading.value = false;
      }
    };

    const formatDate = (isoDate: string) => {
      const date = new Date(isoDate);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    return {
      pqrsId,
      pqrs,
      error,
      loading,
      consultarPqrs,
      formatDate,
    };
  },
});
