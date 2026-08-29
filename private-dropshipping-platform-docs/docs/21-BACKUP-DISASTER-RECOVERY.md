# Backup and Disaster Recovery

## Backup targets
Database, uploaded/generated assets, configuration and documentation.

## Recovery objectives
Define acceptable data loss and downtime before production use.

## Procedure
1. Confirm incident.
2. Stop destructive writes.
3. Identify last healthy backup.
4. Restore to isolated environment first.
5. Validate.
6. Switch production only after verification.

Test restoration periodically; a backup that has never been restored is not fully trusted.
