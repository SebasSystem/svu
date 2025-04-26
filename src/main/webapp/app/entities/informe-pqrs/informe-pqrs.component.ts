import { defineComponent, ref, watch } from 'vue';
import PqrsService from '@/entities/pqrs/pqrs.service';
import { Pqrs } from '@/shared/model/pqrs.model';

export default defineComponent({
  name: 'InformePqrs',

  setup() {
    // Estado reactivo
    const filtroId = ref<number | null>(null);
    const fechaInicio = ref<string | null>(null);
    const fechaFin = ref<string | null>(null);
    const tipoInforme = ref<'general' | 'detallado' | 'resumen'>('general');
    const resultados = ref<Pqrs[]>([]);
    const loading = ref(false);
    const informeGenerado = ref(false);
    const conteo = ref({
      recibidos: 0,
      enProceso: 0,
      respondidos: 0,
    });

    // Servicio
    const pqrsService = new PqrsService();

    // Watchers
    watch(tipoInforme, () => {
      informeGenerado.value = false;
    });

    // Métodos
    const porcentaje = (cantidad: number): string => {
      const total = conteo.value.recibidos + conteo.value.enProceso + conteo.value.respondidos;
      return total ? ((cantidad / total) * 100).toFixed(2) : '0.00';
    };

    const formatDate = (dateString: string): string => {
      if (!dateString) return '--';
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    };

    const getEstadoBadgeClass = (estado: string): string => {
      switch (estado) {
        case 'Recibido':
          return 'info';
        case 'En Proceso':
          return 'warning';
        case 'Respondido':
          return 'success';
        default:
          return 'secondary';
      }
    };

    const consultarInforme = async (): Promise<void> => {
      loading.value = true;
      resultados.value = [];
      conteo.value = { recibidos: 0, enProceso: 0, respondidos: 0 };

      try {
        const response = await pqrsService.retrieve();
        let lista: Pqrs[] = response.data;

        if (fechaInicio.value && fechaFin.value) {
          lista = lista.filter(item => {
            const fecha = new Date(item.fechaCreacion);
            return fecha >= new Date(fechaInicio.value!) && fecha <= new Date(fechaFin.value!);
          });
        }

        switch (tipoInforme.value) {
          case 'general':
            conteo.value.recibidos = lista.filter(p => p.estado === 'Recibido').length;
            conteo.value.enProceso = lista.filter(p => p.estado === 'En Proceso').length;
            conteo.value.respondidos = lista.filter(p => p.estado === 'Respondido').length;
            resultados.value = lista;
            break;
          case 'detallado':
            resultados.value = lista;
            break;
          case 'resumen':
            conteo.value.recibidos = lista.length;
            break;
        }

        informeGenerado.value = true;
      } catch (error) {
        console.error('Error al obtener PQRS:', error);
      } finally {
        loading.value = false;
      }
    };

    const generarInforme = (): void => {
      console.log('Generando informe...', resultados.value);
      // Lógica para generar informe
    };

    return {
      // Estado
      filtroId,
      fechaInicio,
      fechaFin,
      tipoInforme,
      resultados,
      loading,
      conteo,
      informeGenerado,

      // Métodos
      consultarInforme,
      porcentaje,
      formatDate,
      getEstadoBadgeClass,
      generarInforme,
    };
  },
});
