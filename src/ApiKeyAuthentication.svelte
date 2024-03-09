<script>
  import browser from 'webextension-polyfill';
  import Button from './lib/components/common/Button.svelte';
  import FlexContainer from './lib/components/common/FlexContainer.svelte';
  import Form from './lib/components/common/Form.svelte';
  import GridContainer from './lib/components/common/GridContainer.svelte';
  import Input from './lib/components/common/Input.svelte';
  import AnnouncementIcon from './lib/components/materialIcons/AnnouncementIcon.svelte';
  import { getApiKey } from './lib/modules/requests';

  export let onSuccess;

  let submitting = false;
  let key, secret;

  async function authenticateWithApiKeys() {
    try {
      submitting = true;
      const api_key = await getApiKey({
        api_key: { key, secret },
        notification: {
          id: 'api_auth',
          description: 'Authentication failed.'
        }
      });
      const api_key_str = JSON.stringify({ ...api_key, secret });

      // store the api key for future retrieval
      await browser.storage.local.set({ api_key: api_key_str });

      // clear fields
      key = undefined;
      secret = undefined;

      // close modal
      onSuccess();
    } finally {
      submitting = false;
    }
  }
</script>

<FlexContainer column gap="0.5rem" color="inherit">
  <Form on:submit={authenticateWithApiKeys}>
    <FlexContainer column gap="0.25rem" color="inherit">
      <Input type="text" name="key" placeholder="API Key" autocomplete="off" bind:value={key} disabled={submitting} />
      <Input type="password" name="secret" placeholder="API Secret" autocomplete="off" bind:value={secret} disabled={submitting} />
      <Button type="submit" disabled={submitting} primary rounded>Sign In</Button>
    </FlexContainer>
  </Form>
  <GridContainer template_columns="18px auto" align_items="center" color="var(--text-color)" gap="0.5rem">
    <AnnouncementIcon color="var(--icon-color)" dimension="18px" />
    <span class="note">If you do not have an API key please generate one in the Privacy Portal app under security.</span>
  </GridContainer>
</FlexContainer>
