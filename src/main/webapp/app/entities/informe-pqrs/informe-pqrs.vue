<template>
  <div class="container mt-4">
    <h2>Informe de PQRS</h2>

    <!-- Filtros -->
    <div class="row mb-3">
      <div class="col-md-3">
        <label>Fecha desde</label>
        <input type="date" class="form-control" v-model="fechaInicio" />
      </div>

      <div class="col-md-3">
        <label>Fecha hasta</label>
        <input type="date" class="form-control" v-model="fechaFin" />
      </div>

      <div class="col-md-3">
        <label>Tipo de Informe</label>
        <select class="form-control" v-model="tipoInforme">
          <option value="general">General</option>
          <option value="detallado">Detallado</option>
          <option value="resumen">Resumen</option>
        </select>
      </div>
    </div>

    <!-- Botón Consultar -->
    <div class="row mb-3">
      <div class="col-md-3 d-flex align-items-end">
        <button class="btn btn-primary w-100" @click="consultarInforme" :disabled="loading">
          <span v-if="loading" class="spinner-border spinner-border-sm"></span>
          {{ loading ? 'Consultando...' : 'Consultar' }}
        </button>
      </div>
    </div>

    <!-- Resultados -->
    <div v-if="informeGenerado">
      <!-- General -->
      <div v-if="!loading && tipoInforme === 'general'">
        <h4>Resultados (General)</h4>
        <table class="table table-bordered">
          <thead>
            <tr>
              <th>Estado</th>
              <th>Cantidad</th>
              <th>Porcentaje</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Recibidos</td>
              <td>{{ conteo.recibidos }}</td>
              <td>{{ porcentaje(conteo.recibidos) }}%</td>
            </tr>
            <tr>
              <td>En proceso</td>
              <td>{{ conteo.enProceso }}</td>
              <td>{{ porcentaje(conteo.enProceso) }}%</td>
            </tr>
            <tr>
              <td>Respondidos</td>
              <td>{{ conteo.respondidos }}</td>
              <td>{{ porcentaje(conteo.respondidos) }}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Detallado -->
      <div v-if="!loading && tipoInforme === 'detallado'">
        <h4>Resultados Detallados</h4>
        <div class="table-responsive">
          <table class="table table-striped table-hover">
            <thead class="table-dark">
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Asunto</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="pqrs in resultados" :key="pqrs.id">
                <td>{{ pqrs.id }}</td>
                <td>{{ formatDate(pqrs.fechaCreacion) }}</td>
                <td>
                  <span :class="`badge bg-${getEstadoBadgeClass(pqrs.estado)}`">
                    {{ pqrs.estado }}
                  </span>
                </td>
                <td>{{ pqrs.asunto }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Resumen -->
      <div v-if="!loading && tipoInforme === 'resumen'" class="alert alert-info">
        <h4>Resumen</h4>
        <p>
          Total de PQRS encontrados: <strong>{{ conteo.recibidos }}</strong>
        </p>
      </div>

      <!-- Sin resultados -->
      <div v-if="!loading && resultados.length === 0" class="alert alert-warning">
        No se encontraron resultados con los filtros aplicados.
      </div>

      <!-- Botón Generar PDF -->
      <div class="row mt-4" v-if="informeGenerado && resultados.length > 0">
        <div class="col-md-3">
          <button class="btn btn-success w-100" @click="generarInforme"><i class="bi bi-file-earmark-pdf"></i> Generar PDF</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import InformePqrs from './informe-pqrs.component';
export default InformePqrs;
</script>

<style scoped>
.table {
  margin-top: 20px;
}
.table-responsive {
  max-height: 500px;
  overflow-y: auto;
}
.spinner-border {
  margin-right: 8px;
}
.badge {
  font-size: 0.9em;
  padding: 5px 10px;
}
</style>
