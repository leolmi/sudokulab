export const environment = {
  production: true,
  skipSchemaCheck: false,
  debug: !!process.env.SUDOKULAB_DEBUG,
  managementKey: process.env.SUDOKULAB_MANAGEMENT_KEY,
  google: {
    mail: process.env.GOOGLE_MAIL || '',
    clientID: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'xxx',
    callbackURL: process.env.GOOGLE_CLIENT_CALLBACK || ''
  },
  mongoDbUri: process.env.MONGODB_URI ||
    process.env.MONGOLAB_URI ||
    process.env.MONGOHQ_URL ||
    process.env.OPENSHIFT_MONGODB_DB_URL + process.env.OPENSHIFT_APP_NAME ||
    process.env.SUDOKULAB_MONGODB_URL ||
    'mongodb://localhost/sudokulab'
};
