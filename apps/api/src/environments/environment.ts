export const environment = {
  production: false,
  google: {
    mail: process.env.GOOGLE_MAIL || 'leo.olmi@gmail.com',
    clientID: process.env.GOOGLE_CLIENT_ID || 'xxxxxxxxxxxxx',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'xxxxxxxxxxxxx',
    callbackURL: process.env.GOOGLE_CLIENT_CALLBACK || 'https://sudokulab.herokuapp.com/auth/google/callback'
  },
  mongoDbUri: process.env.MONGODB_URI ||
    process.env.MONGOLAB_URI ||
    process.env.MONGOHQ_URL ||
    process.env.OPENSHIFT_MONGODB_DB_URL + process.env.OPENSHIFT_APP_NAME ||
    'mongodb://localhost/sudokulab'
};
