import subject from './RequestStatusSubject.js';
import AuditObserver from './AuditObserver.js';
import AlertDraftObserver from './AlertDraftObserver.js';

/** Called once at boot. Attach new observers here; nothing else changes. */
export const registerObservers = () => {
  subject.attach(new AuditObserver());
  subject.attach(new AlertDraftObserver());
  console.log(`[observer] ${subject.observerCount} observers attached to request status subject`);
};

export { default as requestStatusSubject } from './RequestStatusSubject.js';
