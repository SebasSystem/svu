import { computed, defineComponent, inject, ref, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useVuelidate } from '@vuelidate/core';
import { required, helpers } from '@vuelidate/validators';

import PqrsService from './pqrs.service';
import useDataUtils from '@/shared/data/data-utils.service';
import { useDateFormat, useValidation } from '@/shared/composables';
import { useAlertService } from '@/shared/alert/alert.service';

import OficinaService from '@/entities/oficina/oficina.service';
import { type IOficina } from '@/shared/model/oficina.model';
import { type IPqrs, Pqrs } from '@/shared/model/pqrs.model';

import ArchivoAdjuntoService from '@/entities/archivo-adjunto/archivo-adjunto.service';
import { type IArchivoAdjunto } from '@/shared/model/archivo-adjunto.model';
import { useStore } from '@/store';

export default defineComponent({
  name: 'PqrsUpdate',
  setup() {
    // Services
    const pqrsService = inject('pqrsService', () => new PqrsService());
    const alertService = inject('alertService', () => useAlertService(), true);
    const archivoAdjuntoService = inject('archivoAdjuntoService', () => new ArchivoAdjuntoService());
    const oficinaService = inject('oficinaService', () => new OficinaService());

    // Router y locale
    const route = useRoute();
    const router = useRouter();
    const previousState = () => router.go(-1);
    const currentLanguage = inject('currentLanguage', () => computed(() => navigator.language ?? 'es'), true);

    // Archivos y estado
    const files = ref<File[]>([]);
    const fileInput = ref<HTMLInputElement | null>(null);
    const archivosAdjuntosDTO = ref<IArchivoAdjunto[]>([]);
    const isUploading = ref(false);
    const isSaving = ref(false);
    const errorMessage = ref<string | null>(null);
    const successMessage = ref<string | null>(null);

    const pqrs: Ref<IPqrs> = ref(new Pqrs());
    const oficinas: Ref<IOficina[]> = ref([]);

    // Utilidades
    const input = ref<HTMLInputElement | null>(null);
    const dataUtils = useDataUtils();
    const { t: t$ } = useI18n();
    const validations = useValidation();
    const store = useStore();
    const isAuthenticated = computed(() => store.authenticated);

    const validationRules = {
      titulo: { required: validations.required(t$('entity.validation.required')) },
      descripcion: { required: validations.required(t$('entity.validation.required')) },
      fechaCreacion: { required: validations.required(t$('entity.validation.required')) },
      fechaLimiteRespuesta: {},
      estado: {
        required: helpers.withMessage(t$('entity.validation.required'), (value: any) => {
          // Solo valida si el usuario está autenticado
          if (!isAuthenticated.value) return true;
          return required.$validator(value, null, null);
        }),
      },
      oficinaResponder: {},
    };

    const v$ = useVuelidate(validationRules, pqrs as any);
    v$.value.$validate();

    const removeFile = (index: number) => {
      files.value.splice(index, 1);
      if (fileInput.value) fileInput.value.value = '';
    };

    const triggerFileInput = () => fileInput.value?.click();

    const onFileChange = (event: Event) => {
      const inputTarget = event.target as HTMLInputElement;
      input.value = inputTarget;
      if (inputTarget?.files?.length) {
        const newFiles = Array.from(inputTarget.files);
        files.value.push(...newFiles);
      }
    };

    const uploadFiles = async () => {
      isUploading.value = true;
      errorMessage.value = null;
      successMessage.value = null;

      const formData = new FormData();
      files.value.forEach(file => formData.append('files', file));

      try {
        const response = await archivoAdjuntoService().uploadFiles(formData);
        archivosAdjuntosDTO.value = response;
        successMessage.value = 'Archivos subidos correctamente';
      } catch (error: any) {
        errorMessage.value = 'Error al subir archivos';
        alertService.showHttpError(error.response);
        throw error;
      } finally {
        isUploading.value = false;
      }
    };

    const retrievePqrs = async (pqrsId: string) => {
      try {
        const res = await pqrsService().find(pqrsId);
        res.fechaCreacion = new Date(res.fechaCreacion);
        res.fechaLimiteRespuesta = new Date(res.fechaLimiteRespuesta);

        if (res.archivosAdjuntosDTO) {
          archivosAdjuntosDTO.value = res.archivosAdjuntosDTO;
          files.value = res.archivosAdjuntosDTO.map(v => ({ name: v.nombre }) as File);
        }

        pqrs.value = res;
      } catch (error: any) {
        alertService.showHttpError(error.response);
      }
    };

    const initRelationships = () => {
      oficinaService()
        .retrieve()
        .then(res => {
          oficinas.value = res.data;
        });
    };

    const save = async () => {
      try {
        if (isSaving.value) return;
        isSaving.value = true;

        if (files.value.length > 0) {
          await uploadFiles();
        }

        pqrs.value.archivosAdjuntosDTO = archivosAdjuntosDTO.value;

        let savedPqrs;
        if (pqrs.value.id) {
          savedPqrs = await pqrsService().update(pqrs.value);
          alertService.showInfo(t$('ventanillaUnicaApp.pqrs.updated', { param: savedPqrs.id }));
        } else {
          savedPqrs = await pqrsService().create(pqrs.value);
          alertService.showSuccess(t$('ventanillaUnicaApp.pqrs.created', { param: savedPqrs.id }).toString());
        }

        previousState();
      } catch (error: any) {
        console.error('Error guardando PQRS:', error);
        alertService.showHttpError(error.response ?? 'Ocurrió un error inesperado.');
      } finally {
        isSaving.value = false;
      }
    };

    // Carga inicial
    if (route.params?.pqrsId) {
      retrievePqrs(route.params.pqrsId as string);
    }
    initRelationships();

    return {
      pqrs,
      oficinas,
      previousState,
      isSaving,
      currentLanguage,
      files,
      fileInput,
      archivosAdjuntosDTO,
      uploadFiles,
      onFileChange,
      triggerFileInput,
      removeFile,
      isUploading,
      errorMessage,
      successMessage,
      input,
      save,
      ...dataUtils,
      v$,
      ...useDateFormat({ entityRef: pqrs }),
      t$,
      isAuthenticated,
    };
  },
});
