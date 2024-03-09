<script>
  import { onMount } from 'svelte';
  import browser from 'webextension-polyfill';
  import { loadSession, session } from './lib/stores/account';
  import Header from './Header.svelte';
  import FlexContainer from './lib/components/common/FlexContainer.svelte';
  import { isDarkBrowserColorScheme } from './lib/stores/nav';
  import GridContainer from './lib/components/common/GridContainer.svelte';
  import AnnouncementIcon from './lib/components/materialIcons/AnnouncementIcon.svelte';
  import { HOMEPAGE_URL } from './lib/modules/constants';
  import Button from './lib/components/common/Button.svelte';

  const ALL_URLS_ORIGINS = '<all_urls>';

  let hasAccessToOrigins;

  function detectBrowserColorScheme() {
    isDarkBrowserColorScheme.set(window.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  async function hasAccessToAllOrigins() {
    hasAccessToOrigins = await browser.permissions.contains({ origins: [ALL_URLS_ORIGINS] });
  }

  async function requestAccessToAllOrigins() {
    await browser.permissions.request({ origins: [ALL_URLS_ORIGINS] });
  }

  async function listenToAccessToAllOriginsChanges() {
    await browser.permissions.onAdded.addListener((permissions) => {
      hasAccessToOrigins = permissions.origins.includes(ALL_URLS_ORIGINS);
    });

    await browser.permissions.onRemoved.addListener((permissions) => {
      hasAccessToOrigins = permissions.origins.includes(ALL_URLS_ORIGINS);
    });
  }

  onMount(async () => {
    await Promise.all([detectBrowserColorScheme(), loadSession(), hasAccessToAllOrigins(), listenToAccessToAllOriginsChanges()]);
  });
</script>

<svelte:head>
  {#if $isDarkBrowserColorScheme}
    <style>
      body {
        background-color: var(--dark-base-color) !important;
      }
    </style>
  {/if}
</svelte:head>

<div id="body" class:dark-mode={$isDarkBrowserColorScheme}>
  <FlexContainer column>
    <Header />

    <div class="gridline" />
    <FlexContainer column padding="0.5rem" gap="0.5rem">
      {#if $session?.key}
        <GridContainer template_columns="18px auto" align_items="center" color="var(--text-color)" gap="0.5rem">
          <AnnouncementIcon color="var(--icon-color)" dimension="18px" />
          <span class="note">Type the <strong>@</strong> symbol in any email input field to generate a new Privacy Address.</span>
        </GridContainer>
      {/if}
      {#if hasAccessToOrigins === false}
        <Button height="auto" on:click={requestAccessToAllOrigins} margin="0.5rem 0 0 0" padding="0.3rem" border rounded>
          <FlexContainer column gap="0.1rem">
            <h5 class="no-margin">Grant Access To All Websites</h5>
            <span class="xs no-margin">needed to detect email fields on pages</span>
          </FlexContainer>
        </Button>
      {/if}
      <GridContainer align_items="center" template_columns="1fr auto" color="var(--text-color)" gap="0.5rem">
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
    </FlexContainer>
  </FlexContainer>
</div>

<style>
  a {
    color: inherit;
  }
</style>
