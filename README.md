# Privacy Portal Extension (beta)

This is the official browser extension by Privacy Portal. When installed, users can create Privacy Addresses on any website without the need to open the [Privacy Portal](https://app.privacyportal.org) app.

The extension currently supports Firefox, Firefox on Android, and Chromium based browsers.

## Privacy

This extension does not track your online activity in any way. It does not call our severs unless an action is requested by you.

## Permissions

The following list details all the browser permissions requested by this extension.

| Permission       | Optional? | Reason                                                                                                                                           |
| ---------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| activeTab        | false     | To detect email input fields and inject generated Privacy Addresses on the active tab.                                                           |
| host_permissions | true      | To automatically detect email input fields and inject generated Privacy Addresses on the active tab without user interaction with the extension. |
| identity         | false     | To authenticate using **Sign In With Privacy Portal**.                                                                                           |
| storage          | false     | To persist session information in the browser for better user experience.                                                                        |
| notifications    | true      | To notify the user about any encountered issues.                                                                                                 |

## Installing dependencies

```bash
npm install
```

## Building

```bash
# run build (in production mode or you can create a custom .env file)
npm run build -- --mode production

# once built you can load it unpacked in chromium based browsers or firefox

# In order to test on Firefox on android (requires web-ext to be installed)
npm run start:firefox:android
```

## Committing changes

```bash
# fix code styling prior to pushing changes
npm run format
```

## OAuth - local development

The extension uses **Sign in with Privacy Portal** as OAuth provider.

To prevent app id changes on subsequent reloads, a public RSA key has been added to the manifest. This key is used by chromium based browsers to derive the app id. The public key has been generated and formatted with the following command:
`openssl rsa -in privkey.pem -pubout -outform DER | openssl base64 -A`

On Firefox, an id has been set under the browser_specific_settings field for the same purpose.
