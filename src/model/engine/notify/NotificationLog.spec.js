import NotificationLog from "./NotificationLog.js";
import { Notification } from "./Notification.js";

test('limit enforcement', () => {
    const log = new NotificationLog();

    log.maxLength = 1;

    const a = new Notification({});
    const b = new Notification({});

    log.addNotification(a);
    log.addNotification(b);

    expect(log.elements.length).toBe(1);
    expect(log.elements.get(0)).toBe(b);
});