const { withAndroidManifest } = require('expo/config-plugins');

function intent(action, scheme) {
  return {
    action: [{ $: { 'android:name': action } }],
    data: [{ $: { 'android:scheme': scheme } }],
  };
}

module.exports = function withContactQueries(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const queries = manifest.queries || [];
    queries.push({
      intent: [
        intent('android.intent.action.VIEW', 'tel'),
        intent('android.intent.action.VIEW', 'mailto'),
        intent('android.intent.action.VIEW', 'sms'),
      ],
    });
    manifest.queries = queries;
    return config;
  });
};
