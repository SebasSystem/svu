/* tslint:disable max-line-length */
import { vitest } from 'vitest';
import { type MountingOptions, shallowMount } from '@vue/test-utils';
import sinon, { type SinonStubbedInstance } from 'sinon';
import { type RouteLocation } from 'vue-router';

import dayjs from 'dayjs';
import NotificacionUpdate from './notificacion-update.vue';
import NotificacionService from './notificacion.service';
import { DATE_TIME_LONG_FORMAT } from '@/shared/composables/date-format';
import AlertService from '@/shared/alert/alert.service';

import OficinaService from '@/entities/oficina/oficina.service';

type NotificacionUpdateComponentType = InstanceType<typeof NotificacionUpdate>;

let route: Partial<RouteLocation>;
const routerGoMock = vitest.fn();

vitest.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({ go: routerGoMock }),
}));

const notificacionSample = { id: 'ABC' };

describe('Component Tests', () => {
  let mountOptions: MountingOptions<NotificacionUpdateComponentType>['global'];
  let alertService: AlertService;

  describe('Notificacion Management Update Component', () => {
    let comp: NotificacionUpdateComponentType;
    let notificacionServiceStub: SinonStubbedInstance<NotificacionService>;

    beforeEach(() => {
      route = {};
      notificacionServiceStub = sinon.createStubInstance<NotificacionService>(NotificacionService);
      notificacionServiceStub.retrieve.onFirstCall().resolves(Promise.resolve([]));

      alertService = new AlertService({
        i18n: { t: vitest.fn() } as any,
        bvToast: {
          toast: vitest.fn(),
        } as any,
      });

      mountOptions = {
        stubs: {
          'font-awesome-icon': true,
          'b-input-group': true,
          'b-input-group-prepend': true,
          'b-form-datepicker': true,
          'b-form-input': true,
        },
        provide: {
          alertService,
          notificacionService: () => notificacionServiceStub,
          oficinaService: () =>
            sinon.createStubInstance<OficinaService>(OficinaService, {
              retrieve: sinon.stub().resolves({}),
            } as any),
        },
      };
    });

    afterEach(() => {
      vitest.resetAllMocks();
    });

    describe('load', () => {
      beforeEach(() => {
        const wrapper = shallowMount(NotificacionUpdate, { global: mountOptions });
        comp = wrapper.vm;
      });
      it('Should convert date from string', () => {
        // GIVEN
        const date = new Date('2019-10-15T11:42:02Z');

        // WHEN
        const convertedDate = comp.convertDateTimeFromServer(date);

        // THEN
        expect(convertedDate).toEqual(dayjs(date).format(DATE_TIME_LONG_FORMAT));
      });

      it('Should not convert date if date is not present', () => {
        expect(comp.convertDateTimeFromServer(null)).toBeNull();
      });
    });

    describe('save', () => {
      it('Should call update service on save for existing entity', async () => {
        // GIVEN
        const wrapper = shallowMount(NotificacionUpdate, { global: mountOptions });
        comp = wrapper.vm;
        comp.notificacion = notificacionSample;
        notificacionServiceStub.update.resolves(notificacionSample);

        // WHEN
        comp.save();
        await comp.$nextTick();

        // THEN
        expect(notificacionServiceStub.update.calledWith(notificacionSample)).toBeTruthy();
        expect(comp.isSaving).toEqual(false);
      });

      it('Should call create service on save for new entity', async () => {
        // GIVEN
        const entity = {};
        notificacionServiceStub.create.resolves(entity);
        const wrapper = shallowMount(NotificacionUpdate, { global: mountOptions });
        comp = wrapper.vm;
        comp.notificacion = entity;

        // WHEN
        comp.save();
        await comp.$nextTick();

        // THEN
        expect(notificacionServiceStub.create.calledWith(entity)).toBeTruthy();
        expect(comp.isSaving).toEqual(false);
      });
    });

    describe('Before route enter', () => {
      it('Should retrieve data', async () => {
        // GIVEN
        notificacionServiceStub.find.resolves(notificacionSample);
        notificacionServiceStub.retrieve.resolves([notificacionSample]);

        // WHEN
        route = {
          params: {
            notificacionId: `${notificacionSample.id}`,
          },
        };
        const wrapper = shallowMount(NotificacionUpdate, { global: mountOptions });
        comp = wrapper.vm;
        await comp.$nextTick();

        // THEN
        expect(comp.notificacion).toMatchObject(notificacionSample);
      });
    });

    describe('Previous state', () => {
      it('Should go previous state', async () => {
        notificacionServiceStub.find.resolves(notificacionSample);
        const wrapper = shallowMount(NotificacionUpdate, { global: mountOptions });
        comp = wrapper.vm;
        await comp.$nextTick();

        comp.previousState();
        await comp.$nextTick();

        expect(routerGoMock).toHaveBeenCalledWith(-1);
      });
    });
  });
});
