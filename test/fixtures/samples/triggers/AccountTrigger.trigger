/**
 * Dummy AccountTrigger for coverage testing.
 * Fires on Account before insert, before update, after insert, after update.
 */
trigger AccountTrigger on Account (
    before insert,
    before update,
    after insert,
    after update
) {
    if (Trigger.isBefore) {
        if (Trigger.isInsert) {
            for (Account acc : Trigger.new) {
                if (String.isBlank(acc.Description)) {
                    acc.Description = 'Created by trigger';
                }
            }
        } else if (Trigger.isUpdate) {
            for (Account acc : Trigger.new) {
                Account oldAcc = Trigger.oldMap.get(acc.Id);
                if (oldAcc != null && acc.Name != oldAcc.Name) {
                    acc.Description = 'Name updated';
                }
            }
        }
    } else if (Trigger.isAfter) {
        if (Trigger.isInsert) {
            List<Id> newIds = new List<Id>();
            for (Account acc : Trigger.new) {
                newIds.add(acc.Id);
            }
        } else if (Trigger.isUpdate) {
            for (Account acc : Trigger.new) {
                if (acc.Industry != null) {
                    acc.Rating = 'Warm';
                }
            }
        }
    }
}
