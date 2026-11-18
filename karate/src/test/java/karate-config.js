function fn() {
  var config = {};
  config.baseUrl = karate.properties['api.baseUrl']
    || java.lang.System.getenv('API_BASE_URL')
    || 'http://localhost:3000/api';
  return config;
}
