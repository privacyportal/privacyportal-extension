<script>
  import browser from 'webextension-polyfill';
  import GridContainer from './lib/components/common/GridContainer.svelte';
  import Button from './lib/components/common/Button.svelte';
  import Logo from './lib/components/svg/Logo.svelte';
  import BackIcon from './lib/components/materialIcons/BackIcon.svelte';
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
  let showSignInWithApiKey = false;

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

<FlexContainer column gap="0.2rem" padding="0px 0px 0.2rem 0px">
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
      {:else if !showSignInWithApiKey}
        <FlexContainer column align_items="center" relative>
          <Button height="auto" on:click={signIn} padding="0.3rem 0.5rem" disabled={loading} primary rounded><small>Sign In</small></Button>
          {#if !!browser?.identity?.launchWebAuthFlow}
            <a
              on:click|preventDefault={() => {
                showSignInWithApiKey = true;
              }}
              href="/#"
              class="text-color"
              style="position: absolute; top: calc(100% - 0.3rem);"><span class="xs oneline">use api key</span></a
            >
          {/if}
        </FlexContainer>
      {/if}
    </div>
  </GridContainer>

  {#if !$session?.key && showSignInWithApiKey}
    <FlexContainer width="calc(100% - 1rem)" column align_items="flex-start" bgColor="var(--new-layer-color)" margin="0px 0.5rem 0.5rem 0.5rem" padding="0.5rem" gap="0.5rem" rounded>
      <Button
        height="auto"
        align_items="center"
        on:click={() => {
          showSignInWithApiKey = false;
        }}
        padding="0px"
        margin="0px"
        gap="0.1rem"
        blendin
        nohover><BackIcon dimension="15px" /><span class="xs">back to Sign In</span></Button
      >
      <ApiKeyAuthentication onSuccess={() => (showSignInWithApiKey = false)} />
    </FlexContainer>
  {/if}
</FlexContainer>

<style>
  .flexend {
    justify-self: flex-end;
  }
</style>
