export const environment = {
  production: true,
  BROWSER_CORE_CHECK: true,
  backend: {
    api: "https://api.cutetix.com",
    // socketio: "https://api.cutetix.rudickamladez.cz/ws"
  },
  keycloak: {
    issuer: 'https://auth.lukasmatuska.cz/realms/cutetix',
    clientId: 'frontend-admin-angular',
    clientSecret: 'D1P30Il4TGwFLFJTwBhKaan1zANUVSCZ',
    responseType: 'code',
    scope: 'openid profile email',
    requireHttps: true,
    showDebugInformation: true,
    disableAtHashCheck: true
  }
};
