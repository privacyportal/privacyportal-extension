<script>
  import browser from 'webextension-polyfill';
  import GridContainer from './lib/components/common/GridContainer.svelte';
  import Button from './lib/components/common/Button.svelte';
  import Logo from './lib/components/svg/Logo.svelte';
  import { session } from './lib/stores/account';
  import { storageClear } from './lib/modules/storage';
  import { deteleApiKey } from './lib/modules/requests';
  import { APP_URL } from './lib/modules/constants';
  import { safeParseJSON } from './lib/modules/util';
  import FlexContainer from './lib/components/common/FlexContainer.svelte';
  import Modal from './lib/components/common/Modal.svelte';
  import ApiKeyAuthentication from './ApiKeyAuthentication.svelte';

  let loading = false;
  let signInModalOpened = false;

  async function signIn() {
    try {
      loading = true;
      if (!!browser?.identity?.launchWebAuthFlow) {
        const response = await browser.runtime.sendMessage({ type: 'authenticate' });
        session.set(safeParseJSON(response));
      } else {
        signInModalOpened = true;
      }
    } finally {
      loading = false;
    }
  }

  async function signOut() {
    try {
      loading = true;
      await storageClear();
      await deteleApiKey({ api_key: $session });
    } finally {
      loading = false;
    }
  }
</script>

<Modal bind:open={signInModalOpened}>
  <ApiKeyAuthentication onSuccess={() => (signInModalOpened = false)} />
</Modal>

<GridContainer align_items="center" justify_items="flex-start" bgColor="var(--base-color)" color="var(--text-color)" template_columns="40px auto auto" padding="0.5rem" gap="0.5rem">
  <a href={APP_URL} target="_blank" style="height: 40px;">
    <Logo dimension="40px" color="var(--primary-color)" opacity="1" animated={loading} />
  </a>
  <FlexContainer column gap="0">
    <h4 class="no-margin">Privacy Portal</h4>
    <span class="no-margin xs">You gateway to online privacy.</span>
  </FlexContainer>

  <div class="flexend">
    {#if $session?.key}
      <Button height="auto" on:click={signOut} padding="0.3rem 0.5rem" disabled={loading} primary rounded><small>Sign Out</small></Button>
    {:else}
      <Button height="auto" on:click={signIn} padding="0.3rem 0.5rem" disabled={loading} primary rounded><small>Sign In</small></Button>
    {/if}
  </div>
</GridContainer>

<style>
  .flexend {
    justify-self: flex-end;
  }
</style>
