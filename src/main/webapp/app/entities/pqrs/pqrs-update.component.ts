import { type Ref, computed, defineComponent, inject, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useVuelidate } from '@vuelidate/core';

import PqrsService from './pqrs.service';
import useDataUtils from '@/shared/data/data-utils.service';
import { useDateFormat, useValidation } from '@/shared/composables';
import { useAlertService } from '@/shared/alert/alert.service';

import OficinaService from '@/entities/oficina/oficina.service';
import { type IOficina } from '@/shared/model/oficina.model';
import { type IPqrs, Pqrs } from '@/shared/model/pqrs.model';

import ArchivoAdjuntoService from '@/entities/archivo-adjunto/archivo-adjunto.service';
import { type IArchivoAdjunto } from '@/shared/model/archivo-adjunto.model';

export default defineComponent({
  compatConfig: { MODE: 3 },
  name: 'PqrsUpdate',
  setup() {
    const pqrsService = new PqrsService();
    const alertService = useAlertService();
    const archivoAdjuntoService = new ArchivoAdjuntoService();
    const oficinaService = new OficinaService();

    const files = ref<File[]>([]);
    const fileInput = ref<HTMLInputElement | null>(null);

    const uploadedFiles = ref<IArchivoAdjunto[]>([]);
    const isUploading = ref(false);
    const errorMessage = ref<string | null>(null);
    const successMessage = ref<string | null>(null);

    const pqrs: Ref<IPqrs> = ref(new Pqrs());
    const oficinas: Ref<IOficina[]> = ref([]);
    const isSaving = ref(false);
    const currentLanguage = inject('currentLanguage', () => computed(() => navigator.language ?? 'es'), true);

    const route = useRoute();
    const router = useRouter();

    const previousState = () => router.go(-1);

    const removeFile = (index: number) => {
      files.value = files.value.filter((_, i) => i !== index);
      if (fileInput.value) {
        fileInput.value.value = '';
      }
    };

    const triggerFileInput = () => {
      if (fileInput.value) {
        fileInput.value.click();
      }
    };

    const uploadFiles = async (): Promise<number[]> => {
      const formData = new FormData();
      files.value.forEach(file => {
        formData.append('files', file);
      });

      try {
        const uploadResponse = await archivoAdjuntoService.uploadFiles(formData);
        console.log('Archivos subidos:', uploadResponse);
        return uploadResponse; // IDs de los archivos subidos
      } catch (error) {
        console.error('Error subiendo archivos:', error);
        throw error;
      }
    };

    const onFileChange = (event: Event) => {
      const input = event.target as HTMLInputElement;
      if (input.files && input.files.length > 0) {
        const newFiles = Array.from(input.files);
        files.value = [...files.value, ...newFiles];
      }
    };

    const retrievePqrs = async (pqrsId: string) => {
      try {
        const res = await pqrsService.find(pqrsId);
        res.fechaCreacion = new Date(res.fechaCreacion);
        res.fechaLimiteRespuesta = new Date(res.fechaLimiteRespuesta);

        if (res.archivosAdjuntos) {
          uploadedFiles.value = res.archivosAdjuntos;
        }

        pqrs.value = res;
      } catch (error) {
        alertService.showHttpError(error.response);
      }
    };

    if (route.params?.pqrsId) {
      retrievePqrs(route.params.pqrsId as string);
    }

    const initRelationships = () => {
      oficinaService.retrieve().then(res => {
        oficinas.value = res.data;
      });
    };

    initRelationships();

    const dataUtils = useDataUtils();
    const { t: t$ } = useI18n();
    const validations = useValidation();
    const validationRules = {
      titulo: {
        required: validations.required(t$('entity.validation.required').toString()),
      },
      descripcion: {
        required: validations.required(t$('entity.validation.required').toString()),
      },
      fechaCreacion: {
        required: validations.required(t$('entity.validation.required').toString()),
      },
      fechaLimiteRespuesta: {},
      estado: {
        required: validations.required(t$('entity.validation.required').toString()),
      },
      oficinaResponder: {},
    };
    const v$ = useVuelidate(validationRules, pqrs as any);
    v$.value.$validate();

    const save = async (): Promise<void> => {
      isSaving.value = true;
      errorMessage.value = null;
      successMessage.value = null;

      try {
        // Subir los archivos antes de guardar la PQRS
        const archivosAdjuntosIds = await uploadFiles();

        // Crear la PQRS con los IDs de los archivos adjuntos
        console.log('Archivos adjuntos IDs:', archivosAdjuntosIds);
        const pqrsDTO = {
          ...pqrs.value,
          archivosAdjuntosDTO: archivosAdjuntosIds.map(id => ({ id })), // Asociar los IDs de los archivos
        };

        let response;
        if (pqrs.value.id) {
          response = await pqrsService.update(pqrsDTO);
          alertService.showInfo(t$('ventanillaUnicaApp.pqrs.updated', { param: response.id }));
        } else {
          response = await pqrsService.create(pqrsDTO);
          alertService.showSuccess(t$('ventanillaUnicaApp.pqrs.created', { param: response.id }).toString());
        }

        // Redirigir a la página anterior
        previousState();
      } catch (error) {
        if (error.response) {
          alertService.showHttpError(error.response);
          console.error('Error guardando la PQRS:', error);
        } else {
          alertService.showError('Ocurrió un error inesperado.');
          console.error('Error inesperado guardando la PQRS', error);
        }
      } finally {
        isSaving.value = false;
      }
    };

    return {
      pqrsService,
      alertService,
      pqrs,
      previousState,
      isSaving,
      currentLanguage,
      oficinas,
      files,
      fileInput,
      uploadedFiles,
      uploadFiles,
      onFileChange,
      triggerFileInput,
      removeFile,
      isUploading,
      errorMessage,
      successMessage,
      save,
      ...dataUtils,
      v$,
      ...useDateFormat({ entityRef: pqrs }),
      t$,
    };
  },
});
