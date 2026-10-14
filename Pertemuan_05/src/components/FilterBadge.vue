<script setup>
// Tombol toggle kategori. Status terpilih dikendalikan dari induk (props), bukan state internal.
defineProps({
  label: { type: String, required: true },
  aktif: { type: Boolean, default: false },
});

const emit = defineEmits(["pilih"]);

// TODO 1: pada klik, pancarkan "pilih" (induk yang memutuskan kategori terpilih)
</script>

<template>
  <!--
    TODO 2: tambahkan
      - :class="{ aktif }"
      - :aria-pressed="aktif"       (status toggle dibacakan pembaca layar)
      - @click yang memancarkan "pilih"
  -->
  <button type="button" class="badge">{{ label }}</button>
</template>

<style scoped>
.badge {
  background: #fff;
  color: var(--teks);
  border: 1px solid var(--redup);
  text-transform: capitalize;
}
.badge.aktif {
  background: var(--aksen);
  color: var(--aksen-teks);
  border-color: var(--aksen);
}
</style>
