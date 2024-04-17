<script>
  import browser from 'webextension-polyfill';
  import FlexContainer from './lib/components/common/FlexContainer.svelte';
  import GridContainer from './lib/components/common/GridContainer.svelte';
  import { HOMEPAGE_URL } from './lib/modules/constants';
</script>

<GridContainer align_items="flex-end" template_columns="1fr auto" color="var(--text-color)" padding="0.3rem 0px 0px 0px" gap="0.5rem">
  <FlexContainer align_items="stretch" gap="0.5rem">
    <a href={HOMEPAGE_URL} target="_blank">
      <span class="xxs no-margin">Website</span>
    </a>
    <a href={`${HOMEPAGE_URL}/support`} target="_blank">
      <span class="xxs no-margin">Support</span>
    </a>
    <a href={`${HOMEPAGE_URL}/privacy`} target="_blank">
      <span class="xxs no-margin">Privacy</span>
    </a>
  </FlexContainer>
  <FlexContainer align_items="stretch" justify_content="flex-end">
    <span class="xxs no-margin flex-end">version {browser.runtime.getManifest().version}</span>
  </FlexContainer>
</GridContainer>

<style>
  a {
    color: inherit;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
</style>
