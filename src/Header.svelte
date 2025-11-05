<script>
  import browser from 'webextension-polyfill';
  import GridContainer from './lib/components/common/GridContainer.svelte';
  import Button from './lib/components/common/Button.svelte';
  import Logo from './lib/components/svg/Logo.svelte';
  import BackIcon from './lib/components/materialIcons/BackIcon.svelte';
  import { cleanupCryptoTasks, cryptoTasks, clearE2EEData, e2eeMasterKey, e2eePwdMkey, e2eeServiceKeys, loadingE2EEMasterKey, session } from './lib/stores/account';
  import { storageClear } from './lib/modules/storage';
  import { deteleApiKey } from './lib/modules/requests';
  import { APP_URL } from './lib/modules/constants';
  import { safeParseJSON } from './lib/modules/util';
  import FlexContainer from './lib/components/common/FlexContainer.svelte';
  import Modal from './lib/components/common/Modal.svelte';
  import ApiKeyAuthentication from './ApiKeyAuthentication.svelte';
  import Input from './lib/components/common/Input.svelte';
  import Form from './lib/components/common/Form.svelte';
  import { deriveWrappingKey, loadMasterKey, loadServiceKeys, storeMasterKey, unwrapMasterKeyWithPassword } from './lib/modules/e2ee/e2eeUtils';
  import { displayError } from './lib/modules/error';
  import { onDestroy } from 'svelte';
  import CryptoTasks from './lib/modules/e2ee/CryptoTasks';

  let loading = false;
  let signInModalOpened = false;
  let showSignInWithApiKey = false;
  let password;

  $: if ($session?.e2ee) {
    loadServiceKeys('mrelay');
  }

  $: if ($session?.e2ee && $e2eeServiceKeys?.acc) {
    loadMasterKey();
  }

  $: if ($session?.e2ee && $e2eeServiceKeys && $e2eeMasterKey) {
    deriveWrappingKey($e2eeServiceKeys, $e2eeMasterKey).then((wrappingKey) => {
      // initialize crypto tasks for background tasks
      cryptoTasks.set(
        new CryptoTasks({
          masterKey: $e2eeMasterKey,
          wrappingKey,
          serviceKeys: $e2eeServiceKeys
        })
      );
    });
  }

  onDestroy(() => {
    cleanupCryptoTasks();
  });

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
      // copy api key
      const api_key = $session;
      await storageClear();
      clearE2EEData();
      await deteleApiKey({ api_key });
    } finally {
      loading = false;
    }
  }

  async function handleE2EEPassword() {
    try {
      loading = true;
      const fullPwd = `${$session?.user_id || ''}.${password}`;
      const masterKey = await unwrapMasterKeyWithPassword($e2eePwdMkey, fullPwd);
      e2eeMasterKey.set(masterKey);
      storeMasterKey(masterKey);
    } catch (err) {
      console.error(err);
      displayError(err);
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
        <Button height="auto" on:click={signOut} padding="0.3rem 0.5rem" disabled={loading} primary rounded><span class="sm">Sign Out</span></Button>
      {:else if !showSignInWithApiKey}
        <FlexContainer column align_items="center" relative>
          <Button height="auto" on:click={signIn} padding="0.3rem 0.7rem" disabled={loading} primary rounded><span class="sm">Sign In</span></Button>
          {#if !!browser?.identity?.launchWebAuthFlow}
            <a
              on:click|preventDefault={() => {
                showSignInWithApiKey = true;
              }}
              href="/#"
              class="text-color api-key-link"><span class="xs oneline">use api key</span></a
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

  {#if $session?.e2ee && !$e2eeMasterKey}
    {#if $loadingE2EEMasterKey || !$e2eePwdMkey}
      <FlexContainer padding="0px 0.5rem" color="inherit">
        <span class="sm">Loading...</span>
      </FlexContainer>
    {:else}
      <Form on:submit={handleE2EEPassword}>
        <FlexContainer column padding="0px 0.5rem" gap="0.35rem" color="inherit">
          <Input type="password" name="pwd" placeholder="E2EE Password" autocomplete="off" required bind:value={password} disabled={loading} />
          <Button type="submit" disabled={loading} primary rounded>Unlock Account</Button>
        </FlexContainer>
      </Form>
    {/if}
  {/if}
</FlexContainer>

<style>
  .flexend {
    justify-self: flex-end;
  }

  a.api-key-link {
    position: absolute;
    top: 100%;
    align-items: flex-start;
    padding: 0.15rem 0px 0px 0px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
</style>
