<script>
  export let padding = '1rem';
  export let minWidth = 'auto';
  export let maxWidth = '95vw';
  export let open = false;

  let element;
  $: element && (open ? element.showModal() : element.close());

  /** @param {MouseEvent} e */
  const handleOutsideclick = (e) => {
    const rect = element.getBoundingClientRect();
    if (e.clientY < rect.top || e.clientY > rect.bottom || e.clientX < rect.left || e.clientX > rect.right) {
      open = false;
    }
  };
</script>

<dialog bind:this={element} on:click|stopPropagation={handleOutsideclick} style:--min-width={minWidth} style:--max-width={maxWidth} style:--padding={padding}>
  <slot />
</dialog>

<style>
  dialog {
    max-height: 80vh;
    min-width: min(var(--min-width), 95vw);
    max-width: min(var(--max-width), 95vw);
    border: none !important;
    border-radius: 5px;
    box-shadow:
      0 0 #0000,
      0 0 #0000,
      0 25px 50px -12px rgba(0, 0, 0, 0.25);
    padding: var(--padding);
    color: var(--text-color);
    background-color: var(--base-color);
  }
</style>
