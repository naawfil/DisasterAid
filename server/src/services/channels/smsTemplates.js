import { REQUEST_STATUS } from '../../constants/enums.js';

const STATUS_LINES = {
  [REQUEST_STATUS.PENDING]: 'has been received and is waiting for triage',
  [REQUEST_STATUS.ASSIGNED]: 'has been assigned to a relief team',
  [REQUEST_STATUS.DISPATCHED]: 'is on the way to you now',
  [REQUEST_STATUS.DELIVERED]: 'has been delivered',
  [REQUEST_STATUS.CANCELLED]: 'was cancelled — call the helpline if this is wrong',
};

export const buildStatusMessage = (request) =>
  `DisasterAid: your request ${request.trackingCode} ${
    STATUS_LINES[request.status] || 'was updated'
  }. Track it at disasteraid.org/track`;

export const TEMPLATES = [
  {
    id: 'distribution',
    label: 'Distribution notice',
    fields: ['location', 'time', 'items'],
    build: ({ location, time, items }) =>
      `DisasterAid: aid distribution at ${location} at ${time}. Available: ${items}. Bring ID if you have one.`,
  },
  {
    id: 'shelter-open',
    label: 'Shelter opening',
    fields: ['shelter', 'address', 'capacity'],
    build: ({ shelter, address, capacity }) =>
      `DisasterAid: ${shelter} is open at ${address}. Space for ${capacity} people. Free meals and water on site.`,
  },
  {
    id: 'evacuation',
    label: 'Evacuation warning',
    fields: ['area', 'deadline', 'route'],
    build: ({ area, deadline, route }) =>
      `URGENT — DisasterAid: evacuate ${area} before ${deadline}. Use ${route}. Help elderly neighbours if you can.`,
  },
  {
    id: 'volunteer-call',
    label: 'Volunteer call-out',
    fields: ['location', 'time', 'skills' ],
    build: ({ location, time, skills }) =>
      `DisasterAid: volunteers needed at ${location} from ${time}. Skills needed: ${skills}. Reply if you can come.`,
  },
];

export const buildFromTemplate = (templateId, values) => {
  const template = TEMPLATES.find((t) => t.id === templateId);
  if (!template) return null;
  return template.build(values);
};
