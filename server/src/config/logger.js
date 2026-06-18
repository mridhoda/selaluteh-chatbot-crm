import morgan from 'morgan';

export function httpLogger() {
  return morgan('dev');
}
