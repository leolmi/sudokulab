export const environment = {
  production: false,
  mongoDbUri: process.env.MONGODB_URI ||
    process.env.MONGOLAB_URI ||
    process.env.MONGOHQ_URL ||
    process.env.OPENSHIFT_MONGODB_DB_URL + process.env.OPENSHIFT_APP_NAME ||
    'mongodb://localhost/sudokulab'
};
