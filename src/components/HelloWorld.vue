<script setup lang="ts">
defineProps<{
  msg: string
}>()
</script>

<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
  </div>
</template>

<style scoped>
.hello {
  padding: 2rem;
}

h1 {
  font-size: 3.2em;
  line-height: 1.1;
}
</style>
