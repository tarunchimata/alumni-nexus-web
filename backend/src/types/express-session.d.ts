import 'express-session';
import { RegistrationSession } from '../middleware/sessionAuth';

declare module 'express-session' {
  interface SessionData {
    registration?: RegistrationSession;
  }
}