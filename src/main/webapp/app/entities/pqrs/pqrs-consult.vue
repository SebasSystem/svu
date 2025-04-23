<template>
  <div class="container py-4">
    <h2 class="mb-4">
      <font-awesome-icon icon="arrow-left" class="me-2" />
      Consultar PQRS
    </h2>

    <div class="mb-4">
      <label for="pqrs-id" class="form-label">Ingrese el código de la PQRS</label>
      <div class="input-group">
        <input v-model="pqrsId" type="text" class="form-control" id="pqrs-id" placeholder="Ej: 67e0800ce6889b0590c50a0a" />
        <button class="btn btn-primary" @click="consultarPqrs" :disabled="loading">
          <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
          Buscar
        </button>
      </div>
      <div v-if="error" class="text-danger mt-2">{{ error }}</div>
    </div>

    <div v-if="pqrs" class="card">
      <div class="card-header bg-light fw-bold">
        {{ pqrs.titulo }}
      </div>
      <div class="card-body">
        <p><strong>Descripción:</strong> {{ pqrs.descripcion }}</p>
        <p><strong>Fecha de creación:</strong> {{ formatDate(pqrs.fechaCreacion) }}</p>
        <p><strong>Estado:</strong> {{ pqrs.estado }}</p>
        <p><strong>Oficina que responde:</strong> {{ pqrs.oficinaResponder?.nombre }}</p>

        <div v-if="pqrs.archivosAdjuntosDTO.length">
          <h5 class="mt-4">Archivos adjuntos</h5>
          <ul class="list-group">
            <li
              v-for="archivo in pqrs.archivosAdjuntosDTO"
              :key="archivo.id"
              class="list-group-item d-flex justify-content-between align-items-center"
            >
              {{ archivo.nombre }}
              <a :href="`/${archivo.urlArchivo}`" class="btn btn-sm btn-outline-secondary" download>
                <font-awesome-icon icon="download" class="me-1" />
                Descargar
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
input::placeholder {
  color: #bbb;
}
</style>

<script lang="ts" src="./pqrs-consult.component.ts"></script>
